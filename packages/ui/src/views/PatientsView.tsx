import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import type { Patient } from '@myclinicdb/core';
import { formatYER } from '@myclinicdb/core';
import { DataTable } from '../components/DataTable.js';
import '../components/styles.css';

export interface PatientRow extends Patient {
  doctorName?: string;
  outstandingYER?: number;
  sessionsCount?: number;
}

export interface PatientsViewProps {
  patients: PatientRow[];
  locale?: 'ar' | 'en';
}

export function PatientsView({ patients, locale = 'ar' }: PatientsViewProps) {
  const numberLocale = locale === 'ar' ? 'ar-YE' : 'en-US';
  const columns = useMemo<ColumnDef<PatientRow>[]>(
    () => [
      { header: 'الرمز', accessorKey: 'code' },
      { header: 'الاسم', accessorKey: locale === 'ar' ? 'fullNameAr' : 'fullNameEn' },
      { header: 'الجوال', accessorKey: 'phone' },
      { header: 'الطبيب المعالج', accessorKey: 'doctorName' },
      {
        header: 'عدد الجلسات',
        accessorKey: 'sessionsCount',
        cell: ({ row }) => (row.original.sessionsCount ?? 0).toLocaleString(numberLocale)
      },
      {
        header: 'الرصيد المتبقي',
        accessorKey: 'outstandingYER',
        cell: ({ row }) => formatYER(row.original.outstandingYER ?? 0, numberLocale)
      }
    ],
    [locale, numberLocale]
  );

  return <DataTable data={patients} columns={columns} locale={locale} />;
}

