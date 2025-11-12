import { InMemoryRepositoryBundle } from '../repositories/inMemory.js';
import type { RepositoryBundle } from '../repositories/types.js';
import {
  AuditService,
  PatientService,
  InventoryService,
  SessionService,
  InvoiceService,
  CashboxService,
  LabService
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
  { name: 'قوالب تيجان زركون', unit: 'طقم', sku: 'LAB-004', minimumLevel: 1 },
  { name: 'قفازات طبية', unit: 'كرتون', sku: 'SUP-010', minimumLevel: 5 }
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
  const inventoryService = new InventoryService(repositories, auditService);
  const invoiceService = new InvoiceService(repositories, auditService);
  const sessionService = new SessionService(repositories, auditService, inventoryService, invoiceService);
  const patientService = new PatientService(repositories, auditService);
  const cashboxService = new CashboxService(repositories, auditService, invoiceService);
  const labService = new LabService(repositories, auditService);

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
  for (const item of inventoryItemsSeed) {
    const created = await inventoryService.addItem(item);
    itemIds.push(created.id);
    await inventoryService.addBatch({
      itemId: created.id,
      batchNo: `${created.id.slice(0, 4)}-B1`,
      expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 250).toISOString(),
      quantityIn: 25,
      costYER: 15000
    });
    await inventoryService.addBatch({
      itemId: created.id,
      batchNo: `${created.id.slice(0, 4)}-B2`,
      expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 400).toISOString(),
      quantityIn: 30,
      costYER: 20000
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
