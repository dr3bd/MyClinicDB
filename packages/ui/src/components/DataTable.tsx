import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { useReactTable, getCoreRowModel, getSortedRowModel, flexRender } from '@tanstack/react-table';
import * as XLSX from 'xlsx';
import './styles.css';

export interface DataTableProps<T extends object> {
  data: T[];
  columns: ColumnDef<T, any>[];
  searchable?: boolean;
  searchableFields?: (keyof T)[];
  onRowClick?: (row: T) => void;
  locale?: 'ar' | 'en';
}

function exportToXlsx<T extends object>(rows: T[], fileName: string, locale: string) {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  XLSX.writeFile(workbook, `${fileName}-${locale}.xlsx`);
}

function exportToCsv<T extends object>(rows: T[], fileName: string, locale: string) {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `${fileName}-${locale}.csv`);
  link.click();
}

export function DataTable<T extends object>({
  data,
  columns,
  searchable = true,
  searchableFields,
  onRowClick,
  locale = 'ar'
}: DataTableProps<T>) {
  const [globalFilter, setGlobalFilter] = useState('');
  const filteredData = useMemo(() => {
    if (!searchable || !globalFilter) return data;
    const lower = globalFilter.trim().toLowerCase();
    return data.filter((row) => {
      const keys = searchableFields ?? (Object.keys(row) as (keyof T)[]);
      return keys.some((key) => String(row[key] ?? '').toLowerCase().includes(lower));
    });
  }, [data, globalFilter, searchable, searchableFields]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting: []
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
  });

  return (
    <div className="mc-card mc-data-table" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      {searchable && (
        <div className="mc-data-table__actions">
          <input
            className="mc-input"
            placeholder={locale === 'ar' ? 'بحث سريع' : 'Quick search'}
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
          />
          <div className="mc-data-table__export">
            <button type="button" onClick={() => exportToCsv(filteredData, 'table', locale)}>
              CSV
            </button>
            <button type="button" onClick={() => exportToXlsx(filteredData, 'table', locale)}>
              Excel
            </button>
          </div>
        </div>
      )}
      <div className="mc-data-table__container">
        <table>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder ? null : (
                      <button type="button" onClick={header.column.getToggleSortingHandler()}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} onClick={() => onRowClick?.(row.original)}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
