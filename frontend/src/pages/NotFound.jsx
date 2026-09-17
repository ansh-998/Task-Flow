// ============================================================================
// File: frontend/src/pages/NotFound.jsx
// Description: 404 Not Found error page
// ============================================================================

import React from 'react';
import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState.jsx';

export default function NotFound() {
  return (
    <div style={{ paddingTop: '4rem' }}>
      <EmptyState
        icon="🔍"
        title="Page Not Found"
        message="The page you are looking for does not exist or has been moved."
        action={
          <Link to="/" className="btn btn-primary">
            Return to Dashboard
          </Link>
        }
      />
    </div>
  );
}
