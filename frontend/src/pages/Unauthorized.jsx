// ============================================================================
// File: frontend/src/pages/Unauthorized.jsx
// Description: 403 Forbidden / Access Denied error page
// ============================================================================

import React from 'react';
import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState.jsx';
import { useRole } from '../hooks/useRole.js';

export default function Unauthorized() {
  const { role } = useRole();

  return (
    <div style={{ paddingTop: '4rem' }}>
      <EmptyState
        icon="🚫"
        title="Access Restricted"
        message={`Your current role (${role || 'User'}) does not have permission to access this resource.`}
        action={
          <Link to="/" className="btn btn-primary">
            Back to Safe Operations
          </Link>
        }
      />
    </div>
  );
}
