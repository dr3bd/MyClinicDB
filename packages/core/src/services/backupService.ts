import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';
import initSqlJs from 'sql.js';
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
import type { RepositoryBundle } from '../repositories/types.js';
import {
  CREATE_INDEX_STATEMENTS,
  CREATE_TABLE_STATEMENTS,
  SQLITE_PRAGMAS
} from '../db/schema.js';

export interface BackupJSONEnvelope {
  schemaVersion: string;
  encrypted: boolean;
  data: string;
  iv?: string;
  salt?: string;
  tag?: string;
}

export interface BackupData {
  doctors: Doctor[];
  patients: Patient[];
  toothStatuses: ToothStatus[];
  patientTeeth: PatientTooth[];
  appointments: Appointment[];
  sessions: Session[];
  invoices: Invoice[];
  receipts: Receipt[];
  paymentVouchers: PaymentVoucher[];
  suppliers: Supplier[];
  inventoryItems: InventoryItem[];
  inventoryBatches: InventoryBatch[];
  labOrders: LabOrder[];
  ledger: LedgerEntry[];
  auditLogs: AuditLog[];
  attachments: FileAttachment[];
}

const SCHEMA_VERSION = '2024-03-01';

function encodeBase64(data: string | Uint8Array): string {
  return Buffer.from(data).toString('base64');
}

function decodeBase64(data: string): Buffer {
  return Buffer.from(data, 'base64');
}

export class BackupService {
  constructor(private readonly repositories: RepositoryBundle) {}

  private async collectData(): Promise<BackupData> {
    const [
      doctors,
      patients,
      toothStatuses,
      patientTeeth,
      appointments,
      sessions,
      invoices,
      receipts,
      paymentVouchers,
      suppliers,
      inventoryItems,
      inventoryBatches,
      labOrders,
      ledger,
      auditLogs,
      attachments
    ] = await Promise.all([
      this.repositories.doctors.list(),
      this.repositories.patients.list(),
      this.repositories.toothStatuses.list(),
      this.repositories.patientTeeth.list(),
      this.repositories.appointments.list(),
      this.repositories.sessions.list(),
      this.repositories.invoices.list(),
      this.repositories.receipts.list(),
      this.repositories.paymentVouchers.list(),
      this.repositories.suppliers.list(),
      this.repositories.inventoryItems.list(),
      this.repositories.inventoryBatches.list(),
      this.repositories.labOrders.list(),
      this.repositories.ledger.list(),
      this.repositories.auditLogs.list(),
      this.repositories.attachments.list()
    ]);
    return {
      doctors,
      patients,
      toothStatuses,
      patientTeeth,
      appointments,
      sessions,
      invoices,
      receipts,
      paymentVouchers,
      suppliers,
      inventoryItems,
      inventoryBatches,
      labOrders,
      ledger,
      auditLogs,
      attachments
    };
  }

