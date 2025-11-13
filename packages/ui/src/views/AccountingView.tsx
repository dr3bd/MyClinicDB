import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import type { CashBalanceSummary, LedgerEntry, PaymentVoucher, Receipt } from '@myclinicdb/core';
import { formatYER } from '@myclinicdb/core';
import { DataTable } from '../components/DataTable.js';
import { KPIWidget } from '../components/KPIWidget.js';
import '../components/styles.css';

export interface AccountingViewProps {
  ledger: LedgerEntry[];
  receipts: Receipt[];
  payments: PaymentVoucher[];
  summary: CashBalanceSummary;
  locale?: 'ar' | 'en';
}

export function AccountingView({ ledger, receipts, payments, summary, locale = 'ar' }: AccountingViewProps) {
  const dateLocale = locale === 'ar' ? 'ar-YE' : 'en-US';
  const ledgerColumns = useMemo<ColumnDef<LedgerEntry>[]>(
    () => [
      {
        header: 'التاريخ',
        accessorKey: 'date',
        cell: ({ row }) => new Date(row.original.date).toLocaleString(dateLocale)
      },
      { header: 'النوع', accessorKey: 'type' },
      { header: 'الاتجاه', accessorKey: 'direction' },
      {
        header: 'المبلغ',
        accessorKey: 'amountYER',
        cell: ({ row }) => formatYER(row.original.amountYER * (row.original.direction === 'out' ? -1 : 1), dateLocale)
      },
      { header: 'ملاحظة', accessorKey: 'note' }
    ],
    [dateLocale]
  );

  const receiptColumns = useMemo<ColumnDef<Receipt>[]>(
    () => [
      {
        header: 'التاريخ',
        accessorKey: 'date',
        cell: ({ row }) => new Date(row.original.date).toLocaleDateString(dateLocale)
      },
      { header: 'المبلغ', accessorKey: 'amountYER', cell: ({ row }) => formatYER(row.original.amountYER, dateLocale) },
      { header: 'الطريقة', accessorKey: 'method' },
      { header: 'المستخدم', accessorKey: 'createdBy' }
    ],
    [dateLocale]
  );

  const paymentColumns = useMemo<ColumnDef<PaymentVoucher>[]>(
    () => [
      {
        header: 'التاريخ',
        accessorKey: 'date',
        cell: ({ row }) => new Date(row.original.date).toLocaleDateString(dateLocale)
      },
      { header: 'المبلغ', accessorKey: 'amountYER', cell: ({ row }) => formatYER(row.original.amountYER, dateLocale) },
      { header: 'المستفيد', accessorKey: 'payee' },
      { header: 'السبب', accessorKey: 'reason' }
    ],
    [dateLocale]
  );

  return (
    <div className="mc-stack">
      <div className="mc-grid mc-grid--three">
        <KPIWidget label="الرصيد الحالي" value={formatYER(summary.balanceYER, dateLocale)} trend={summary.balanceYER >= 0 ? 'up' : 'down'} />
        <KPIWidget label="إجمالي المقبوض" value={formatYER(summary.totalInYER, dateLocale)} trend="up" />
        <KPIWidget label="إجمالي المصروف" value={formatYER(-summary.totalOutYER, dateLocale)} trend="down" />
      </div>
      <section className="mc-card">
        <header className="mc-panel__header">
          <h3>دفتر اليومية</h3>
        </header>
        <DataTable data={ledger} columns={ledgerColumns} locale={locale} />
      </section>
      <section className="mc-card">
        <header className="mc-panel__header">
          <h3>سندات القبض</h3>
        </header>
        <DataTable data={receipts} columns={receiptColumns} locale={locale} />
      </section>
      <section className="mc-card">
        <header className="mc-panel__header">
          <h3>سندات الدفع</h3>
        </header>
        <DataTable data={payments} columns={paymentColumns} locale={locale} />
      </section>
    </div>
  );
}

