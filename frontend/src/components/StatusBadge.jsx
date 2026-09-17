// ============================================================================
// File: frontend/src/components/StatusBadge.jsx
// Description: Reusable status and role pill badge component
// ============================================================================

import React from 'react';
import { STATUS_LABELS, ROLE_LABELS } from '../utils/constants.js';
import { getStatusBadgeClass } from '../utils/statusColors.js';

export default function StatusBadge({ status, type = 'status' }) {
  if (!status) return null;

  const normalized = status.toLowerCase();
  const label = type === 'role'
    ? (ROLE_LABELS[normalized] || normalized)
    : (STATUS_LABELS[normalized] || normalized.replace(/_/g, ' '));

  const badgeClass = getStatusBadgeClass(normalized);

  return (
    <span className={badgeClass}>
      {label}
    </span>
  );
}
