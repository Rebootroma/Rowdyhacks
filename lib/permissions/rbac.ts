import { Role } from '@/types/domain';

export type Permission =
  | 'crew:edit'
  | 'crew:delete'
  | 'crew:invite'
  | 'member:manage_roles'
  | 'member:remove'
  | 'budget:set'
  | 'expense:create'
  | 'expense:approve'
  | 'goal:create'
  | 'goal:contribute';

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  owner: [
    'crew:edit',
    'crew:delete',
    'crew:invite',
    'member:manage_roles',
    'member:remove',
    'budget:set',
    'expense:create',
    'expense:approve',
    'goal:create',
    'goal:contribute',
  ],
  treasurer: [
    'crew:invite',
    'budget:set',
    'expense:create',
    'expense:approve',
    'goal:create',
    'goal:contribute',
  ],
  member: ['crew:invite', 'expense:create', 'expense:approve', 'goal:contribute'],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function canManageBudget(role: Role): boolean {
  return role === 'owner' || role === 'treasurer';
}

export function canApproveExpense(
  role: Role,
  creatorUserId: string,
  currentUserId: string
): boolean {
  // Rule: creator cannot approve their own expense
  if (creatorUserId === currentUserId) return false;
  return hasPermission(role, 'expense:approve');
}
