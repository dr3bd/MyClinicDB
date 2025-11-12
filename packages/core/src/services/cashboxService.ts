import type { PaymentVoucher, Receipt } from '../entities/index.js';
import type { RepositoryBundle } from '../repositories/types.js';
import { assertIntegerYER } from '../utils/currency.js';
import { toISO } from '../utils/datetime.js';
import { AuditService } from './auditService.js';
import { InvoiceService } from './invoiceService.js';

export class CashboxService {
  constructor(
    private readonly repositories: RepositoryBundle,
    private readonly auditService: AuditService,
    private readonly invoiceService: InvoiceService
  ) {}

  async createReceipt(input: {
    invoiceId?: string;
    amountYER: number;
    method: string;
    reference?: string;
    createdBy: string;
    date?: string;
  }): Promise<Receipt> {
    assertIntegerYER(input.amountYER);
    if (input.invoiceId) {
      const { receipt } = await this.invoiceService.applyReceipt(input.invoiceId, input);
      return receipt;
    }
    const receipt = await this.repositories.receipts.create({
      invoiceId: undefined,
      date: toISO(input.date ?? new Date()),
      amountYER: input.amountYER,
      method: input.method,
      reference: input.reference,
      createdBy: input.createdBy,
      voided: false
    });
    await this.repositories.ledger.create({
      date: receipt.date,
      type: 'receipt',
      referenceId: receipt.id,
      direction: 'in',
      amountYER: receipt.amountYER,
      note: 'سند قبض مستقل'
    });
    await this.auditService.log('create', 'receipt', receipt.id, { receipt });
    return receipt;
  }

  async voidReceipt(id: string, reason: string): Promise<Receipt> {
    const receipt = await this.repositories.receipts.findById(id);
    if (!receipt) {
      throw new Error('سند القبض غير موجود.');
    }
    if (receipt.voided) {
      return receipt;
    }
    const updated = await this.repositories.receipts.update(id, {
      voided: true
    });
    await this.repositories.ledger.create({
      date: toISO(new Date()),
      type: 'receipt',
      referenceId: id,
      direction: 'out',
      amountYER: receipt.amountYER,
      note: `إلغاء سند قبض: ${reason}`
    });
    if (receipt.invoiceId) {
      const invoice = await this.repositories.invoices.findById(receipt.invoiceId);
      if (invoice) {
        await this.repositories.invoices.update(invoice.id, {
          paidYER: Math.max(0, invoice.paidYER - receipt.amountYER),
          status: invoice.paidYER - receipt.amountYER <= 0 ? 'draft' : 'partial'
        });
      }
    }
    await this.auditService.log('void', 'receipt', id, { reason });
    return updated;
  }

  async createPaymentVoucher(input: {
    amountYER: number;
    payee: string;
    reason: string;
    createdBy: string;
    date?: string;
  }): Promise<PaymentVoucher> {
    assertIntegerYER(input.amountYER);
    const voucher = await this.repositories.paymentVouchers.create({
      date: toISO(input.date ?? new Date()),
      amountYER: input.amountYER,
      payee: input.payee,
      reason: input.reason,
      createdBy: input.createdBy,
      voided: false
    });
    await this.repositories.ledger.create({
      date: voucher.date,
      type: 'payment_voucher',
      referenceId: voucher.id,
      direction: 'out',
      amountYER: voucher.amountYER,
      note: input.reason
    });
    await this.auditService.log('create', 'payment_voucher', voucher.id, { voucher });
    return voucher;
  }

  async voidPayment(id: string, reason: string): Promise<PaymentVoucher> {
    const voucher = await this.repositories.paymentVouchers.findById(id);
    if (!voucher) {
      throw new Error('سند الدفع غير موجود.');
    }
    if (voucher.voided) {
      return voucher;
    }
    const updated = await this.repositories.paymentVouchers.update(id, {
      voided: true
    });
    await this.repositories.ledger.create({
      date: toISO(new Date()),
      type: 'payment_voucher',
      referenceId: id,
      direction: 'in',
      amountYER: voucher.amountYER,
      note: `إلغاء سند دفع: ${reason}`
    });
    await this.auditService.log('void', 'payment_voucher', id, { reason });
    return updated;
  }
}
