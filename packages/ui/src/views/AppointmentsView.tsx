import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import type { Appointment } from '@myclinicdb/core';
import { DataTable } from '../components/DataTable.js';
import '../components/styles.css';

export interface AppointmentRow extends Appointment {
  patientName?: string;
  doctorName?: string;
  clinicRoom?: string;
}

export interface AppointmentsViewProps {
  appointments: AppointmentRow[];
  locale?: 'ar' | 'en';
}

export function AppointmentsView({ appointments, locale = 'ar' }: AppointmentsViewProps) {
  const dateLocale = locale === 'ar' ? 'ar-YE' : 'en-US';
  const columns = useMemo<ColumnDef<AppointmentRow>[]>(
    () => [
      { header: 'المريض', accessorKey: 'patientName' },
      { header: 'الطبيب', accessorKey: 'doctorName' },
      {
        header: 'وقت البدء',
        accessorKey: 'start',
        cell: ({ row }) => new Date(row.original.start).toLocaleString(dateLocale)
      },
      {
        header: 'وقت الانتهاء',
        accessorKey: 'end',
        cell: ({ row }) => new Date(row.original.end).toLocaleString(dateLocale)
      },
      { header: 'العيادة', accessorKey: 'clinicRoom' },
      { header: 'الحالة', accessorKey: 'status' }
    ],
    [dateLocale]
  );

  return <DataTable data={appointments} columns={columns} locale={locale} />;
}

