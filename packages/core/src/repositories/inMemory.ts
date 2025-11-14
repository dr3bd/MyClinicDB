import { v4 as uuid } from 'uuid';
import type {
  Appointment,
  AuditLog,
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
import type {
  AppointmentRepository,
  AuditLogRepository,
  CrudRepository,
  DoctorRepository,
  FileAttachmentRepository,
  InventoryBatchRepository,
  InventoryItemRepository,
  InvoiceRepository,
  LabOrderRepository,
  LedgerRepository,
  PatientRepository,
  PatientToothRepository,
  PaymentVoucherRepository,
  ReceiptRepository,
  RepositoryBundle as RepositoryBundleType,
  SessionRepository,
  SupplierRepository,
  ToothStatusRepository
} from './types.js';
import type { BaseEntity } from '../entities/types.js';

const nowIso = () => new Date().toISOString();

class BaseInMemoryRepository<T extends BaseEntity>
  implements CrudRepository<T>
{
  protected items: Map<string, T> = new Map();

  async load(items: T[]): Promise<void> {
    this.items.clear();
    for (const item of items) {
      this.items.set(item.id, structuredClone(item));
    }
  }

  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const entity: T = {
      ...(data as T),
      id: uuid(),
      createdAt: nowIso(),
      updatedAt: nowIso()
    };
    this.items.set(entity.id, entity);
    return structuredClone(entity);
  }

  async update(id: string, data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>): Promise<T> {
    const existing = this.items.get(id);
    if (!existing) {
      throw new Error(`Entity not found: ${id}`);
    }
    const updated: T = {
      ...existing,
      ...(data as Partial<T>),
      id,
      updatedAt: nowIso()
    };
    this.items.set(id, updated);
    return structuredClone(updated);
  }

  async delete(id: string): Promise<void> {
    this.items.delete(id);
  }

  async findById(id: string): Promise<T | undefined> {
    const item = this.items.get(id);
    return item ? structuredClone(item) : undefined;
  }

  async list(): Promise<T[]> {
    return Array.from(this.items.values()).map((item) => structuredClone(item));
  }
}

class PatientRepo
  extends BaseInMemoryRepository<Patient>
  implements PatientRepository
{
  async findByCode(code: string): Promise<Patient | undefined> {
    return (
      await this.list()
    ).find((patient) => patient.code.toLowerCase() === code.toLowerCase());
  }

  async search(term: string): Promise<Patient[]> {
    const normalized = term.trim().toLowerCase();
    if (!normalized) {
      return this.list();
    }
    return (
      await this.list()
    ).filter(
      (patient) =>
        patient.fullNameAr.toLowerCase().includes(normalized) ||
        (patient.phone ? patient.phone.includes(normalized) : false) ||
        patient.code.toLowerCase().includes(normalized)
    );
  }
}

class DoctorRepo extends BaseInMemoryRepository<Doctor> implements DoctorRepository {}

class ToothStatusRepo
  extends BaseInMemoryRepository<ToothStatus>
  implements ToothStatusRepository
{
  async findByCode(code: string): Promise<ToothStatus | undefined> {
    return (
      await this.list()
    ).find((status) => status.code.toLowerCase() === code.toLowerCase());
  }
}

class PatientToothRepo
  extends BaseInMemoryRepository<PatientTooth>
  implements PatientToothRepository
{
  async findByPatient(patientId: string): Promise<PatientTooth[]> {
    return (
      await this.list()
    ).filter((tooth) => tooth.patientId === patientId);
  }

  async findByPatientAndTooth(
    patientId: string,
    toothNumber: number
  ): Promise<PatientTooth | undefined> {
    return (
      await this.list()
    ).find(
      (tooth) => tooth.patientId === patientId && tooth.toothNumber === toothNumber
    );
  }
}

class AppointmentRepo
  extends BaseInMemoryRepository<Appointment>
  implements AppointmentRepository
{
  async findByDateRange(start: string, end: string): Promise<Appointment[]> {
    const startDate = new Date(start).getTime();
    const endDate = new Date(end).getTime();
    return (
      await this.list()
    ).filter((appointment) => {
      const startTime = new Date(appointment.start).getTime();
      return startTime >= startDate && startTime <= endDate;
    });
  }
}

