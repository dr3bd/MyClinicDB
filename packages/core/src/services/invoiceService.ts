import type { Invoice, Receipt } from '../entities/index.js';
import type { RepositoryBundle } from '../repositories/types.js';
import { assertIntegerYER } from '../utils/currency.js';
import { toISO } from '../utils/datetime.js';
import { AuditService } from './auditService.js';
import { PermissionService } from './permissionService.js';

export class InvoiceService {
  constructor(
    private readonly repositories: RepositoryBundle,
    private readonly auditService: AuditService,
    private readonly permissions: PermissionService
  ) {}

  private async recalcStatus(invoice: Invoice): Promise<Invoice> {
    let status: Invoice['status'] = 'draft';
    if (invoice.paidYER === 0) {
      status = 'draft';
    } else if (invoice.paidYER >= invoice.totalYER) {
      status = 'paid';
    } else {
      status = 'partial';
    }
    const updated = await this.repositories.invoices.update(invoice.id, {
      status,
      paidYER: invoice.paidYER
    });
    return updated;
  }

  async createFromSession(sessionId: string): Promise<Invoice> {
    this.permissions.assert('sessions:invoice');
    const session = await this.repositories.sessions.findById(sessionId);
    if (!session) {
      throw new Error('لا يمكن إنشاء فاتورة لجلسة غير موجودة.');
    }
    const existing = (await this.repositories.invoices.list()).find(
      (invoice) => invoice.linkedSessionId === sessionId && invoice.status !== 'void'
    );
    if (existing) {
      return existing;
    }
    assertIntegerYER(session.feeYER);
    const invoice = await this.repositories.invoices.create({
      patientId: session.patientId,
      date: toISO(new Date()),
      totalYER: session.feeYER,
      paidYER: 0,
      status: 'draft',
      linkedSessionId: sessionId,
      notes: session.notes
    });
    await this.repositories.ledger.create({
      date: invoice.date,
      type: 'invoice',
      referenceId: invoice.id,
      direction: 'in',
      amountYER: invoice.totalYER,
      note: 'إنشاء فاتورة علاجية'
    });
    await this.auditService.log('create', 'invoice', invoice.id, { invoice });
    return invoice;
  }

  async getByPatient(patientId: string): Promise<Invoice[]> {
    return this.repositories.invoices.findByPatient(patientId);
  }

  async applyReceipt(
    invoiceId: string,
    input: { amountYER: number; method: string; reference?: string; createdBy: string; date?: string }
  ): Promise<{ invoice: Invoice; receipt: Receipt }> {
    this.permissions.assert('cashbox:receipt');
    const invoice = await this.repositories.invoices.findById(invoiceId);
    if (!invoice) {
      throw new Error('الفاتورة غير موجودة.');
    }
    if (invoice.status === 'void') {
      throw new Error('لا يمكن تحصيل فاتورة ملغاة.');
    }
    assertIntegerYER(input.amountYER);
    const receipt = await this.repositories.receipts.create({
      invoiceId,
      date: toISO(input.date ?? new Date()),
      amountYER: input.amountYER,
      method: input.method,
      reference: input.reference,
      createdBy: input.createdBy,
      voided: false
    });
    const updatedInvoice = await this.repositories.invoices.update(invoiceId, {
      paidYER: invoice.paidYER + input.amountYER
    });
    const finalInvoice = await this.recalcStatus(updatedInvoice);
    await this.repositories.ledger.create({
      date: receipt.date,
      type: 'receipt',
      referenceId: receipt.id,
      direction: 'in',
      amountYER: receipt.amountYER,
      note: `سند قبض للفاتورة ${invoiceId}`
    });
    await this.auditService.log('apply_receipt', 'invoice', invoiceId, {
      receiptId: receipt.id,
      amountYER: input.amountYER
    });
    return { invoice: finalInvoice, receipt };
  }

  async cancel(invoiceId: string, reason: string): Promise<Invoice> {
    this.permissions.assert('invoices:manage');
    const invoice = await this.repositories.invoices.findById(invoiceId);
    if (!invoice) {
      throw new Error('الفاتورة غير موجودة.');
    }
    const updated = await this.repositories.invoices.update(invoiceId, {
      status: 'void'
    });
    await this.auditService.log('void', 'invoice', invoiceId, { reason });
    return updated;
  }
}
