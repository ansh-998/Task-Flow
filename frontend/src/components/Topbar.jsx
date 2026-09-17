// ============================================================================
// File: client/src/components/Topbar.jsx
// Description: Application top header bar with user profile and logout
// ============================================================================

import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import StatusBadge from './StatusBadge.jsx';

export default function Topbar() {
  const { user, logout } = useAuth();

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <span style={{ fontSize: '0.85rem', color: 'var(--color-gray-500)' }}>
          Professional Services Workspace
        </span>
      </div>

      <div className="topbar-right">
        {user && (
          <div className="user-profile">
            <div className="user-avatar">{getInitials(user.fullName)}</div>
            <div className="user-meta">
              <span className="user-name">{user.fullName}</span>
              <div style={{ marginTop: '2px' }}>
                <StatusBadge status={user.role} type="role" />
              </div>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              style={{ marginLeft: '1rem' }}
              onClick={logout}
              title="Sign out"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
