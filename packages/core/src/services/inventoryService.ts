import type { InventoryBatch, InventoryItem } from '../entities/index.js';
import type { RepositoryBundle } from '../repositories/types.js';
import { assertIntegerYER } from '../utils/currency.js';
import { isWithinNextMonths, toISO } from '../utils/datetime.js';
import { AuditService } from './auditService.js';

export interface AddItemInput {
  name: string;
  unit?: string;
  sku?: string;
  minimumLevel?: number;
  notes?: string;
}

export interface AddBatchInput {
  itemId: string;
  batchNo: string;
  expiryDate: string;
  quantityIn: number;
  costYER: number;
}

export class InventoryService {
  constructor(private readonly repositories: RepositoryBundle, private readonly auditService: AuditService) {}

  async addItem(input: AddItemInput): Promise<InventoryItem> {
    const item = await this.repositories.inventoryItems.create({
      name: input.name,
      unit: input.unit,
      sku: input.sku,
      minimumLevel: input.minimumLevel,
      notes: input.notes
    });
    await this.auditService.log('create', 'inventory_item', item.id, { item });
    return item;
  }

  async addBatch(input: AddBatchInput): Promise<InventoryBatch> {
    if (input.quantityIn <= 0) {
      throw new Error('الكمية المستلمة يجب أن تكون أكبر من صفر.');
    }
    assertIntegerYER(input.costYER);
    const batch = await this.repositories.inventoryBatches.create({
      itemId: input.itemId,
      batchNo: input.batchNo,
      expiryDate: toISO(input.expiryDate),
      quantityIn: input.quantityIn,
      quantityOut: 0,
      costYER: input.costYER
    });
    await this.auditService.log('receive_batch', 'inventory_item', input.itemId, { batch });
    return batch;
  }

  async consume(batchId: string, quantity: number): Promise<InventoryBatch> {
    const batch = await this.repositories.inventoryBatches.findById(batchId);
    if (!batch) {
      throw new Error('دفعة المخزون غير موجودة.');
    }
    if (quantity <= 0) {
      throw new Error('الكمية المصروفة يجب أن تكون موجبة.');
    }
    const remaining = batch.quantityIn - batch.quantityOut;
    if (quantity > remaining) {
      throw new Error('لا توجد كمية كافية في المخزون.');
    }
    const updated = await this.repositories.inventoryBatches.update(batch.id, {
      quantityOut: batch.quantityOut + quantity
    });
    await this.auditService.log('consume_batch', 'inventory_item', batch.itemId, {
      batchId,
      quantity
    });
    return updated;
  }

  async soonToExpire(months: number = 6): Promise<{
    batchId: string;
    itemId: string;
    itemName: string;
    expiryDate: string;
    daysRemaining: number;
  }[]> {
    const batches = await this.repositories.inventoryBatches.list();
    const items = await this.repositories.inventoryItems.list();
    const itemMap = new Map(items.map((item) => [item.id, item]));
    const alerts = [] as {
      batchId: string;
      itemId: string;
      itemName: string;
      expiryDate: string;
      daysRemaining: number;
    }[];
    const now = new Date();
    for (const batch of batches) {
      if (isWithinNextMonths(batch.expiryDate, months)) {
        const expiry = new Date(batch.expiryDate);
        const diffMs = expiry.getTime() - now.getTime();
        const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        const item = itemMap.get(batch.itemId);
        alerts.push({
          batchId: batch.id,
          itemId: batch.itemId,
          itemName: item?.name ?? 'مادة غير معروفة',
          expiryDate: batch.expiryDate,
          daysRemaining
        });
      }
    }
    return alerts;
  }
}
