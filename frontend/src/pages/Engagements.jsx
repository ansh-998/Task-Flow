// ============================================================================
// File: frontend/src/pages/Engagements.jsx
// Description: Engagements directory with creation modal and duplicate enforcement
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import engagementsApi from '../api/engagements.api.js';
import clientsApi from '../api/clients.api.js';
import serviceTypesApi from '../api/serviceTypes.api.js';
import { useRole } from '../hooks/useRole.js';
import StatusBadge from '../components/StatusBadge.jsx';
import Modal from '../components/Modal.jsx';
import FormField from '../components/FormField.jsx';

export default function Engagements() {
  const { canManage } = useRole();
  const navigate = useNavigate();

  const [engagements, setEngagements] = useState([]);
  const [clients, setClients] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New Engagement Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [formData, setFormData] = useState({
    clientId: '',
    serviceTypeId: '',
    title: '',
    periodStart: '',
    periodEnd: ''
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await engagementsApi.getEngagements();
      setEngagements(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load engagements');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleGenerateRecurring = async () => {
    setGenerating(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await engagementsApi.triggerRecurringGeneration();
      const s = res.data || {};
      setSuccessMsg(`Recurring cycle processed: ${s.created} engagement(s) created, ${s.skipped} skipped (duplicate/already exists), ${s.processed} checked.`);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to run recurring generation');
    } finally {
      setGenerating(false);
    }
  };

  // Load clients and service types for modal
  const openCreateModal = async () => {
    setShowModal(true);
    setModalError(null);
    try {
      const [clientsRes, srvRes] = await Promise.all([
        clientsApi.getClients(),
        serviceTypesApi.getServiceTypes()
      ]);
      setClients(clientsRes.data || []);
      setServiceTypes(srvRes.data || []);
    } catch (err) {
      setModalError('Failed to load client or service catalog');
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setModalError(null);
    setModalLoading(true);

    if (!formData.periodStart || !formData.periodEnd) {
      setModalError('Please select both Period Start and Period End dates');
      setModalLoading(false);
      return;
    }

    try {
      await engagementsApi.createEngagement({
        clientId: formData.clientId,
        serviceTypeId: formData.serviceTypeId,
        title: formData.title,
        periodStart: new Date(formData.periodStart).toISOString(),
        periodEnd: new Date(formData.periodEnd).toISOString()
      });
      setShowModal(false);
      setFormData({ clientId: '', serviceTypeId: '', title: '', periodStart: '', periodEnd: '' });
      loadData();
    } catch (err) {
      setModalError(err.message || 'Failed to create engagement');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Client Engagements</h1>
          <p className="page-subtitle">
            Manage period-based recurring deliverables and project timelines.
          </p>
        </div>
        {canManage && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              className="btn btn-secondary"
              onClick={handleGenerateRecurring}
              disabled={generating}
              title="Automatically advance and generate next period's recurring engagements and tasks"
            >
              {generating ? 'Generating...' : '↻ Generate Next Period'}
            </button>
            <button className="btn btn-primary" onClick={openCreateModal}>
              + New Engagement
            </button>
          </div>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      <div className="table-card">
        <div className="table-container">
          {loading ? (
            <div className="empty-state">
              <div className="spinner" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
              <p style={{ marginTop: '0.75rem' }}>Loading engagements...</p>
            </div>
          ) : engagements.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📁</div>
              <p>No engagements found.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Engagement Title</th>
                  <th>Client</th>
                  <th>Service Type</th>
                  <th>Period Key</th>
                  <th>Manager</th>
                  <th>Progress</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {engagements.map((eng) => {
                  const totalTasks = eng.tasks?.length || 0;
                  const completedTasks = eng.tasks?.filter((t) => t.status === 'completed').length || 0;
                  const percent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

                  return (
                    <tr
                      key={eng.id}
                      className="clickable-row"
                      onClick={() => navigate(`/engagements/${eng.id}`)}
                    >
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--color-gray-900)' }}>
                          {eng.title}
                        </div>
                      </td>
                      <td>{eng.client?.name}</td>
                      <td>
                        {eng.serviceType?.name}
                        {eng.serviceType?.isRecurring && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', marginLeft: '0.4rem' }}>
                            ({eng.serviceType.recurrenceInterval})
                          </span>
                        )}
                      </td>
                      <td>
                        <code style={{ background: 'var(--color-gray-100)', padding: '2px 6px', borderRadius: '4px' }}>
                          {eng.periodKey || 'N/A'}
                        </code>
                      </td>
                      <td>{eng.manager?.fullName || '—'}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ flex: 1, height: '6px', background: 'var(--color-gray-200)', borderRadius: '3px', overflow: 'hidden', minWidth: '60px' }}>
                            <div style={{ width: `${percent}%`, height: '100%', background: 'var(--color-success)' }} />
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-gray-600)' }}>
                            {completedTasks}/{totalTasks}
                          </span>
                        </div>
                      </td>
                      <td>
                        <StatusBadge status={eng.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Creation Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create New Engagement"
      >
        {modalError && <div className="alert alert-danger">{modalError}</div>}
        <form onSubmit={handleCreateSubmit}>
          <FormField label="Client" required>
            <select
              className="form-control"
              required
              value={formData.clientId}
              onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
            >
              <option value="">Select a Client...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
              ))}
            </select>
          </FormField>

          <FormField label="Service Type" required>
            <select
              className="form-control"
              required
              value={formData.serviceTypeId}
              onChange={(e) => {
                const srv = serviceTypes.find((s) => s.id === e.target.value);
                const defaultTitle = srv ? `${srv.name} Engagement` : '';
                setFormData({ ...formData, serviceTypeId: e.target.value, title: defaultTitle });
              }}
            >
              <option value="">Select Service Type...</option>
              {serviceTypes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.isRecurring ? `(Recurring: ${s.recurrenceInterval})` : '(One-off)'}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Engagement Title" required>
            <input
              type="text"
              className="form-control"
              required
              placeholder="e.g. Monthly Bookkeeping - January 2026"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormField label="Period Start" required>
              <input
                type="date"
                className="form-control"
                required
                value={formData.periodStart}
                onChange={(e) => setFormData({ ...formData, periodStart: e.target.value })}
              />
            </FormField>
            <FormField label="Period End" required>
              <input
                type="date"
                className="form-control"
                required
                value={formData.periodEnd}
                onChange={(e) => setFormData({ ...formData, periodEnd: e.target.value })}
              />
            </FormField>
          </div>

          <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', marginTop: '0.5rem' }}>
            &#9432; Creating this engagement will automatically clone its active task blueprint templates and compute the unique period key.
          </p>

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
              {modalLoading ? 'Creating...' : 'Create & Spawn Tasks'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