class SessionRepo extends BaseInMemoryRepository<Session> implements SessionRepository {
  async findByPatient(patientId: string): Promise<Session[]> {
    return (
      await this.list()
    ).filter((session) => session.patientId === patientId);
  }
}

class InvoiceRepo extends BaseInMemoryRepository<Invoice> implements InvoiceRepository {
  async findByPatient(patientId: string): Promise<Invoice[]> {
    return (
      await this.list()
    ).filter((invoice) => invoice.patientId === patientId);
  }
}

class ReceiptRepo extends BaseInMemoryRepository<Receipt> implements ReceiptRepository {
  async findByInvoice(invoiceId: string): Promise<Receipt[]> {
    return (
      await this.list()
    ).filter((receipt) => receipt.invoiceId === invoiceId);
  }
}

class PaymentVoucherRepo
  extends BaseInMemoryRepository<PaymentVoucher>
  implements PaymentVoucherRepository {}

class SupplierRepo extends BaseInMemoryRepository<Supplier> implements SupplierRepository {}

class InventoryItemRepo
  extends BaseInMemoryRepository<InventoryItem>
  implements InventoryItemRepository {}

class InventoryBatchRepo
  extends BaseInMemoryRepository<InventoryBatch>
  implements InventoryBatchRepository
{
  async findByItem(itemId: string): Promise<InventoryBatch[]> {
    return (
      await this.list()
    ).filter((batch) => batch.itemId === itemId);
  }
}

class LabOrderRepo extends BaseInMemoryRepository<LabOrder> implements LabOrderRepository {
  async findByPatient(patientId: string): Promise<LabOrder[]> {
    return (
      await this.list()
    ).filter((order) => order.patientId === patientId);
  }
}

class LedgerRepo extends BaseInMemoryRepository<LedgerEntry> implements LedgerRepository {
  async listByDateRange(start: string, end: string): Promise<LedgerEntry[]> {
    const startDate = new Date(start).getTime();
    const endDate = new Date(end).getTime();
    return (
      await this.list()
    ).filter((entry) => {
      const entryDate = new Date(entry.date).getTime();
      return entryDate >= startDate && entryDate <= endDate;
    });
  }
}

class AuditLogRepo extends BaseInMemoryRepository<AuditLog> implements AuditLogRepository {
  async listByEntity(entity: string, entityId: string): Promise<AuditLog[]> {
    return (
      await this.list()
    ).filter((log) => log.entity === entity && log.entityId === entityId);
  }
}

class FileAttachmentRepo
  extends BaseInMemoryRepository<FileAttachment>
  implements FileAttachmentRepository
{
  async listByOwner(ownerType: string, ownerId: string): Promise<FileAttachment[]> {
    return (
      await this.list()
    ).filter((attachment) => attachment.ownerType === ownerType && attachment.ownerId === ownerId);
  }
}

export class InMemoryRepositoryBundle implements RepositoryBundleType {
  doctors: DoctorRepository = new DoctorRepo();
  patients: PatientRepository = new PatientRepo();
  toothStatuses: ToothStatusRepository = new ToothStatusRepo();
  patientTeeth: PatientToothRepository = new PatientToothRepo();
  appointments: AppointmentRepository = new AppointmentRepo();
  sessions: SessionRepository = new SessionRepo();
  invoices: InvoiceRepository = new InvoiceRepo();
  receipts: ReceiptRepository = new ReceiptRepo();
  paymentVouchers: PaymentVoucherRepository = new PaymentVoucherRepo();
  suppliers: SupplierRepository = new SupplierRepo();
  inventoryItems: InventoryItemRepository = new InventoryItemRepo();
  inventoryBatches: InventoryBatchRepository = new InventoryBatchRepo();
  labOrders: LabOrderRepository = new LabOrderRepo();
  ledger: LedgerRepository = new LedgerRepo();
  auditLogs: AuditLogRepository = new AuditLogRepo();
  attachments: FileAttachmentRepository = new FileAttachmentRepo();
}

export type { RepositoryBundle } from './types.js';
