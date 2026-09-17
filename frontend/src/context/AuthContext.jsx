// ============================================================================
// File: frontend/src/context/AuthContext.jsx
// Description: Authentication Context provider & session hook
// ============================================================================

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authApi from '../api/auth.api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('taskflow_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      localStorage.removeItem('taskflow_user');
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('taskflow_token') || null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const logout = useCallback(() => {
    localStorage.removeItem('taskflow_token');
    localStorage.removeItem('taskflow_user');
    setUser(null);
    setToken(null);
  }, []);

  // Verify session on initial app load
  useEffect(() => {
    async function loadUser() {
      const storedToken = localStorage.getItem('taskflow_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await authApi.getMe();
        const currentUser = res?.user || (res?.id ? res : null);
        if (currentUser) {
          setUser(currentUser);
          localStorage.setItem('taskflow_user', JSON.stringify(currentUser));
        } else {
          logout();
        }
      } catch (err) {
        logout();
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();

    // Listen for 401 unauthenticated event from API client
    const handleExpired = () => logout();
    window.addEventListener('taskflow_auth_expired', handleExpired);
    return () => window.removeEventListener('taskflow_auth_expired', handleExpired);
  }, [logout]);

  const login = async (email, password) => {
    setAuthError(null);
    try {
      const res = await authApi.login(email, password);
      if (res && res.token && res.user) {
        localStorage.setItem('taskflow_token', res.token);
        localStorage.setItem('taskflow_user', JSON.stringify(res.user));
        setToken(res.token);
        setUser(res.user);
        return res.user;
      } else {
        throw new Error('Invalid login response format');
      }
    } catch (err) {
      setAuthError(err.message || 'Login failed');
      throw err;
    }
  };

  const value = {
    user,
    token,
    isLoading,
    authError,
    login,
    logout,
    isAdmin: user?.role === 'admin',
    isManager: user?.role === 'manager',
    isTeamMember: user?.role === 'team_member',
    canManage: user?.role === 'admin' || user?.role === 'manager'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
