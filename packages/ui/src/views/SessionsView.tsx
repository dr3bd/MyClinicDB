import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import type { Session } from '@myclinicdb/core';
import { formatYER } from '@myclinicdb/core';
import { DataTable } from '../components/DataTable.js';
import '../components/styles.css';

export interface SessionRow extends Session {
  patientName?: string;
  doctorName?: string;
}

export interface SessionsViewProps {
  sessions: SessionRow[];
  locale?: 'ar' | 'en';
}

export function SessionsView({ sessions, locale = 'ar' }: SessionsViewProps) {
  const dateLocale = locale === 'ar' ? 'ar-YE' : 'en-US';
  const columns = useMemo<ColumnDef<SessionRow>[]>(
    () => [
      {
        header: 'التاريخ',
        accessorKey: 'date',
        cell: ({ row }) => new Date(row.original.date).toLocaleString(dateLocale)
      },
      { header: 'المريض', accessorKey: 'patientName' },
      { header: 'الطبيب', accessorKey: 'doctorName' },
      {
        header: 'الإجراءات',
        accessorKey: 'procedures',
        cell: ({ row }) => row.original.procedures.join('، ')
      },
      {
        header: 'الأسنان',
        accessorKey: 'teeth',
        cell: ({ row }) => row.original.teeth.map((tooth) => tooth.toString()).join('، ')
      },
      {
        header: 'الأتعاب',
        accessorKey: 'feeYER',
        cell: ({ row }) => formatYER(row.original.feeYER, dateLocale)
      }
    ],
    [dateLocale]
  );

  return <DataTable data={sessions} columns={columns} locale={locale} />;
}

