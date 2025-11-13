import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import type { Invoice } from '@myclinicdb/core';
import { DataTable } from '../components/DataTable.js';
import { Tag } from '../components/Tag.js';
import { formatYER } from '@myclinicdb/core';
import '../components/styles.css';

export interface InvoiceRow extends Invoice {
  patientName?: string;
  outstandingYER?: number;
}

export interface BillingViewProps {
  invoices: InvoiceRow[];
  locale?: 'ar' | 'en';
}

export function BillingView({ invoices, locale = 'ar' }: BillingViewProps) {
  const numberLocale = locale === 'ar' ? 'ar-YE' : 'en-US';
  const columns = useMemo<ColumnDef<InvoiceRow>[]>(
    () => [
      { header: 'المريض', accessorKey: 'patientName' },
      {
        header: 'التاريخ',
        accessorKey: 'date',
        cell: ({ row }) => new Date(row.original.date).toLocaleDateString(numberLocale)
      },
      {
        header: 'الإجمالي',
        accessorKey: 'totalYER',
        cell: ({ row }) => formatYER(row.original.totalYER, numberLocale)
      },
      {
        header: 'المدفوع',
        accessorKey: 'paidYER',
        cell: ({ row }) => formatYER(row.original.paidYER, numberLocale)
      },
      {
        header: 'المتبقي',
        accessorKey: 'outstandingYER',
        cell: ({ row }) => formatYER(row.original.outstandingYER ?? row.original.totalYER - row.original.paidYER, numberLocale)
      },
      {
        header: 'الحالة',
        accessorKey: 'status',
        cell: ({ row }) => (
          <Tag tone={row.original.status === 'paid' ? 'success' : row.original.status === 'partial' ? 'warning' : 'neutral'}>
            {row.original.status}
          </Tag>
        )
      }
    ],
    [numberLocale]
  );

  return <DataTable data={invoices} columns={columns} locale={locale} />;
}

