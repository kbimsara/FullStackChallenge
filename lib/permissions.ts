import { Role } from '@/lib/roles';

export const Permissions = {
  CAN_MANAGE_USERS: [Role.ADMIN],
  CAN_CREATE_WORKSHOP: [Role.MANAGER],
  CAN_EDIT_WORKSHOP: [Role.MANAGER],
  CAN_REGISTER_ATTENDEE: [Role.MANAGER, Role.STAFF],
  CAN_CANCEL_REGISTRATION: [Role.MANAGER, Role.STAFF],
  CAN_VIEW_WORKSHOPS: [Role.ADMIN, Role.MANAGER, Role.STAFF],
  CAN_VIEW_REGISTRATIONS: [Role.MANAGER, Role.STAFF], // wait, Admin might need it for audit, but let's allow Admin for audit
  CAN_VIEW_AUDIT_LOGS: [Role.ADMIN], // Or maybe Manager too, but prompt says "Admin-only access is a reasonable default"
};

export function hasPermission(userRole: string | undefined, allowedRoles: string[]) {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
}
