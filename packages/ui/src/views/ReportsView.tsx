import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import type { IncomeByDoctor, PeriodIncomeExpense } from '@myclinicdb/core';
import { formatYER } from '@myclinicdb/core';
import { DataTable } from '../components/DataTable.js';
import '../components/styles.css';

interface ExpenseCategoryRow {
  category: string;
  amountYER: number;
}

export interface ReportsViewProps {
  period: PeriodIncomeExpense[];
  expenseByCategory: Record<string, number>;
  netByDoctor: IncomeByDoctor[];
  locale?: 'ar' | 'en';
}

export function ReportsView({ period, expenseByCategory, netByDoctor, locale = 'ar' }: ReportsViewProps) {
  const dateLocale = locale === 'ar' ? 'ar-YE' : 'en-US';
  const periodColumns = useMemo<ColumnDef<PeriodIncomeExpense>[]>(
    () => [
      { header: 'الفترة', accessorKey: 'period' },
      {
        header: 'الدخل',
        accessorKey: 'incomeYER',
        cell: ({ row }) => formatYER(row.original.incomeYER, dateLocale)
      },
      {
        header: 'المصروف',
        accessorKey: 'expenseYER',
        cell: ({ row }) => formatYER(row.original.expenseYER, dateLocale)
      }
    ],
    [dateLocale]
  );

  const categoryRows = useMemo<ExpenseCategoryRow[]>(
    () => Object.entries(expenseByCategory).map(([category, amountYER]) => ({ category, amountYER })),
    [expenseByCategory]
  );

  const categoryColumns = useMemo<ColumnDef<ExpenseCategoryRow>[]>(
    () => [
      { header: 'البند', accessorKey: 'category' },
      {
        header: 'المصروف',
        accessorKey: 'amountYER',
        cell: ({ row }) => formatYER(row.original.amountYER, dateLocale)
      }
    ],
    [dateLocale]
  );

  const doctorColumns = useMemo<ColumnDef<IncomeByDoctor>[]>(
    () => [
      { header: 'الطبيب', accessorKey: 'doctorName' },
      {
        header: 'الدخل',
        accessorKey: 'incomeYER',
        cell: ({ row }) => formatYER(row.original.incomeYER, dateLocale)
      },
      {
        header: 'صافي بعد التكاليف',
        accessorKey: 'netAfterCostsYER',
        cell: ({ row }) => formatYER(row.original.netAfterCostsYER, dateLocale)
      }
    ],
    [dateLocale]
  );

  return (
    <div className="mc-stack">
      <section className="mc-card">
        <header className="mc-panel__header">
          <h3>دخل ومصروف حسب الفترة</h3>
        </header>
        <DataTable data={period} columns={periodColumns} locale={locale} />
      </section>
      <section className="mc-card">
        <header className="mc-panel__header">
          <h3>مصروف حسب البند</h3>
        </header>
        <DataTable data={categoryRows} columns={categoryColumns} locale={locale} />
      </section>
      <section className="mc-card">
        <header className="mc-panel__header">
          <h3>صافي دخل الأطباء</h3>
        </header>
        <DataTable data={netByDoctor} columns={doctorColumns} locale={locale} />
      </section>
    </div>
  );
}

