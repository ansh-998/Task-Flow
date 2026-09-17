// ============================================================================
// File: frontend/src/utils/constants.js
// Description: Application domain constants, status definitions & mappings
// ============================================================================

export const TASK_STATUSES = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  WAITING_FOR_CLIENT: 'waiting_for_client',
  READY_FOR_REVIEW: 'ready_for_review',
  CHANGES_REQUESTED: 'changes_requested',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  TEAM_MEMBER: 'team_member'
};

export const STATUS_LABELS = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  waiting_for_client: 'Waiting on Client',
  ready_for_review: 'Ready for Review',
  changes_requested: 'Changes Requested',
  completed: 'Completed',
  cancelled: 'Cancelled',
  active: 'Active',
  on_hold: 'On Hold'
};

export const ROLE_LABELS = {
  admin: 'Administrator',
  manager: 'Manager',
  team_member: 'Team Member'
};

export const VALID_TRANSITIONS = {
  not_started: ['in_progress', 'cancelled'],
  in_progress: ['waiting_for_client', 'ready_for_review', 'cancelled'],
  waiting_for_client: ['in_progress', 'cancelled'],
  ready_for_review: ['changes_requested', 'completed'],
  changes_requested: ['in_progress', 'cancelled'],
  completed: [],
  cancelled: []
};

export default {
  TASK_STATUSES,
  ROLES,
  STATUS_LABELS,
  ROLE_LABELS,
  VALID_TRANSITIONS
};
