export type UserRole = 'manager' | 'secretary';

export type PermissionAction =
  | 'patients:manage'
  | 'patients:files'
  | 'sessions:manage'
  | 'sessions:invoice'
  | 'invoices:manage'
  | 'cashbox:receipt'
  | 'cashbox:receipt:void'
  | 'cashbox:payment'
  | 'cashbox:payment:void'
  | 'inventory:manage'
  | 'inventory:report'
  | 'lab:manage'
  | 'reports:view'
  | 'backup:export'
  | 'backup:import';

const SECRETARY_PERMISSIONS: Set<PermissionAction> = new Set([
  'patients:manage',
  'patients:files',
  'sessions:manage',
  'sessions:invoice',
  'invoices:manage',
  'cashbox:receipt',
  'cashbox:receipt:void',
  'cashbox:payment',
  'cashbox:payment:void',
  'inventory:manage',
  'inventory:report',
  'lab:manage',
  'reports:view'
]);

export class PermissionService {
  constructor(private readonly currentRole: () => UserRole) {}

  has(action: PermissionAction): boolean {
    const role = this.currentRole();
    if (role === 'manager') {
      return true;
    }
    return SECRETARY_PERMISSIONS.has(action);
  }

  assert(action: PermissionAction): void {
    if (!this.has(action)) {
      throw new Error('ليست لديك صلاحية لإتمام هذه العملية.');
    }
  }
}