  async exportJSON(password?: string): Promise<BackupJSONEnvelope> {
    const data = await this.collectData();
    const payload = JSON.stringify({ schemaVersion: SCHEMA_VERSION, data });
    if (!password) {
      return {
        schemaVersion: SCHEMA_VERSION,
        encrypted: false,
        data: encodeBase64(payload)
      };
    }
    const salt = randomBytes(16);
    const key = scryptSync(password, salt, 32);
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(payload, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return {
      schemaVersion: SCHEMA_VERSION,
      encrypted: true,
      data: encodeBase64(encrypted),
      iv: encodeBase64(iv),
      salt: encodeBase64(salt),
      tag: encodeBase64(tag)
    };
  }

  async importJSON(envelope: BackupJSONEnvelope, password?: string): Promise<void> {
    if (envelope.encrypted && !password) {
      throw new Error('ملف النسخة الاحتياطية مشفر ويتطلب كلمة مرور.');
    }
    let payloadBuffer: Buffer;
    if (envelope.encrypted) {
      const salt = envelope.salt ? decodeBase64(envelope.salt) : undefined;
      const iv = envelope.iv ? decodeBase64(envelope.iv) : undefined;
      const tag = envelope.tag ? decodeBase64(envelope.tag) : undefined;
      if (!salt || !iv || !tag) {
        throw new Error('بيانات التشفير غير مكتملة.');
      }
      const key = scryptSync(password ?? '', salt, 32);
      const decipher = createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(tag);
      payloadBuffer = Buffer.concat([decipher.update(decodeBase64(envelope.data)), decipher.final()]);
    } else {
      payloadBuffer = decodeBase64(envelope.data);
    }
    const parsed = JSON.parse(payloadBuffer.toString('utf8')) as { schemaVersion: string; data: BackupData };
    if (parsed.schemaVersion !== SCHEMA_VERSION) {
      throw new Error('إصدار المخطط غير مدعوم.');
    }
    const data = parsed.data;
    const load = async <T>(repo: RepositoryBundle[keyof RepositoryBundle], records: T[]) => {
      const candidate = repo as unknown as { load?: (items: T[]) => Promise<void> | void };
      if (candidate.load) {
        await candidate.load(records);
      } else {
        const list = (await (repo as { list: () => Promise<T[]> }).list()) as T[];
        for (const existing of list as unknown as { id: string }[]) {
          await (repo as { delete: (id: string) => Promise<void> }).delete(existing.id);
        }
        for (const record of records as unknown as (T & { id: string })[]) {
          await (repo as { create: (data: unknown) => Promise<unknown> }).create(record);
        }
      }
    };
    await load(this.repositories.doctors, data.doctors);
    await load(this.repositories.patients, data.patients);
    await load(this.repositories.toothStatuses, data.toothStatuses);
    await load(this.repositories.patientTeeth, data.patientTeeth);
    await load(this.repositories.appointments, data.appointments);
    await load(this.repositories.sessions, data.sessions);
    await load(this.repositories.invoices, data.invoices);
    await load(this.repositories.receipts, data.receipts);
    await load(this.repositories.paymentVouchers, data.paymentVouchers);
    await load(this.repositories.suppliers, data.suppliers);
    await load(this.repositories.inventoryItems, data.inventoryItems);
    await load(this.repositories.inventoryBatches, data.inventoryBatches);
    await load(this.repositories.labOrders, data.labOrders);
    await load(this.repositories.ledger, data.ledger);
    await load(this.repositories.auditLogs, data.auditLogs);
    await load(this.repositories.attachments, data.attachments);
  }

  async exportSQLite(): Promise<Uint8Array> {
    const SQL = await initSqlJs();
    const db = new SQL.Database();
    const data = await this.collectData();
    for (const pragma of SQLITE_PRAGMAS) {
      db.run(pragma);
    }
    for (const statement of CREATE_TABLE_STATEMENTS) {
      db.run(statement);
    }
    for (const statement of CREATE_INDEX_STATEMENTS) {
      db.run(statement);
    }
    const insertRow = (table: string, columns: string[], row: unknown[]) => {
      const stmt = db.prepare(`INSERT INTO ${table} (${columns.join(',')}) VALUES (${columns.map(() => '?').join(',')})`);
      stmt.run(row);
      stmt.free();
    };
    const bool = (value: boolean) => (value ? 1 : 0);
    for (const doctor of data.doctors) {
      insertRow(
        'doctor',
        ['id', 'name', 'phone', 'specialty', 'active', 'revenue_share_percent', 'created_at', 'updated_at'],
        [
          doctor.id,
          doctor.name,
          doctor.phone ?? null,
          doctor.specialty ?? null,
          bool(doctor.active),
          doctor.revenueSharePercent,
          doctor.createdAt,
          doctor.updatedAt
        ]
      );
    }
    for (const patient of data.patients) {
      insertRow(
        'patient',
        [
          'id',
          'code',
          'full_name_ar',
          'full_name_en',
          'gender',
          'dob',
          'phone',
          'address',
          'notes_medical',
          'doctor_id',
          'created_at',
          'updated_at'
        ],
        [
          patient.id,
          patient.code,
          patient.fullNameAr,
          patient.fullNameEn ?? null,
          patient.gender,
          patient.dob ?? null,
          patient.phone ?? null,
          patient.address ?? null,
          patient.notesMedical ?? null,
          patient.doctorId ?? null,
          patient.createdAt,
          patient.updatedAt
        ]
      );
    }
    for (const status of data.toothStatuses) {
      insertRow(
        'tooth_status',
        ['id', 'code', 'label_ar', 'label_en', 'color', 'is_default', 'created_at', 'updated_at'],
        [
          status.id,
          status.code,
          status.labelAr,
          status.labelEn ?? null,
          status.color ?? null,
          bool(status.isDefault),
          status.createdAt,
          status.updatedAt
        ]
      );
    }
    for (const tooth of data.patientTeeth) {
      insertRow(
        'patient_tooth',
        ['id', 'patient_id', 'tooth_number', 'status_id', 'notes', 'created_at', 'updated_at'],
        [
          tooth.id,
          tooth.patientId,
          tooth.toothNumber,
          tooth.statusId,
          tooth.notes ?? null,
          tooth.createdAt,
          tooth.updatedAt
        ]
      );
    }
    for (const appointment of data.appointments) {
      insertRow(
        'appointment',
        ['id', 'patient_id', 'doctor_id', 'start', 'end', 'room', 'status', 'note', 'created_at', 'updated_at'],
        [
          appointment.id,
          appointment.patientId,
          appointment.doctorId,
          appointment.start,
          appointment.end,
          appointment.room ?? null,
          appointment.status,
          appointment.note ?? null,
          appointment.createdAt,
          appointment.updatedAt
        ]
      );
    }
    for (const invoice of data.invoices) {
      insertRow(
        'invoice',
        [
          'id',
          'patient_id',
          'date',
          'total_yer',
          'paid_yer',
          'status',
          'linked_session_id',
          'notes',
          'created_at',
          'updated_at'
        ],
        [
          invoice.id,
          invoice.patientId,
          invoice.date,
          invoice.totalYER,
          invoice.paidYER,
          invoice.status,
          invoice.linkedSessionId ?? null,
          invoice.notes ?? null,
          invoice.createdAt,
          invoice.updatedAt
        ]
      );
    }
    for (const receipt of data.receipts) {
      insertRow(
        'receipt',
        [
          'id',
          'invoice_id',
          'date',
          'amount_yer',
          'method',
          'reference',
          'created_by',
          'voided',
          'created_at',
          'updated_at'
        ],
        [
          receipt.id,
          receipt.invoiceId ?? null,
          receipt.date,
          receipt.amountYER,
          receipt.method,
          receipt.reference ?? null,
          receipt.createdBy,
          bool(receipt.voided),
          receipt.createdAt,
          receipt.updatedAt
        ]
      );
    }
    for (const voucher of data.paymentVouchers) {
      insertRow(
        'payment_voucher',
        ['id', 'date', 'amount_yer', 'payee', 'reason', 'created_by', 'voided', 'created_at', 'updated_at'],
        [
          voucher.id,
          voucher.date,
          voucher.amountYER,
          voucher.payee,
          voucher.reason,
          voucher.createdBy,
          bool(voucher.voided),
          voucher.createdAt,
          voucher.updatedAt
        ]
      );
    }
    for (const session of data.sessions) {
      insertRow(
        'session',
        [
          'id',
          'patient_id',
          'doctor_id',
          'date',
          'procedures_json',
          'teeth_json',
          'materials_json',
          'duration_min',
          'fee_yer',
          'attachments_json',
          'notes',
          'created_at',
          'updated_at'
        ],
        [
          session.id,
          session.patientId,
          session.doctorId,
          session.date,
          JSON.stringify(session.procedures),
          JSON.stringify(session.teeth),
          JSON.stringify(session.materials),
          session.durationMinutes,
          session.feeYER,
          JSON.stringify(session.attachments),
          session.notes ?? null,
          session.createdAt,
          session.updatedAt
        ]
      );
    }
    for (const item of data.inventoryItems) {
      insertRow(
        'inventory_item',
        ['id', 'name', 'unit', 'sku', 'min_level', 'notes', 'created_at', 'updated_at'],
        [
          item.id,
          item.name,
          item.unit ?? null,
          item.sku ?? null,
          item.minimumLevel ?? null,
          item.notes ?? null,
          item.createdAt,
          item.updatedAt
        ]
      );
    }
    for (const batch of data.inventoryBatches) {
      insertRow(
        'inventory_batch',
        [
          'id',
          'item_id',
          'batch_no',
          'expiry_date',
          'qty_in',
          'qty_out',
          'cost_yer',
          'created_at',
          'updated_at'
        ],
        [
          batch.id,
          batch.itemId,
          batch.batchNo,
          batch.expiryDate,
          batch.quantityIn,
          batch.quantityOut,
          batch.costYER,
          batch.createdAt,
          batch.updatedAt
        ]
      );
    }
    for (const supplier of data.suppliers) {
      insertRow(
        'supplier',
        ['id', 'name', 'phone', 'address', 'active', 'created_at', 'updated_at'],
        [
          supplier.id,
          supplier.name,
          supplier.phone ?? null,
          supplier.address ?? null,
          bool(supplier.active),
          supplier.createdAt,
          supplier.updatedAt
        ]
      );
    }
    for (const order of data.labOrders) {
      insertRow(
        'lab_order',
        [
          'id',
          'patient_id',
          'doctor_id',
          'type',
          'sent_date',
          'due_date',
          'lab_name',
          'cost_yer',
          'status',
          'notes',
          'created_at',
          'updated_at'
        ],
        [
          order.id,
          order.patientId,
          order.doctorId,
          order.type,
          order.sentDate,
          order.dueDate ?? null,
          order.labName ?? null,
          order.costYER ?? null,
          order.status,
          order.notes ?? null,
          order.createdAt,
          order.updatedAt
        ]
      );
    }
    for (const entry of data.ledger) {
      insertRow(
        'ledger',
        ['id', 'date', 'type', 'ref_id', 'direction', 'amount_yer', 'note', 'created_at', 'updated_at'],
        [
          entry.id,
          entry.date,
          entry.type,
          entry.referenceId ?? null,
          entry.direction,
          entry.amountYER,
          entry.note ?? null,
          entry.createdAt,
          entry.updatedAt
        ]
      );
    }
    for (const log of data.auditLogs) {
      insertRow(
        'audit_log',
        ['id', 'ts', 'user', 'action', 'entity', 'entity_id', 'delta_json', 'created_at', 'updated_at'],
        [
          log.id,
          log.timestamp,
          log.user,
          log.action,
          log.entity,
          log.entityId,
          JSON.stringify(log.delta),
          log.createdAt,
          log.updatedAt
        ]
      );
    }
    for (const attachment of data.attachments) {
      insertRow(
        'attachment',
        [
          'id',
          'owner_type',
          'owner_id',
          'name',
          'mime_type',
          'size',
          'data_url',
          'created_at',
          'updated_at'
        ],
        [
          attachment.id,
          attachment.ownerType,
          attachment.ownerId,
          attachment.name,
          attachment.mimeType,
          attachment.size,
          attachment.dataUrl ?? null,
          attachment.createdAt,
          attachment.updatedAt
        ]
      );
    }
    return db.export();
  }
}
