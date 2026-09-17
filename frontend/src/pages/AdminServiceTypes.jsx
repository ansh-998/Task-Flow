// ============================================================================
// File: frontend/src/pages/AdminServiceTypes.jsx
// Description: Service offerings catalog administration
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import serviceTypesApi from '../api/serviceTypes.api.js';
import Modal from '../components/Modal.jsx';
import FormField from '../components/FormField.jsx';

export default function AdminServiceTypes() {
  const [serviceTypes, setServiceTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    isRecurring: true,
    recurrenceInterval: 'monthly'
  });

  const loadServiceTypes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await serviceTypesApi.getServiceTypes();
      setServiceTypes(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load service types');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadServiceTypes();
  }, [loadServiceTypes]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setModalError(null);
    setModalLoading(true);
    try {
      await serviceTypesApi.createServiceType({
        ...formData,
        recurrenceInterval: formData.isRecurring ? formData.recurrenceInterval : null
      });
      setShowModal(false);
      setFormData({
        name: '',
        code: '',
        description: '',
        isRecurring: true,
        recurrenceInterval: 'monthly'
      });
      loadServiceTypes();
    } catch (err) {
      setModalError(err.message || 'Failed to create service type');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Service Types Catalog</h1>
          <p className="page-subtitle">
            Configure practice service definitions, recurrence rules, and pricing templates.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Add Service Type
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="table-card">
        <div className="table-container">
          {loading ? (
            <div className="empty-state">
              <div className="spinner" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
              <p style={{ marginTop: '0.75rem' }}>Loading service types...</p>
            </div>
          ) : serviceTypes.length === 0 ? (
            <div className="empty-state">
              <p>No service types configured yet.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Service Name</th>
                  <th>Service Code</th>
                  <th>Description</th>
                  <th>Recurrence</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {serviceTypes.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--color-gray-900)' }}>
                        {s.name}
                      </div>
                    </td>
                    <td>
                      <code style={{ background: 'var(--color-gray-100)', padding: '2px 6px', borderRadius: '4px' }}>
                        {s.code}
                      </code>
                    </td>
                    <td>{s.description || '—'}</td>
                    <td>
                      {s.isRecurring ? (
                        <span className="badge badge-in_progress">
                          {s.recurrenceInterval}
                        </span>
                      ) : (
                        <span className="badge badge-not_started">
                          One-time
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${s.isActive ? 'badge-completed' : 'badge-cancelled'}`}>
                        {s.isActive ? 'Active' : 'Archived'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="New Service Type"
      >
        {modalError && <div className="alert alert-danger">{modalError}</div>}
        <form onSubmit={handleCreate}>
          <FormField label="Service Name" required>
            <input
              type="text"
              className="form-control"
              required
              placeholder="e.g. Monthly Bookkeeping"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </FormField>

          <FormField label="Service Code" required>
            <input
              type="text"
              className="form-control"
              required
              placeholder="e.g. BOOKKEEPING"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            />
          </FormField>

          <FormField label="Description">
            <textarea
              className="form-control"
              rows={2}
              placeholder="Service scope and requirements"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </FormField>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              id="isRecurring"
              checked={formData.isRecurring}
              onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
            />
            <label htmlFor="isRecurring" style={{ fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
              Recurring Service Deliverable
            </label>
          </div>

          {formData.isRecurring && (
            <FormField label="Recurrence Cadence" required>
              <select
                className="form-control"
                value={formData.recurrenceInterval}
                onChange={(e) => setFormData({ ...formData, recurrenceInterval: e.target.value })}
              >
                <option value="monthly">Monthly (YYYY-MM)</option>
                <option value="quarterly">Quarterly (YYYY-QN)</option>
                <option value="yearly">Yearly (YYYY)</option>
              </select>
            </FormField>
          )}

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
              {modalLoading ? 'Saving...' : 'Save Service Type'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
