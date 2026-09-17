// ============================================================================
// File: client/src/components/Sidebar.jsx
// Description: Application navigation sidebar with role-aware menu sections
// ============================================================================

import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Sidebar() {
  const { isAdmin } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo-icon">&#9881;</div>
        <div className="sidebar-logo-text">TaskFlow</div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-title">Operations</div>
        <NavLink
          to="/"
          end
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          &#128202; Dashboard
        </NavLink>
        <NavLink
          to="/my-tasks"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          &#9989; My Tasks
        </NavLink>
        <NavLink
          to="/engagements"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          &#128193; Engagements
        </NavLink>
        <NavLink
          to="/clients"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          &#127970; Clients
        </NavLink>

        {isAdmin && (
          <>
            <div className="sidebar-section-title" style={{ marginTop: '0.75rem' }}>
              Administration
            </div>
            <NavLink
              to="/admin/users"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              &#128101; Team & Users
            </NavLink>
            <NavLink
              to="/admin/services"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              &#128736; Service Types
            </NavLink>
            <NavLink
              to="/admin/templates"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              &#128220; Task Blueprints
            </NavLink>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div>TaskFlow v1.0 &bull; Node + Postgres</div>
      </div>
    </aside>
  );
}
