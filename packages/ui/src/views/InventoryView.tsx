import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import type { InventoryBatch, InventoryItem } from '@myclinicdb/core';
import { DataTable } from '../components/DataTable.js';
import { Tag } from '../components/Tag.js';
import '../components/styles.css';

interface InventoryTableRow extends InventoryItem {
  availableQuantity: number;
  soonestExpiry?: string;
}

export interface InventoryViewProps {
  items: InventoryItem[];
  batches: InventoryBatch[];
  alerts: { batchId: string; itemName: string; expiryDate: string; daysRemaining: number }[];
  locale?: 'ar' | 'en';
}

export function InventoryView({ items, batches, alerts, locale = 'ar' }: InventoryViewProps) {
  const dateLocale = locale === 'ar' ? 'ar-YE' : 'en-US';
  const rows = useMemo<InventoryTableRow[]>(() => {
    const grouped = new Map<string, InventoryTableRow>();
    for (const item of items) {
      grouped.set(item.id, {
        ...item,
        availableQuantity: 0,
        soonestExpiry: undefined
      });
    }
    for (const batch of batches) {
      const entry = grouped.get(batch.itemId);
      if (!entry) continue;
      const remaining = batch.quantityIn - batch.quantityOut;
      entry.availableQuantity += remaining;
      if (!entry.soonestExpiry || new Date(batch.expiryDate) < new Date(entry.soonestExpiry)) {
        entry.soonestExpiry = batch.expiryDate;
      }
    }
    return Array.from(grouped.values());
  }, [items, batches]);

  const columns = useMemo<ColumnDef<InventoryTableRow>[]>(
    () => [
      { header: 'المادة', accessorKey: 'name' },
      { header: 'الوحدة', accessorKey: 'unit' },
      { header: 'الرمز', accessorKey: 'sku' },
      {
        header: 'المتوفر',
        accessorKey: 'availableQuantity',
        cell: ({ row }) => row.original.availableQuantity.toLocaleString(dateLocale)
      },
      {
        header: 'الحد الأدنى',
        accessorKey: 'minimumLevel',
        cell: ({ row }) => (row.original.minimumLevel ?? 0).toLocaleString(dateLocale)
      },
      {
        header: 'أقرب صلاحية',
        accessorKey: 'soonestExpiry',
        cell: ({ row }) =>
          row.original.soonestExpiry
            ? new Date(row.original.soonestExpiry).toLocaleDateString(dateLocale)
            : '—'
      }
    ],
    [dateLocale]
  );

  return (
    <div className="mc-stack">
      <DataTable data={rows} columns={columns} locale={locale} />
      <section className="mc-card">
        <header className="mc-panel__header">
          <h3>تنبيهات الصلاحية</h3>
        </header>
        {alerts.length === 0 ? (
          <p className="mc-text-muted">لا توجد مواد أوشكت على الانتهاء.</p>
        ) : (
          <ul className="mc-alert-list">
            {alerts.map((alert) => (
              <li key={alert.batchId} className="mc-alert-list__item">
                <div className="mc-alert-list__content">
                  <strong>{alert.itemName}</strong>
                  <small>{new Date(alert.expiryDate).toLocaleDateString(dateLocale)}</small>
                </div>
                <Tag tone={alert.daysRemaining <= 30 ? 'danger' : 'warning'}>
                  تبقّى {alert.daysRemaining} يومًا
                </Tag>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

