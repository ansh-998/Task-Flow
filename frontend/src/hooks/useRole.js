// ============================================================================
// File: frontend/src/hooks/useRole.js
// Description: User role and authorization permission helper hook
// ============================================================================

import { useAuth } from '../context/AuthContext.jsx';

export function useRole() {
  const { user } = useAuth();

  const role = user?.role || null;
  const isAdmin = role === 'admin';
  const isManager = role === 'manager';
  const isTeamMember = role === 'team_member';
  const canManage = isAdmin || isManager;

  return {
    role,
    user,
    isAdmin,
    isManager,
    isTeamMember,
    canManage
  };
}

export default useRole;
