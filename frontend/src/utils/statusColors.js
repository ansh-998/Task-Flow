// ============================================================================
// File: frontend/src/utils/statusColors.js
// Description: Status and role badge class helpers
// ============================================================================

export function getStatusBadgeClass(status) {
  if (!status) return 'badge';
  return `badge badge-${status.toLowerCase()}`;
}

export function getRoleBadgeClass(role) {
  if (!role) return 'badge';
  return `badge badge-${role.toLowerCase()}`;
}

export default {
  getStatusBadgeClass,
  getRoleBadgeClass
};
