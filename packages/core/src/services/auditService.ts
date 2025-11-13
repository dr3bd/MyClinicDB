import type { AuditLog } from '../entities/index.js';
import type { RepositoryBundle } from '../repositories/types.js';
import { toISO } from '../utils/datetime.js';

export class AuditService {
  constructor(private readonly repositories: RepositoryBundle, private readonly currentUser: () => string) {}

  async log(action: string, entity: string, entityId: string, delta: Record<string, unknown>): Promise<AuditLog> {
    const log = await this.repositories.auditLogs.create({
      action,
      entity,
      entityId,
      delta,
      timestamp: toISO(new Date()),
      user: this.currentUser()
    });
    return log;
  }
}
