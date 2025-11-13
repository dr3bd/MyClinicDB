import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryRepositoryBundle,
  AuditService,
  PatientService,
  InventoryService,
  SessionService,
  InvoiceService,
  CashboxService,
  LabService,
  ReportService,
  BackupService,
  PermissionService,
  formatYER,
  type UserRole
} from '../src/index.js';

const currentUser = () => 'tester';

describe('MyClinicDB core services', () => {
  let repositories: InMemoryRepositoryBundle;
  let auditService: AuditService;
  let patientService: PatientService;
  let inventoryService: InventoryService;
  let invoiceService: InvoiceService;
  let sessionService: SessionService;
  let cashboxService: CashboxService;
  let labService: LabService;
  let reportService: ReportService;
  let backupService: BackupService;
  let permissionService: PermissionService;
  let role: UserRole;

  beforeEach(async () => {
    repositories = new InMemoryRepositoryBundle();
    role = 'manager';
    permissionService = new PermissionService(() => role);
    auditService = new AuditService(repositories, currentUser);
    inventoryService = new InventoryService(repositories, auditService, permissionService);
    invoiceService = new InvoiceService(repositories, auditService, permissionService);
    sessionService = new SessionService(repositories, auditService, inventoryService, invoiceService, permissionService);
    patientService = new PatientService(repositories, auditService, permissionService);
    cashboxService = new CashboxService(repositories, auditService, invoiceService, permissionService);
    labService = new LabService(repositories, auditService, permissionService);
    reportService = new ReportService(repositories, permissionService);
    backupService = new BackupService(repositories, permissionService);
    await repositories.doctors.create({
      name: 'د. علي',
      phone: '7777777',
      specialty: 'تقويم',
      active: true,
      revenueSharePercent: 40
    });
    await repositories.toothStatuses.create({
      code: 'healthy',
      labelAr: 'سليم',
      labelEn: 'Healthy',
      color: '#00aa55',
      isDefault: true
    });
    await repositories.toothStatuses.create({
      code: 'filling',
      labelAr: 'حشوة',
      labelEn: 'Filling',
      color: '#ffaa00',
      isDefault: false
    });
  });

  it('ينفذ تدفق جلسة → فاتورة → سند قبض باستخدام الريال اليمني فقط', async () => {
    const patient = await patientService.create({
      fullNameAr: 'أحمد محمد',
      gender: 'male',
      phone: '7355555',
      doctorId: (await repositories.doctors.list())[0].id
    });
    expect(patient.code).toMatch(/^PT-/);

    const toothStatuses = await repositories.toothStatuses.list();
    const fillingStatus = toothStatuses.find((status) => status.code === 'filling');
    expect(fillingStatus).toBeDefined();
    await patientService.setToothStatus(patient.id, 11, fillingStatus!.id, 'حشوة ضرس');

    const item = await inventoryService.addItem({ name: 'مادة حشو مركب', unit: 'علبة' });
    const batch = await inventoryService.addBatch({
      itemId: item.id,
      batchNo: 'B-001',
      expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 150).toISOString(),
      quantityIn: 10,
      costYER: 5000
    });

    const session = await sessionService.create({
      patientId: patient.id,
      doctorId: (await repositories.doctors.list())[0].id,
      date: new Date().toISOString(),
      procedures: ['تنظيف', 'حشوة مركب'],
      teeth: [11],
      materials: [{ inventoryBatchId: batch.id, quantity: 1 }],
      durationMinutes: 45,
      feeYER: 15000
    });
    expect(session.materials).toHaveLength(1);

    const invoice = await sessionService.generateInvoice(session.id);
    expect(invoice.totalYER).toBe(15000);
    expect(invoice.status).toBe('draft');

    const receipt = await cashboxService.createReceipt({
      invoiceId: invoice.id,
      amountYER: 15000,
      method: 'cash',
      createdBy: 'tester'
    });
    expect(receipt.amountYER).toBe(15000);
    const updatedInvoice = await repositories.invoices.findById(invoice.id);
    expect(updatedInvoice?.status).toBe('paid');

    const soonExpiring = await inventoryService.soonToExpire(6);
    expect(soonExpiring[0]?.itemName).toBe('مادة حشو مركب');

    const cashBalance = await reportService.cashBalance();
    expect(cashBalance.balanceYER).toBeGreaterThan(0);

    await labService.createOrder({
      patientId: patient.id,
      doctorId: (await repositories.doctors.list())[0].id,
      type: 'تاج زركون',
      sentDate: new Date().toISOString()
    });
    const labOrders = await labService.listByPatient(patient.id);
    expect(labOrders).toHaveLength(1);
  });

  it('exports and imports encrypted backups', async () => {
    await patientService.create({
      fullNameAr: 'سارة علي',
      gender: 'female'
    });
    const envelope = await backupService.exportJSON('secret123');
    expect(envelope.encrypted).toBe(true);
    const sqlite = await backupService.exportSQLite();
    expect(sqlite).toBeInstanceOf(Uint8Array);

    const newRepositories = new InMemoryRepositoryBundle();
    const newBackupService = new BackupService(newRepositories, new PermissionService(() => 'manager'));
    await newBackupService.importJSON(envelope, 'secret123');
    const restoredPatients = await newRepositories.patients.list();
    expect(restoredPatients.find((p) => p.fullNameAr === 'سارة علي')).toBeTruthy();
  });

  it('prevents secretary from running restricted backups', async () => {
    role = 'secretary';
    await expect(backupService.exportJSON()).rejects.toThrow('ليست لديك صلاحية');
    await expect(backupService.exportSQLite()).rejects.toThrow('ليست لديك صلاحية');
  });

  it('guards against tax fields and foreign currencies', async () => {
    await expect(
      repositories.suppliers.create({
        name: 'شركة افتراضية',
        active: true,
        vat: 5
      } as any)
    ).rejects.toThrow('النظام لا يدعم أي حقول أو معاملات ضريبية.');

    await expect(
      repositories.receipts.create({
        invoiceId: undefined,
        date: new Date().toISOString(),
        amountYER: 5000,
        method: 'cash',
        reference: undefined,
        createdBy: 'tester',
        voided: false,
        currency: 'USD'
      } as any)
    ).rejects.toThrow('النظام يدعم الريال اليمني فقط.');
  });

  it('formats YER values including negatives without breaking Arabic output', () => {
    expect(formatYER(123456)).toBe('١٢٣٬٤٥٦ ريال يمني');
    expect(formatYER(-9870)).toBe('−٩٬٨٧٠ ريال يمني');
    expect(formatYER(5000, 'en-US')).toBe('5,000 YER');
    expect(formatYER(-2500, 'en-US')).toBe('-2,500 YER');
  });
});
