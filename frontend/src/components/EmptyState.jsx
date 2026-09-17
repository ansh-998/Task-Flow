// ============================================================================
// File: frontend/src/components/EmptyState.jsx
// Description: Empty state display placeholder
// ============================================================================

import React from 'react';

export default function EmptyState({ icon = '📋', title, message, action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      {title && <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-gray-800)', marginBottom: '0.25rem' }}>{title}</h3>}
      {message && <p style={{ color: 'var(--color-gray-500)', fontSize: '0.875rem' }}>{message}</p>}
      {action && <div style={{ marginTop: '1rem' }}>{action}</div>}
    </div>
  );
}
