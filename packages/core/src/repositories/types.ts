import type {
  Appointment,
  AuditLog,
  BaseEntity,
  Doctor,
  FileAttachment,
  InventoryBatch,
  InventoryItem,
  Invoice,
  LabOrder,
  LedgerEntry,
  Patient,
  PatientTooth,
  PaymentVoucher,
  Receipt,
  Session,
  Supplier,
  ToothStatus
} from '../entities/index.js';

export type CreateInput<T extends BaseEntity> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateInput<T extends BaseEntity> = Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>;

export interface CrudRepository<T extends BaseEntity> {
  create(data: CreateInput<T>): Promise<T>;
  update(id: string, data: UpdateInput<T>): Promise<T>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<T | undefined>;
  list(): Promise<T[]>;
}

export interface PatientRepository extends CrudRepository<Patient> {
  findByCode(code: string): Promise<Patient | undefined>;
  search(term: string): Promise<Patient[]>;
}

export interface DoctorRepository extends CrudRepository<Doctor> {}

export interface ToothStatusRepository extends CrudRepository<ToothStatus> {
  findByCode(code: string): Promise<ToothStatus | undefined>;
}

export interface PatientToothRepository extends CrudRepository<PatientTooth> {
  findByPatient(patientId: string): Promise<PatientTooth[]>;
  findByPatientAndTooth(patientId: string, toothNumber: number): Promise<PatientTooth | undefined>;
}

export interface AppointmentRepository extends CrudRepository<Appointment> {
  findByDateRange(start: string, end: string): Promise<Appointment[]>;
}

export interface SessionRepository extends CrudRepository<Session> {
  findByPatient(patientId: string): Promise<Session[]>;
}

export interface InvoiceRepository extends CrudRepository<Invoice> {
  findByPatient(patientId: string): Promise<Invoice[]>;
}

export interface ReceiptRepository extends CrudRepository<Receipt> {
  findByInvoice(invoiceId: string): Promise<Receipt[]>;
}

export interface PaymentVoucherRepository extends CrudRepository<PaymentVoucher> {}

export interface SupplierRepository extends CrudRepository<Supplier> {}

export interface InventoryItemRepository extends CrudRepository<InventoryItem> {}

export interface InventoryBatchRepository extends CrudRepository<InventoryBatch> {
  findByItem(itemId: string): Promise<InventoryBatch[]>;
}

export interface LabOrderRepository extends CrudRepository<LabOrder> {
  findByPatient(patientId: string): Promise<LabOrder[]>;
}

export interface LedgerRepository extends CrudRepository<LedgerEntry> {
  listByDateRange(start: string, end: string): Promise<LedgerEntry[]>;
}

export interface AuditLogRepository extends CrudRepository<AuditLog> {
  listByEntity(entity: string, entityId: string): Promise<AuditLog[]>;
}

export interface FileAttachmentRepository extends CrudRepository<FileAttachment> {
  listByOwner(ownerType: string, ownerId: string): Promise<FileAttachment[]>;
}

export interface RepositoryBundle {
  doctors: DoctorRepository;
  patients: PatientRepository;
  toothStatuses: ToothStatusRepository;
  patientTeeth: PatientToothRepository;
  appointments: AppointmentRepository;
  sessions: SessionRepository;
  invoices: InvoiceRepository;
  receipts: ReceiptRepository;
  paymentVouchers: PaymentVoucherRepository;
  suppliers: SupplierRepository;
  inventoryItems: InventoryItemRepository;
  inventoryBatches: InventoryBatchRepository;
  labOrders: LabOrderRepository;
  ledger: LedgerRepository;
  auditLogs: AuditLogRepository;
  attachments: FileAttachmentRepository;
}
