// ============================================================================
// File: frontend/src/pages/Clients.jsx
// Description: Client directory management page
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import clientsApi from '../api/clients.api.js';
import { useRole } from '../hooks/useRole.js';
import Modal from '../components/Modal.jsx';
import FormField from '../components/FormField.jsx';

export default function Clients() {
  const { canManage } = useRole();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contactEmail: '',
    phone: '',
    status: 'active'
  });

  const loadClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await clientsApi.getClients();
      setClients(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setModalError(null);
    setModalLoading(true);
    try {
      await clientsApi.createClient(formData);
      setShowModal(false);
      setFormData({ name: '', contactEmail: '', phone: '', status: 'active' });
      loadClients();
    } catch (err) {
      setModalError(err.message || 'Failed to create client');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Client Directory</h1>
          <p className="page-subtitle">
            Manage corporate client accounts, industry sectors, and contact profiles.
          </p>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + Add Client
          </button>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="table-card">
        <div className="table-container">
          {loading ? (
            <div className="empty-state">
              <div className="spinner" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
              <p style={{ marginTop: '0.75rem' }}>Loading client accounts...</p>
            </div>
          ) : clients.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🏢</div>
              <p>No clients registered yet.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Client Name</th>
                  <th>Contact Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => {
                  const isActive = c.status === 'active' || c.isActive === true;
                  return (
                    <tr key={c.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--color-gray-900)' }}>
                          {c.name}
                        </div>
                      </td>
                      <td>{c.contactEmail || c.email || '—'}</td>
                      <td>{c.phone || '—'}</td>
                      <td>
                        <span className={`badge ${isActive ? 'badge-completed' : 'badge-cancelled'}`}>
                          {c.status ? (c.status.charAt(0).toUpperCase() + c.status.slice(1)) : (isActive ? 'Active' : 'Inactive')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Client Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add New Client"
      >
        {modalError && <div className="alert alert-danger">{modalError}</div>}
        <form onSubmit={handleCreate}>
          <FormField label="Client Name" required>
            <input
              type="text"
              className="form-control"
              required
              placeholder="e.g. Apex Global Logistics"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </FormField>

          <FormField label="Contact Email">
            <input
              type="email"
              className="form-control"
              placeholder="contact@company.com"
              value={formData.contactEmail}
              onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
            />
          </FormField>

          <FormField label="Phone">
            <input
              type="text"
              className="form-control"
              placeholder="+1 555 123 4567"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </FormField>

          <FormField label="Status">
            <select
              className="form-control"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </FormField>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowModal(false)}
              disabled={modalLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={modalLoading}
            >
              {modalLoading ? 'Saving...' : 'Create Client'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
