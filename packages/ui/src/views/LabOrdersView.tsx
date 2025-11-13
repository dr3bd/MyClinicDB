import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import type { LabOrder } from '@myclinicdb/core';
import { formatYER } from '@myclinicdb/core';
import { DataTable } from '../components/DataTable.js';
import { Tag } from '../components/Tag.js';
import '../components/styles.css';

export interface LabOrderRow extends LabOrder {
  patientName?: string;
  doctorName?: string;
}

export interface LabOrdersViewProps {
  labOrders: LabOrderRow[];
  locale?: 'ar' | 'en';
}

export function LabOrdersView({ labOrders, locale = 'ar' }: LabOrdersViewProps) {
  const dateLocale = locale === 'ar' ? 'ar-YE' : 'en-US';
  const columns = useMemo<ColumnDef<LabOrderRow>[]>(
    () => [
      { header: 'المريض', accessorKey: 'patientName' },
      { header: 'الطبيب', accessorKey: 'doctorName' },
      { header: 'نوع العمل', accessorKey: 'type' },
      {
        header: 'تاريخ الإرسال',
        accessorKey: 'sentDate',
        cell: ({ row }) =>
          row.original.sentDate ? new Date(row.original.sentDate).toLocaleDateString(dateLocale) : '—'
      },
      {
        header: 'تاريخ التسليم',
        accessorKey: 'dueDate',
        cell: ({ row }) =>
          row.original.dueDate ? new Date(row.original.dueDate).toLocaleDateString(dateLocale) : '—'
      },
      {
        header: 'التكلفة',
        accessorKey: 'costYER',
        cell: ({ row }) => (row.original.costYER ? formatYER(row.original.costYER, dateLocale) : '—')
      },
      {
        header: 'الحالة',
        accessorKey: 'status',
        cell: ({ row }) => <Tag tone={row.original.status === 'delivered' ? 'success' : 'warning'}>{row.original.status ?? 'قيد التنفيذ'}</Tag>
      }
    ],
    [dateLocale]
  );

  return <DataTable data={labOrders} columns={columns} locale={locale} />;
}

