// ============================================================================
// File: client/src/components/ProtectedRoute.jsx
// Description: Route guard verifying authentication and RBAC permissions
// ============================================================================

import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="empty-state" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent', width: 32, height: 32 }} />
        <p style={{ marginTop: '1rem', color: 'var(--color-gray-500)' }}>Verifying session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">&#128683;</div>
        <h2>Access Restricted</h2>
        <p style={{ color: 'var(--color-gray-500)', marginTop: '0.5rem' }}>
          Your current role (<strong>{user.role}</strong>) does not have sufficient permissions to view this resource.
        </p>
      </div>
    );
  }

  return children ? children : <Outlet />;
}
