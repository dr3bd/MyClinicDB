import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import type { Supplier } from '@myclinicdb/core';
import { DataTable } from '../components/DataTable.js';
import { Tag } from '../components/Tag.js';
import '../components/styles.css';

export interface SuppliersViewProps {
  suppliers: Supplier[];
  locale?: 'ar' | 'en';
}

export function SuppliersView({ suppliers, locale = 'ar' }: SuppliersViewProps) {
  const columns = useMemo<ColumnDef<Supplier>[]>(
    () => [
      { header: 'المورّد', accessorKey: 'name' },
      { header: 'الهاتف', accessorKey: 'phone' },
      { header: 'العنوان', accessorKey: 'address' },
      {
        header: 'الحالة',
        accessorKey: 'active',
        cell: ({ row }) => <Tag tone={row.original.active ? 'success' : 'danger'}>{row.original.active ? 'نشط' : 'موقوف'}</Tag>
      }
    ],
    []
  );

  return <DataTable data={suppliers} columns={columns} locale={locale} />;
}

