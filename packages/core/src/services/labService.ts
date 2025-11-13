import type { LabOrder } from '../entities/index.js';
import type { RepositoryBundle } from '../repositories/types.js';
import { toISO } from '../utils/datetime.js';
import { AuditService } from './auditService.js';
import { PermissionService } from './permissionService.js';

export class LabService {
  constructor(
    private readonly repositories: RepositoryBundle,
    private readonly auditService: AuditService,
    private readonly permissions: PermissionService
  ) {}

  async createOrder(input: {
    patientId: string;
    doctorId: string;
    type: string;
    sentDate: string;
    dueDate?: string;
    labName?: string;
    costYER?: number;
    notes?: string;
  }): Promise<LabOrder> {
    this.permissions.assert('lab:manage');
    const order = await this.repositories.labOrders.create({
      patientId: input.patientId,
      doctorId: input.doctorId,
      type: input.type,
      sentDate: toISO(input.sentDate),
      dueDate: input.dueDate ? toISO(input.dueDate) : undefined,
      labName: input.labName,
      costYER: input.costYER,
      status: 'sent',
      notes: input.notes
    });
    await this.auditService.log('create', 'lab_order', order.id, { order });
    return order;
  }

  async updateStatus(id: string, status: LabOrder['status'], notes?: string): Promise<LabOrder> {
    this.permissions.assert('lab:manage');
    const order = await this.repositories.labOrders.update(id, {
      status,
      notes
    });
    await this.auditService.log('update_status', 'lab_order', id, { status, notes });
    return order;
  }

  async listByPatient(patientId: string): Promise<LabOrder[]> {
    return this.repositories.labOrders.findByPatient(patientId);
  }
}
