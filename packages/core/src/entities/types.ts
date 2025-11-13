export type Gender = 'male' | 'female';

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface Doctor extends BaseEntity {
  name: string;
  phone?: string;
  specialty?: string;
  active: boolean;
  revenueSharePercent: number;
}

export interface Patient extends BaseEntity {
  code: string;
  fullNameAr: string;
  fullNameEn?: string;
  gender: Gender;
  dob?: string;
  phone?: string;
  address?: string;
  notesMedical?: string;
  doctorId?: string;
}

export interface ToothStatus extends BaseEntity {
  code: string;
  labelAr: string;
  labelEn?: string;
  color?: string;
  isDefault: boolean;
}

export interface PatientTooth extends BaseEntity {
  patientId: string;
  toothNumber: number;
  statusId: string;
  notes?: string;
}

export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show';

export interface Appointment extends BaseEntity {
  patientId: string;
  doctorId: string;
  start: string;
  end: string;
  room?: string;
  status: AppointmentStatus;
  note?: string;
}

export interface Session extends BaseEntity {
  patientId: string;
  doctorId: string;
  date: string;
  procedures: string[];
  teeth: number[];
  materials: SessionMaterial[];
  durationMinutes: number;
  feeYER: number;
  attachments: SessionAttachment[];
  notes?: string;
}

export interface SessionMaterial {
  inventoryBatchId: string;
  quantity: number;
}

export interface SessionAttachment {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  url?: string;
}

export type InvoiceStatus = 'draft' | 'partial' | 'paid' | 'void';

export interface Invoice extends BaseEntity {
  patientId: string;
  date: string;
  totalYER: number;
  paidYER: number;
  status: InvoiceStatus;
  linkedSessionId?: string;
  notes?: string;
}

export interface Receipt extends BaseEntity {
  invoiceId?: string;
  date: string;
  amountYER: number;
  method: string;
  reference?: string;
  createdBy: string;
  voided: boolean;
}

export interface PaymentVoucher extends BaseEntity {
  date: string;
  amountYER: number;
  payee: string;
  reason: string;
  createdBy: string;
  voided: boolean;
}

export interface Supplier extends BaseEntity {
  name: string;
  phone?: string;
  address?: string;
  active: boolean;
}

export interface InventoryItem extends BaseEntity {
  name: string;
  unit?: string;
  sku?: string;
  minimumLevel?: number;
  notes?: string;
}

export interface InventoryBatch extends BaseEntity {
  itemId: string;
  batchNo: string;
  expiryDate: string;
  quantityIn: number;
  quantityOut: number;
  costYER: number;
}

export type LabOrderStatus = 'draft' | 'sent' | 'received' | 'cancelled';

export interface LabOrder extends BaseEntity {
  patientId: string;
  doctorId: string;
  type: string;
  sentDate: string;
  dueDate?: string;
  labName?: string;
  costYER?: number;
  status: LabOrderStatus;
  notes?: string;
}

export type LedgerDirection = 'in' | 'out';

export type LedgerType =
  | 'invoice'
  | 'receipt'
  | 'payment_voucher'
  | 'inventory_adjustment'
  | 'lab_order'
  | 'session';

export interface LedgerEntry extends BaseEntity {
  date: string;
  type: LedgerType;
  referenceId?: string;
  direction: LedgerDirection;
  amountYER: number;
  note?: string;
}

export interface AuditLog extends BaseEntity {
  timestamp: string;
  user: string;
  action: string;
  entity: string;
  entityId: string;
  delta: Record<string, unknown>;
}

export interface FileAttachment extends BaseEntity {
  ownerType: string;
  ownerId: string;
  name: string;
  mimeType: string;
  size: number;
  dataUrl?: string;
}

export interface ToothStatusDefinition {
  id: string;
  code: string;
  labelAr: string;
  color?: string;
}

export interface CashBalanceSummary {
  balanceYER: number;
  totalInYER: number;
  totalOutYER: number;
}

export interface IncomeByDoctor {
  doctorId: string;
  doctorName: string;
  incomeYER: number;
  netAfterCostsYER: number;
}

export interface PeriodIncomeExpense {
  period: string;
  incomeYER: number;
  expenseYER: number;
}

export interface SoonToExpireItem {
  batchId: string;
  itemId: string;
  itemName: string;
  expiryDate: string;
  daysRemaining: number;
}

export type UserRole = 'manager' | 'secretary';
