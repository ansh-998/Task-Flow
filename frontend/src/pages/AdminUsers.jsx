// ============================================================================
// File: frontend/src/pages/AdminUsers.jsx
// Description: User directory & role-based governance administration page
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import usersApi from '../api/users.api.js';
import StatusBadge from '../components/StatusBadge.jsx';
import Modal from '../components/Modal.jsx';
import { formatDate } from '../utils/formatDate.js';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  // New user modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'team_member'
  });
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await usersApi.getUsers();
      setUsers(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingId(userId);
    try {
      const res = await usersApi.updateRole(userId, newRole);
      setUsers((prev) => prev.map((u) => (u.id === userId ? res.data : u)));
    } catch (err) {
      alert(err.message || 'Failed to update role');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleActiveToggle = async (userId, currentActive) => {
    setUpdatingId(userId);
    try {
      const res = await usersApi.updateActive(userId, !currentActive);
      setUsers((prev) => prev.map((u) => (u.id === userId ? res.data : u)));
    } catch (err) {
      alert(err.message || 'Failed to update active state');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const res = await usersApi.createUser(formData);
      if (res.data) {
        setUsers((prev) => [res.data, ...prev]);
      }
      setIsModalOpen(false);
      setFormData({
        fullName: '',
        email: '',
        password: '',
        role: 'team_member'
      });
    } catch (err) {
      setFormError(err.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Team & User Directory</h1>
          <p className="page-subtitle">
            Manage practice staff, assign roles (Admin, Manager, Team Member), and manage access.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setFormError(null);
            setIsModalOpen(true);
          }}
        >
          + Add Team Member
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="table-card">
        <div className="table-container">
          {loading ? (
            <div className="empty-state">
              <div className="spinner" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
              <p style={{ marginTop: '0.75rem' }}>Loading team directory...</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Current Role</th>
                  <th>Assign Role</th>
                  <th>Status</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--color-gray-900)' }}>
                        {u.fullName}
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <StatusBadge status={u.role} type="role" />
                    </td>
                    <td>
                      <select
                        className="form-control"
                        style={{ width: 'auto', padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                        value={u.role}
                        disabled={updatingId === u.id}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      >
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="team_member">Team Member</option>
                      </select>
                    </td>
                    <td>
                      <button
                        className={`btn btn-sm ${u.isActive ? 'btn-secondary' : 'btn-danger'}`}
                        disabled={updatingId === u.id}
                        onClick={() => handleActiveToggle(u.id, u.isActive)}
                      >
                        {u.isActive ? 'Active' : 'Disabled'}
                      </button>
                    </td>
                    <td>{formatDate(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Team Member"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="create-user-form"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Create Member'}
            </button>
          </div>
        }
      >
        {formError && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{formError}</div>}
        <form id="create-user-form" onSubmit={handleCreateUser}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Priya Nair"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-control"
              placeholder="e.g. priya@taskflow.dev"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password (min 6 characters)</label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              required
              minLength={6}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Role</label>
            <select
              className="form-control"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              disabled={submitting}
            >
              <option value="team_member">Team Member</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
}
