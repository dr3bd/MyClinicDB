import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import type { Doctor, ToothStatus } from '@myclinicdb/core';
import { DataTable } from '../components/DataTable.js';
import '../components/styles.css';

export interface SettingsViewProps {
  doctors: Doctor[];
  toothStatuses: ToothStatus[];
  locale?: 'ar' | 'en';
}

export function SettingsView({ doctors, toothStatuses, locale = 'ar' }: SettingsViewProps) {
  const doctorColumns = useMemo<ColumnDef<Doctor>[]>(
    () => [
      { header: 'الطبيب', accessorKey: 'name' },
      { header: 'الهاتف', accessorKey: 'phone' },
      { header: 'التخصص', accessorKey: 'specialty' },
      {
        header: 'نسبة المشاركة',
        accessorKey: 'revenueSharePercent',
        cell: ({ row }) => `${row.original.revenueSharePercent}%`
      }
    ],
    []
  );

  const toothColumns = useMemo<ColumnDef<ToothStatus>[]>(
    () => [
      { header: 'الرمز', accessorKey: 'code' },
      { header: 'الوصف', accessorKey: locale === 'ar' ? 'labelAr' : 'labelEn' },
      { header: 'اللون', accessorKey: 'color' }
    ],
    [locale]
  );

  return (
    <div className="mc-stack">
      <section className="mc-card">
        <header className="mc-panel__header">
          <h3>أطباء العيادة</h3>
        </header>
        <DataTable data={doctors} columns={doctorColumns} locale={locale} />
      </section>
      <section className="mc-card">
        <header className="mc-panel__header">
          <h3>حالات الأسنان</h3>
        </header>
        <DataTable data={toothStatuses} columns={toothColumns} locale={locale} />
      </section>
    </div>
  );
}

