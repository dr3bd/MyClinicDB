import { assertIntegerYER } from '../utils/currency.js';
import { toISO } from '../utils/datetime.js';
import type { RepositoryBundle } from '../repositories/types.js';
import type { Session, SessionMaterial } from '../entities/index.js';
import { AuditService } from './auditService.js';
import { InventoryService } from './inventoryService.js';
import type { InvoiceService } from './invoiceService.js';

export interface CreateSessionInput {
  patientId: string;
  doctorId: string;
  date: string;
  procedures: string[];
  teeth: number[];
  materials: SessionMaterial[];
  durationMinutes: number;
  feeYER: number;
  notes?: string;
  attachments?: { name: string; mimeType: string; size: number; dataUrl?: string }[];
}

export interface UpdateSessionInput extends Partial<CreateSessionInput> {}

export class SessionService {
  constructor(
    private readonly repositories: RepositoryBundle,
    private readonly auditService: AuditService,
    private readonly inventoryService: InventoryService,
    private readonly invoiceService: InvoiceService
  ) {}

  private assertMaterials(materials: SessionMaterial[]): void {
    for (const material of materials) {
      if (material.quantity <= 0) {
        throw new Error('كمية المادة المستخدمة يجب أن تكون موجبة.');
      }
    }
  }

  private async persistAttachments(
    sessionId: string,
    attachments?: { name: string; mimeType: string; size: number; dataUrl?: string }[]
  ): Promise<void> {
    if (!attachments?.length) return;
    for (const attachment of attachments) {
      await this.repositories.attachments.create({
        ownerType: 'session',
        ownerId: sessionId,
        name: attachment.name,
        mimeType: attachment.mimeType,
        size: attachment.size,
        dataUrl: attachment.dataUrl
      });
    }
  }

  async create(input: CreateSessionInput): Promise<Session> {
    assertIntegerYER(input.feeYER);
    this.assertMaterials(input.materials);
    const session = await this.repositories.sessions.create({
      patientId: input.patientId,
      doctorId: input.doctorId,
      date: toISO(input.date),
      procedures: input.procedures,
      teeth: input.teeth,
      materials: input.materials,
      durationMinutes: input.durationMinutes,
      feeYER: input.feeYER,
      attachments: [],
      notes: input.notes
    });
    await this.persistAttachments(session.id, input.attachments);
    for (const material of input.materials) {
      await this.inventoryService.consume(material.inventoryBatchId, material.quantity);
    }
    await this.auditService.log('create', 'session', session.id, { session });
    return session;
  }

  async update(id: string, input: UpdateSessionInput): Promise<Session> {
    if (input.feeYER !== undefined) {
      assertIntegerYER(input.feeYER);
    }
    if (input.materials) {
      this.assertMaterials(input.materials);
    }
    const session = await this.repositories.sessions.update(id, {
      ...input,
      date: input.date ? toISO(input.date) : undefined
    });
    if (input.attachments) {
      await this.persistAttachments(id, input.attachments);
    }
    await this.auditService.log('update', 'session', id, { changes: input });
    return session;
  }

  async linkMaterials(id: string, materials: SessionMaterial[]): Promise<Session> {
    this.assertMaterials(materials);
    const session = await this.repositories.sessions.update(id, {
      materials
    });
    for (const material of materials) {
      await this.inventoryService.consume(material.inventoryBatchId, material.quantity);
    }
    await this.auditService.log('link_materials', 'session', id, { materials });
    return session;
  }

  async generateInvoice(sessionId: string) {
    const session = await this.repositories.sessions.findById(sessionId);
    if (!session) {
      throw new Error('الجلسة غير موجودة.');
    }
    return this.invoiceService.createFromSession(sessionId);
  }
}
