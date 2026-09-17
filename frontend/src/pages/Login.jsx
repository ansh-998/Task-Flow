// ============================================================================
// File: client/src/pages/Login.jsx
// Description: User sign-in page with 1-click demo role accounts
// ============================================================================

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import authApi from '../api/auth.api.js';

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      if (isRegistering) {
        await authApi.register({ email, password, fullName });
      }
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setErrorMsg(err.message || (isRegistering ? 'Registration failed' : 'Invalid email or password'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = async (demoEmail) => {
    setEmail(demoEmail);
    setPassword('password123');
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await login(demoEmail, 'password123');
      navigate(from, { replace: true });
    } catch (err) {
      setErrorMsg(err.message || 'Demo login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo-badge">&#9881;</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-gray-900)' }}>
            TaskFlow
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-gray-500)', marginTop: '0.25rem' }}>
            {isRegistering ? 'Create your account' : 'Engagement & Task Management Platform'}
          </p>
        </div>

        {errorMsg && (
          <div className="alert alert-danger">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isRegistering && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Aditi Sharma"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-control"
              placeholder="name@taskflow.dev"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              required
              minLength={isRegistering ? 6 : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {isRegistering && (
            <div style={{ fontSize: '0.8rem', color: 'var(--color-gray-500)', marginTop: '0.25rem', marginBottom: '0.75rem', lineHeight: '1.4' }}>
              ℹ️ Account will be created as <strong>Team Member</strong>. Only an Administrator can add or assign Admin and Manager roles.
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.75rem', padding: '0.7rem' }}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? isRegistering
                ? 'Creating Account...'
                : 'Signing In...'
              : isRegistering
              ? 'Create Account'
              : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem' }}>
          {isRegistering ? (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                className="btn btn-link"
                style={{ padding: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-primary)' }}
                onClick={() => {
                  setIsRegistering(false);
                  setErrorMsg(null);
                }}
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              Don't have an account?{' '}
              <button
                type="button"
                className="btn btn-link"
                style={{ padding: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-primary)' }}
                onClick={() => {
                  setIsRegistering(true);
                  setErrorMsg(null);
                }}
              >
                Create Account
              </button>
            </span>
          )}
        </div>

        {!isRegistering && (
          <div className="quick-demo-box" style={{ marginTop: '1.25rem' }}>
            <div className="quick-demo-title">1-Click Demo Accounts (Pass: password123)</div>
            <div className="quick-demo-buttons">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ flex: 1 }}
                onClick={() => handleQuickLogin('admin@taskflow.dev')}
                disabled={isSubmitting}
              >
                Admin
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ flex: 1 }}
                onClick={() => handleQuickLogin('sarah.manager@taskflow.dev')}
                disabled={isSubmitting}
              >
                Manager
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ flex: 1 }}
                onClick={() => handleQuickLogin('alice.member@taskflow.dev')}
                disabled={isSubmitting}
              >
                Member
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
