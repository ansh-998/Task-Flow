// ============================================================================
// File: frontend/src/pages/EngagementDetail.jsx
// Description: Detailed engagement view showing blueprint task checklist & statuses
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import engagementsApi from '../api/engagements.api.js';
import StatusBadge from '../components/StatusBadge.jsx';
import TaskDrawer from '../components/TaskDrawer.jsx';
import { formatDate } from '../utils/formatDate.js';

export default function EngagementDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [engagement, setEngagement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const loadEngagement = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await engagementsApi.getEngagementById(id);
      setEngagement(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load engagement details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadEngagement();
  }, [loadEngagement]);

  if (loading) {
    return (
      <div className="empty-state">
        <div className="spinner" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
        <p style={{ marginTop: '0.75rem' }}>Loading engagement...</p>
      </div>
    );
  }

  if (error || !engagement) {
    return (
      <div>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/engagements')}>
          &larr; Back to Engagements
        </button>
        <div className="alert alert-danger" style={{ marginTop: '1rem' }}>
          {error || 'Engagement not found.'}
        </div>
      </div>
    );
  }

  const tasks = engagement.tasks || [];
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div>
      <div style={{ marginBottom: '1.25rem' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/engagements')}>
          &larr; Back to Engagements
        </button>
      </div>

      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 className="page-title">{engagement.title}</h1>
            <StatusBadge status={engagement.status} />
          </div>
          <p className="page-subtitle">
            Client: <strong>{engagement.client?.name}</strong> &bull; Service: {engagement.serviceType?.name} &bull; Period: {engagement.periodKey}
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="detail-grid" style={{ marginBottom: '1.5rem' }}>
        <div>
          <div className="detail-item-label">Period Timeline</div>
          <div className="detail-item-value">
            {formatDate(engagement.periodStart)} &ndash; {formatDate(engagement.periodEnd)}
          </div>
        </div>
        <div>
          <div className="detail-item-label">Engagement Manager</div>
          <div className="detail-item-value">{engagement.manager?.fullName || 'Unassigned'}</div>
        </div>
        <div>
          <div className="detail-item-label">Service Recurrence</div>
          <div className="detail-item-value" style={{ textTransform: 'capitalize' }}>
            {engagement.serviceType?.isRecurring ? `${engagement.serviceType.recurrenceInterval} recurring` : 'One-time project'}
          </div>
        </div>
        <div>
          <div className="detail-item-label">Overall Completion</div>
          <div className="detail-item-value">
            {completedCount} of {tasks.length} tasks completed ({progressPercent}%)
          </div>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="table-card">
        <div className="table-toolbar">
          <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-gray-900)' }}>
            Engagement Tasks Checklist ({tasks.length})
          </div>
        </div>

        <div className="table-container">
          {tasks.length === 0 ? (
            <div className="empty-state">
              <p>No tasks spawned for this engagement.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Task Name</th>
                  <th>Assignee</th>
                  <th>Reviewer</th>
                  <th>Due Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => {
                  const isOverdue =
                    task.dueDate &&
                    new Date(task.dueDate) < new Date() &&
                    !['completed', 'cancelled'].includes(task.status);

                  return (
                    <tr
                      key={task.id}
                      className="clickable-row"
                      onClick={() => setSelectedTaskId(task.id)}
                    >
                      <td>
                        <div style={{ fontWeight: 600 }}>{task.title}</div>
                        {task.description && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', marginTop: '2px' }}>
                            {task.description}
                          </div>
                        )}
                      </td>
                      <td>{task.assignee ? task.assignee.fullName : <span style={{ color: 'var(--color-gray-400)' }}>Unassigned</span>}</td>
                      <td>{task.reviewer ? task.reviewer.fullName : <span style={{ color: 'var(--color-gray-400)' }}>None</span>}</td>
                      <td>
                        <span style={{ color: isOverdue ? 'var(--color-danger)' : 'inherit', fontWeight: isOverdue ? 600 : 400 }}>
                          {formatDate(task.dueDate)}
                          {isOverdue && ' (Overdue)'}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={task.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <TaskDrawer
        taskId={selectedTaskId}
        isOpen={Boolean(selectedTaskId)}
        onClose={() => setSelectedTaskId(null)}
        onTaskUpdated={loadEngagement}
      />
    </div>
  );
}
