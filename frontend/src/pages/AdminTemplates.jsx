// ============================================================================
// File: frontend/src/pages/AdminTemplates.jsx
// Description: Task blueprint templates administration per service type
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import templatesApi from '../api/templates.api.js';
import serviceTypesApi from '../api/serviceTypes.api.js';
import Modal from '../components/Modal.jsx';
import FormField from '../components/FormField.jsx';

export default function AdminTemplates() {
  const [serviceTypes, setServiceTypes] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Add Template Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    orderIndex: 1,
    offsetDaysFromPeriodStart: 5,
    defaultAssigneeRole: 'team_member',
    requiresReview: true
  });

  // Load available service types
  useEffect(() => {
    async function loadServices() {
      try {
        const res = await serviceTypesApi.getServiceTypes();
        const list = res.data || [];
        setServiceTypes(list);
        if (list.length > 0 && !selectedServiceId) {
          setSelectedServiceId(list[0].id);
        }
      } catch (err) {
        setError('Failed to load service types');
      }
    }
    loadServices();
  }, []);

  // Load templates when selected service type changes
  const loadTemplates = useCallback(async () => {
    if (!selectedServiceId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await templatesApi.getTemplates(selectedServiceId);
      setTemplates(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load task blueprints');
    } finally {
      setLoading(false);
    }
  }, [selectedServiceId]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    setModalError(null);
    setModalLoading(true);
    try {
      await templatesApi.createTemplate(selectedServiceId, {
        ...formData,
        orderIndex: parseInt(formData.orderIndex, 10),
        offsetDaysFromPeriodStart: parseInt(formData.offsetDaysFromPeriodStart, 10)
      });
      setShowModal(false);
      setFormData({
        title: '',
        description: '',
        orderIndex: (templates.length + 1) * 10,
        offsetDaysFromPeriodStart: 5,
        defaultAssigneeRole: 'team_member',
        requiresReview: true
      });
      loadTemplates();
    } catch (err) {
      setModalError(err.message || 'Failed to create template');
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleActive = async (templateId, currentActive) => {
    try {
      await templatesApi.updateTemplate(templateId, {
        isActive: !currentActive
      });
      loadTemplates();
    } catch (err) {
      alert(err.message || 'Failed to toggle template active status');
    }
  };

  const selectedService = serviceTypes.find((s) => s.id === selectedServiceId);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Task Blueprint Blueprints</h1>
          <p className="page-subtitle">
            Configure the automated task checklist cloned when an engagement is initialized.
          </p>
        </div>
        {selectedServiceId && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + Add Task Blueprint
          </button>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div style={{ marginBottom: '1.5rem', background: '#fff', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-gray-200)' }}>
        <label className="form-label" style={{ marginBottom: '0.5rem' }}>Select Service Offering:</label>
        <select
          className="form-control"
          style={{ maxWidth: '400px' }}
          value={selectedServiceId}
          onChange={(e) => setSelectedServiceId(e.target.value)}
        >
          {serviceTypes.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.code})
            </option>
          ))}
        </select>
      </div>

      <div className="table-card">
        <div className="table-container">
          {loading ? (
            <div className="empty-state">
              <div className="spinner" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
              <p style={{ marginTop: '0.75rem' }}>Loading templates...</p>
            </div>
          ) : templates.length === 0 ? (
            <div className="empty-state">
              <p>No task templates defined for {selectedService?.name || 'this service'}.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Task Title</th>
                  <th>Description</th>
                  <th>Due Offset (Days)</th>
                  <th>Default Role</th>
                  <th>Requires Review</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((tmpl) => (
                  <tr key={tmpl.id}>
                    <td>
                      <code style={{ background: 'var(--color-gray-100)', padding: '2px 6px', borderRadius: '4px' }}>
                        #{tmpl.orderIndex}
                      </code>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--color-gray-900)' }}>
                        {tmpl.title}
                      </div>
                    </td>
                    <td>{tmpl.description || '—'}</td>
                    <td>+{tmpl.offsetDaysFromPeriodStart} days</td>
                    <td>
                      <span className={`badge badge-${tmpl.defaultAssigneeRole || 'team_member'}`}>
                        {tmpl.defaultAssigneeRole?.replace(/_/g, ' ') || 'Any'}
                      </span>
                    </td>
                    <td>
                      {tmpl.requiresReview ? (
                        <span style={{ color: 'var(--color-purple)', fontWeight: 600 }}>&#10003; Yes</span>
                      ) : (
                        <span style={{ color: 'var(--color-gray-400)' }}>No</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${tmpl.isActive ? 'badge-completed' : 'badge-cancelled'}`}>
                        {tmpl.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleToggleActive(tmpl.id, tmpl.isActive)}
                      >
                        {tmpl.isActive ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Template Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={`New Task Blueprint for ${selectedService?.name || ''}`}
      >
        {modalError && <div className="alert alert-danger">{modalError}</div>}
        <form onSubmit={handleCreateTemplate}>
          <FormField label="Task Title" required>
            <input
              type="text"
              className="form-control"
              required
              placeholder="e.g. Bank Account Reconciliation"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </FormField>

          <FormField label="Description / Instructions">
            <textarea
              className="form-control"
              rows={2}
              placeholder="Instructions for worker performing this deliverable"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormField label="Order Index">
              <input
                type="number"
                className="form-control"
                value={formData.orderIndex}
                onChange={(e) => setFormData({ ...formData, orderIndex: e.target.value })}
              />
            </FormField>
            <FormField label="Offset Days from Period Start">
              <input
                type="number"
                className="form-control"
                value={formData.offsetDaysFromPeriodStart}
                onChange={(e) => setFormData({ ...formData, offsetDaysFromPeriodStart: e.target.value })}
              />
            </FormField>
          </div>

          <FormField label="Default Assignee Role">
            <select
              className="form-control"
              value={formData.defaultAssigneeRole}
              onChange={(e) => setFormData({ ...formData, defaultAssigneeRole: e.target.value })}
            >
              <option value="team_member">Team Member</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </FormField>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              id="requiresReview"
              checked={formData.requiresReview}
              onChange={(e) => setFormData({ ...formData, requiresReview: e.target.checked })}
            />
            <label htmlFor="requiresReview" style={{ fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
              Requires Peer / Manager Review Approval
            </label>
          </div>

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
              {modalLoading ? 'Saving...' : 'Add Template'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
