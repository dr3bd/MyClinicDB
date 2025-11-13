import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import type { AuditLog } from '@myclinicdb/core';
import { DataTable } from '../components/DataTable.js';
import '../components/styles.css';

export interface AuditLogViewProps {
  logs: AuditLog[];
  locale?: 'ar' | 'en';
}

export function AuditLogView({ logs, locale = 'ar' }: AuditLogViewProps) {
  const dateLocale = locale === 'ar' ? 'ar-YE' : 'en-US';
  const columns = useMemo<ColumnDef<AuditLog>[]>(
    () => [
      {
        header: 'التاريخ',
        accessorKey: 'timestamp',
        cell: ({ row }) => new Date(row.original.timestamp).toLocaleString(dateLocale)
      },
      { header: 'المستخدم', accessorKey: 'user' },
      { header: 'الإجراء', accessorKey: 'action' },
      { header: 'الكيان', accessorKey: 'entity' },
      { header: 'المعرف', accessorKey: 'entityId' }
    ],
    [dateLocale]
  );

  return <DataTable data={logs} columns={columns} locale={locale} />;
}

