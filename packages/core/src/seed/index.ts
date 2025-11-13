import { InMemoryRepositoryBundle } from '../repositories/inMemory.js';
import type { RepositoryBundle } from '../repositories/types.js';
import {
  AuditService,
  PatientService,
  InventoryService,
  SessionService,
  InvoiceService,
  CashboxService,
  LabService,
  PermissionService
} from '../services/index.js';

const doctorsSeed = [
  { name: 'د. علي الحميري', phone: '771111111', specialty: 'تقويم', revenueSharePercent: 35 },
  { name: 'د. نجلاء السعدي', phone: '772222222', specialty: 'تركيبات', revenueSharePercent: 40 },
  { name: 'د. أحمد الحكيمي', phone: '733333333', specialty: 'جراحة فم', revenueSharePercent: 45 }
];

const toothStatusesSeed = [
  { code: 'healthy', labelAr: 'سليم', color: '#00aa55', isDefault: true },
  { code: 'needs_root', labelAr: 'يحتاج علاج جذور', color: '#ff6b6b', isDefault: false },
  { code: 'filling', labelAr: 'حشوة', color: '#ffc107', isDefault: false }
];

const inventoryItemsSeed = [
  { name: 'مادة حشو مركب', unit: 'علبة', sku: 'MAT-001', minimumLevel: 2 },
  { name: 'إبر تخدير سنية', unit: 'علبة', sku: 'MAT-002', minimumLevel: 3 },
  { name: 'قوالب تيجان زركون', unit: 'طقم', sku: 'LAB-004', minimumLevel: 1 },
  { name: 'أدوات تعقيم أحادية', unit: 'كرتون', sku: 'SUP-011', minimumLevel: 4 },
  { name: 'معاجين تبييض', unit: 'أنبوب', sku: 'MAT-003', minimumLevel: 5 },
  { name: 'حشوات أملغم', unit: 'علبة', sku: 'MAT-004', minimumLevel: 3 },
  { name: 'مادة طبعة سيليكون', unit: 'علبة', sku: 'LAB-005', minimumLevel: 2 },
  { name: 'كمامات طبية', unit: 'كرتون', sku: 'SUP-012', minimumLevel: 6 },
  { name: 'مرايا فحص فموية', unit: 'طقم', sku: 'INS-020', minimumLevel: 2 },
  { name: 'أسلاك تقويم', unit: 'حزمة', sku: 'ORT-030', minimumLevel: 2 }
];

const suppliersSeed = [
  { name: 'مؤسسة الابتسامة للتجهيزات الطبية', phone: '01555555', address: 'صنعاء - حدة', active: true },
  { name: 'مختبر التاج الذهبي', phone: '01444444', address: 'صنعاء - التحرير', active: true }
];

const patientsSeed = Array.from({ length: 20 }).map((_, index) => ({
  fullNameAr: `مريض رقم ${index + 1}`,
  gender: index % 2 === 0 ? 'male' : 'female',
  phone: `73${(100000 + index).toString().slice(-6)}`
}));

const procedures = ['تنظيف', 'حشوة', 'تبييض', 'قلع ضرس', 'تركيب تاج'];

