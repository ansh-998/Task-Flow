// ============================================================================
// File: frontend/src/components/TaskDrawer.jsx
// Description: Slide-over drawer with task details, workflow actions, and audit trail
// ============================================================================

import React, { useState, useEffect } from 'react';
import tasksApi from '../api/tasks.api.js';
import usersApi from '../api/users.api.js';
import StatusBadge from './StatusBadge.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { formatDate } from '../utils/formatDate.js';

export default function TaskDrawer({ taskId, isOpen, onClose, onTaskUpdated }) {
  const { user, isAdmin, isManager } = useAuth();
  const [task, setTask] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [comment, setComment] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [usersList, setUsersList] = useState([]);

  // Assignment edit state
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [selectedReviewer, setSelectedReviewer] = useState('');
  const [selectedDueDate, setSelectedDueDate] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Load task and activity details
  useEffect(() => {
    if (!isOpen || !taskId) return;

    let mounted = true;
    async function fetchTaskData() {
      setLoading(true);
      setError(null);
      try {
        const [taskRes, actRes] = await Promise.all([
          tasksApi.getTaskById(taskId),
          tasksApi.getTaskActivity(taskId)
        ]);

        if (mounted) {
          setTask(taskRes.data);
          setActivities(actRes.data || []);
          setSelectedAssignee(taskRes.data.assigneeId || '');
          setSelectedReviewer(taskRes.data.reviewerId || '');
          setSelectedDueDate(taskRes.data.dueDate ? new Date(taskRes.data.dueDate).toISOString().split('T')[0] : '');
        }
      } catch (err) {
        if (mounted) setError(err.message || 'Failed to load task details');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchTaskData();
    return () => { mounted = false; };
  }, [isOpen, taskId]);

  // Load team users for assignment if manager or admin
  useEffect(() => {
    if (!isOpen || (!isAdmin && !isManager)) return;
    async function loadUsers() {
      try {
        const res = await usersApi.getUsers();
        setUsersList(res.data || []);
      } catch (err) {
        console.error('Failed to load user list', err);
      }
    }
    loadUsers();
  }, [isOpen, isAdmin, isManager]);

  if (!isOpen) return null;

  // Handle status transitions
  const handleTransition = async (newStatus) => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await tasksApi.updateStatus(taskId, {
        status: newStatus,
        comment: comment.trim() || undefined
      });
      setTask(res.data);
      setComment('');
      // Refresh audit trail
      const actRes = await tasksApi.getTaskActivity(taskId);
      setActivities(actRes.data || []);
      if (onTaskUpdated) onTaskUpdated(res.data);
    } catch (err) {
      setError(err.message || 'Transition failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle review decision
  const handleReview = async (decision) => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await tasksApi.reviewTask(taskId, {
        decision,
        comment: reviewComment.trim() || undefined
      });
      setTask(res.data);
      setReviewComment('');
      const actRes = await tasksApi.getTaskActivity(taskId);
      setActivities(actRes.data || []);
      if (onTaskUpdated) onTaskUpdated(res.data);
    } catch (err) {
      setError(err.message || 'Review action failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle reassign
  const handleSaveAssignment = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    try {
      const res = await tasksApi.assignTask(taskId, {
        assigneeId: selectedAssignee || null,
        reviewerId: selectedReviewer || null,
        dueDate: selectedDueDate ? new Date(selectedDueDate).toISOString() : null
      });
      setTask(res.data);
      setIsAssigning(false);
      const actRes = await tasksApi.getTaskActivity(taskId);
      setActivities(actRes.data || []);
      if (onTaskUpdated) onTaskUpdated(res.data);
    } catch (err) {
      setError(err.message || 'Assignment failed');
    } finally {
      setActionLoading(false);
    }
  };

  const isAssignee = task && task.assigneeId === user?.id;
  const isReviewer = task && task.reviewerId === user?.id;
  const isEngagementManager = task && isManager && (task.engagement?.managerId === user?.id || task.engagement?.createdById === user?.id);
  const canModify = isAdmin || isEngagementManager || isAssignee;
  const isOverdue = task && task.dueDate && new Date(task.dueDate) < new Date() && !['completed', 'cancelled'].includes(task.status);

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h3 className="drawer-title">{loading ? 'Loading Task...' : task?.title}</h3>
            {task && <StatusBadge status={task.status} />}
          </div>
          <button className="drawer-close" onClick={onClose}>&times;</button>
        </div>

        <div className="drawer-body">
          {error && <div className="alert alert-danger">{error}</div>}

          {loading ? (
            <div className="empty-state">
              <div className="spinner" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
              <p style={{ marginTop: '0.75rem' }}>Loading task details...</p>
            </div>
          ) : task ? (
            <>
              {/* Core Details Grid */}
              <div className="detail-grid">
                <div>
                  <div className="detail-item-label">Client</div>
                  <div className="detail-item-value">{task.engagement?.client?.name || '—'}</div>
                </div>
                <div>
                  <div className="detail-item-label">Engagement & Period</div>
                  <div className="detail-item-value">
                    {task.engagement?.title} ({task.engagement?.periodKey || 'N/A'})
                  </div>
                </div>
                <div>
                  <div className="detail-item-label">Assignee</div>
                  <div className="detail-item-value">
                    {task.assignee ? task.assignee.fullName : 'Unassigned'}
                  </div>
                </div>
                <div>
                  <div className="detail-item-label">Reviewer</div>
                  <div className="detail-item-value">
                    {task.reviewer ? task.reviewer.fullName : 'None'}
                  </div>
                </div>
                <div>
                  <div className="detail-item-label">Due Date</div>
                  <div className="detail-item-value" style={{ color: isOverdue ? 'var(--color-danger)' : 'inherit' }}>
                    {formatDate(task.dueDate)}
                    {isOverdue && ' (Overdue)'}
                  </div>
                </div>
                <div>
                  <div className="detail-item-label">Completed Date</div>
                  <div className="detail-item-value">
                    {formatDate(task.completedAt)}
                  </div>
                </div>
              </div>

              {task.description && (
                <div className="drawer-section">
                  <div className="drawer-section-title">Description</div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-gray-700)', lineHeight: '1.6' }}>
                    {task.description}
                  </p>
                </div>
              )}

              {/* Workflow Actions Section */}
              {task.status !== 'completed' && task.status !== 'cancelled' && (
                <div className="workflow-actions-box">
                  <div className="drawer-section-title" style={{ color: 'var(--color-primary)' }}>
                    Workflow Actions
                  </div>

                  {/* Comment Input for Transitions */}
                  {task.status !== 'ready_for_review' && canModify && (
                    <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Optional transition note..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        disabled={actionLoading}
                      />
                    </div>
                  )}

                  <div className="action-buttons-row">
                    {/* Transitions for not_started */}
                    {task.status === 'not_started' && canModify && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleTransition('in_progress')}
                        disabled={actionLoading}
                      >
                        Start Work &rarr;
                      </button>
                    )}

                    {/* Transitions for in_progress */}
                    {task.status === 'in_progress' && canModify && (
                      <>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleTransition('waiting_for_client')}
                          disabled={actionLoading}
                        >
                          Waiting on Client
                        </button>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleTransition('ready_for_review')}
                          disabled={actionLoading}
                        >
                          Submit for Review &rarr;
                        </button>
                      </>
                    )}

                    {/* Transitions for waiting_for_client */}
                    {task.status === 'waiting_for_client' && canModify && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleTransition('in_progress')}
                        disabled={actionLoading}
                      >
                        Resume Work &rarr;
                      </button>
                    )}

                    {/* Transitions for changes_requested */}
                    {task.status === 'changes_requested' && canModify && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleTransition('in_progress')}
                        disabled={actionLoading}
                      >
                        Revise Work &rarr;
                      </button>
                    )}

                    {/* Review Section (ready_for_review) */}
                    {task.status === 'ready_for_review' && (
                      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {isAssignee ? (
                          <div className="alert alert-danger" style={{ margin: 0 }}>
                            <strong>Anti-Self-Approval Enforcement:</strong> You are assigned to this task. A peer reviewer, manager, or administrator must review and approve your work.
                          </div>
                        ) : (isAdmin || isEngagementManager || isReviewer) ? (
                          <>
                            <textarea
                              className="form-control"
                              placeholder="Reviewer notes or change request details..."
                              value={reviewComment}
                              onChange={(e) => setReviewComment(e.target.value)}
                              disabled={actionLoading}
                              rows={2}
                            />
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                className="btn btn-success btn-sm"
                                onClick={() => handleReview('approve')}
                                disabled={actionLoading}
                              >
                                &#10003; Approve & Complete
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleReview('request_changes')}
                                disabled={actionLoading}
                              >
                                &#9888; Request Changes
                              </button>
                            </div>
                          </>
                        ) : (
                          <p style={{ fontSize: '0.8rem', color: 'var(--color-gray-500)' }}>
                            Awaiting review by designated reviewer ({task.reviewer?.fullName || 'Manager'}).
                          </p>
                        )}
                      </div>
                    )}

                    {/* Cancel Action for Manager/Admin */}
                    {(isAdmin || isEngagementManager) && (
                      <button
                        className="btn btn-outline-danger btn-sm"
                        style={{ marginLeft: 'auto' }}
                        onClick={() => handleTransition('cancelled')}
                        disabled={actionLoading}
                      >
                        Cancel Task
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Assignment Management (Admin/Manager) */}
              {(isAdmin || isEngagementManager) && (
                <div className="drawer-section">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="drawer-section-title">Task Assignment & Deadlines</div>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setIsAssigning(!isAssigning)}
                    >
                      {isAssigning ? 'Cancel' : 'Edit Assignment & Deadline'}
                    </button>
                  </div>

                  {isAssigning && (
                    <form onSubmit={handleSaveAssignment} style={{ marginTop: '0.75rem' }}>
                      <div className="form-group">
                        <label className="form-label">Assignee (Worker)</label>
                        <select
                          className="form-control"
                          value={selectedAssignee}
                          onChange={(e) => setSelectedAssignee(e.target.value)}
                        >
                          <option value="">-- Unassigned --</option>
                          {usersList.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.fullName} ({u.role})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Reviewer</label>
                        <select
                          className="form-control"
                          value={selectedReviewer}
                          onChange={(e) => setSelectedReviewer(e.target.value)}
                        >
                          <option value="">-- No Reviewer --</option>
                          {usersList.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.fullName} ({u.role})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Deadline (Due Date)</label>
                        <input
                          type="date"
                          className="form-control"
                          value={selectedDueDate}
                          onChange={(e) => setSelectedDueDate(e.target.value)}
                          disabled={actionLoading}
                        />
                      </div>

                      <button
                        type="submit"
                        className="btn btn-primary btn-sm"
                        disabled={actionLoading}
                      >
                        {actionLoading ? 'Saving...' : 'Save Assignment & Deadline'}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Audit Trail & Timeline */}
              <div className="drawer-section">
                <div className="drawer-section-title">Audit Trail & Activity Log</div>
                {activities.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-gray-400)' }}>No activities logged yet.</p>
                ) : (
                  <div className="timeline">
                    {activities.map((act) => (
                      <div key={act.id} className="timeline-item">
                        <div className="timeline-bullet" />
                        <div>
                          <span className="timeline-actor">{act.actor?.fullName || 'System'}</span>
                          {' '}
                          <span style={{ color: 'var(--color-gray-600)' }}>
                            {act.action === 'status_change' && `changed status from ${act.fromStatus?.replace(/_/g, ' ')} to ${act.toStatus?.replace(/_/g, ' ')}`}
                            {act.action === 'review' && `reviewed task: ${act.metadata?.decision === 'approve' ? 'Approved' : 'Changes Requested'}`}
                            {act.action === 'assigned' && 'updated task assignment'}
                            {act.action === 'engagement_created' && 'spawned task from template blueprint'}
                          </span>
                        </div>
                        <div className="timeline-time">
                          {new Date(act.createdAt).toLocaleString()}
                        </div>
                        {act.comment && (
                          <div className="timeline-comment">
                            &ldquo;{act.comment}&rdquo;
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