export async function applySeed(repositories: RepositoryBundle, currentUser: () => string = () => 'seed'): Promise<void> {
  const auditService = new AuditService(repositories, currentUser);
  const permissionService = new PermissionService(() => 'manager');
  const inventoryService = new InventoryService(repositories, auditService, permissionService);
  const invoiceService = new InvoiceService(repositories, auditService, permissionService);
  const sessionService = new SessionService(repositories, auditService, inventoryService, invoiceService, permissionService);
  const patientService = new PatientService(repositories, auditService, permissionService);
  const cashboxService = new CashboxService(repositories, auditService, invoiceService, permissionService);
  const labService = new LabService(repositories, auditService, permissionService);

  const doctorIds: string[] = [];
  for (const doctor of doctorsSeed) {
    const created = await repositories.doctors.create({
      ...doctor,
      active: true
    });
    doctorIds.push(created.id);
  }

  for (const status of toothStatusesSeed) {
    await repositories.toothStatuses.create({
      ...status,
      labelEn: status.labelAr
    });
  }

  const itemIds: string[] = [];
  for (const [index, item] of inventoryItemsSeed.entries()) {
    const created = await inventoryService.addItem(item);
    itemIds.push(created.id);
    const nearExpiryDays = 90 + index * 15;
    const longExpiryDays = 240 + index * 12;
    await inventoryService.addBatch({
      itemId: created.id,
      batchNo: `${created.id.slice(0, 4)}-B1`,
      expiryDate: new Date(Date.now() + nearExpiryDays * 86400000).toISOString(),
      quantityIn: 20 + index * 2,
      costYER: 10000 + index * 500
    });
    await inventoryService.addBatch({
      itemId: created.id,
      batchNo: `${created.id.slice(0, 4)}-B2`,
      expiryDate: new Date(Date.now() + longExpiryDays * 86400000).toISOString(),
      quantityIn: 25 + index * 3,
      costYER: 14000 + index * 600
    });
  }

  for (const supplier of suppliersSeed) {
    await repositories.suppliers.create(supplier);
  }

  const patientIds: string[] = [];
  for (const patient of patientsSeed) {
    const created = await patientService.create({
      ...patient,
      doctorId: doctorIds[Math.floor(Math.random() * doctorIds.length)]
    });
    patientIds.push(created.id);
  }

  const appointmentsToCreate = 5;
  for (let i = 0; i < appointmentsToCreate; i += 1) {
    const patientId = patientIds[i];
    const doctorId = doctorIds[i % doctorIds.length];
    await repositories.appointments.create({
      patientId,
      doctorId,
      start: new Date(Date.now() + i * 3600 * 1000).toISOString(),
      end: new Date(Date.now() + i * 3600 * 1000 + 45 * 60000).toISOString(),
      room: `عيادة ${i + 1}`,
      status: 'scheduled',
      note: 'موعد تمهيدي'
    });
  }

  const sessionsToCreate = 8;
  for (let i = 0; i < sessionsToCreate; i += 1) {
    const patientId = patientIds[i];
    const doctorId = doctorIds[i % doctorIds.length];
    const batch = (await repositories.inventoryBatches.list())[i % itemIds.length];
    const session = await sessionService.create({
      patientId,
      doctorId,
      date: new Date(Date.now() - i * 86400000).toISOString(),
      procedures: [procedures[i % procedures.length]],
      teeth: [11 + i],
      materials: [{ inventoryBatchId: batch.id, quantity: 1 }],
      durationMinutes: 60,
      feeYER: 20000 + i * 1000
    });
    if (i < 5) {
      const invoice = await sessionService.generateInvoice(session.id);
      const partialAmount = i % 2 === 0 ? invoice.totalYER : Math.floor(invoice.totalYER / 2);
      await cashboxService.createReceipt({
        invoiceId: invoice.id,
        amountYER: partialAmount,
        method: 'cash',
        createdBy: 'seed'
      });
    }
  }

  for (let i = 0; i < 6; i += 1) {
    await cashboxService.createReceipt({
      amountYER: 10000 + i * 500,
      method: 'cash',
      createdBy: 'seed'
    });
  }

  for (let i = 0; i < 3; i += 1) {
    await cashboxService.createPaymentVoucher({
      amountYER: 7000 + i * 1200,
      payee: suppliersSeed[i % suppliersSeed.length].name,
      reason: i % 2 === 0 ? 'مشتريات مواد' : 'أجور معمل',
      createdBy: 'seed'
    });
  }

  for (let i = 0; i < 2; i += 1) {
    await labService.createOrder({
      patientId: patientIds[i],
      doctorId: doctorIds[i],
      type: 'تركيبة ثابتة',
      sentDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
      labName: suppliersSeed[1].name,
      costYER: 25000,
      notes: 'قيد التنفيذ'
    });
  }
}

export async function createSeededInMemoryBundle(): Promise<InMemoryRepositoryBundle> {
  const bundle = new InMemoryRepositoryBundle();
  await applySeed(bundle);
  return bundle;
}
