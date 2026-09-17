// ============================================================================
// File: frontend/src/pages/Dashboard.jsx
// Description: Operational dashboard with KPI cards, task overview, and drawer
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import dashboardApi from '../api/dashboard.api.js';
import tasksApi from '../api/tasks.api.js';
import { useAuth } from '../hooks/useAuth.js';
import TaskTable from '../components/TaskTable.jsx';
import TaskDrawer from '../components/TaskDrawer.jsx';

export default function Dashboard() {
  const { user, isAdmin, isManager } = useAuth();
  const [counts, setCounts] = useState({
    open: 0,
    overdue: 0,
    due_today: 0,
    waiting_for_client: 0,
    waiting_for_review: 0
  });
  const [tasks, setTasks] = useState([]);
  const [taskScope, setTaskScope] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchTasks = (isAdmin || isManager) && taskScope === 'all'
        ? tasksApi.getTasks()
        : tasksApi.getMyTasks();

      const [countsRes, tasksRes] = await Promise.all([
        dashboardApi.getDashboardCounts(),
        fetchTasks
      ]);
      setCounts(countsRes.data || {});
      setTasks(tasksRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, isManager, taskScope]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleTaskUpdated = () => {
    loadDashboardData();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Operational Dashboard</h1>
          <p className="page-subtitle">
            Welcome back, {user?.fullName}. Here is your live operations overview.
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={loadDashboardData} disabled={loading}>
          &#8635; Refresh Data
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* KPI Metric Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi-card kpi-open">
          <div className="kpi-title">Total Open Tasks</div>
          <div className="kpi-value">{loading ? '...' : counts.open}</div>
        </div>
        <div className="kpi-card kpi-overdue">
          <div className="kpi-title">Overdue Tasks</div>
          <div className="kpi-value">{loading ? '...' : counts.overdue}</div>
        </div>
        <div className="kpi-card kpi-today">
          <div className="kpi-title">Due Today</div>
          <div className="kpi-value">{loading ? '...' : counts.due_today}</div>
        </div>
        <div className="kpi-card kpi-waiting">
          <div className="kpi-title">Waiting on Client</div>
          <div className="kpi-value">{loading ? '...' : counts.waiting_for_client}</div>
        </div>
        <div className="kpi-card kpi-review">
          <div className="kpi-title">Pending Review</div>
          <div className="kpi-value">{loading ? '...' : counts.waiting_for_review}</div>
        </div>
      </div>

      {/* Task Queue Section */}
      <div style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-gray-900)' }}>
            Active Action Items ({tasks.length})
          </h2>
          {(isAdmin || isManager) && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className={`btn btn-sm ${taskScope === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setTaskScope('all')}
              >
                {isAdmin ? 'All Practice Tasks' : 'All Engagement Tasks'}
              </button>
              <button
                type="button"
                className={`btn btn-sm ${taskScope === 'mine' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setTaskScope('mine')}
              >
                My Assigned / Review
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="empty-state">
            <div className="spinner" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
            <p style={{ marginTop: '0.75rem' }}>Loading active tasks...</p>
          </div>
        ) : (
          <TaskTable
            tasks={tasks}
            onSelectTask={(id) => setSelectedTaskId(id)}
            emptyMessage="No open tasks in your active queue."
          />
        )}
      </div>

      {/* Task Drawer */}
      <TaskDrawer
        taskId={selectedTaskId}
        isOpen={Boolean(selectedTaskId)}
        onClose={() => setSelectedTaskId(null)}
        onTaskUpdated={handleTaskUpdated}
      />
    </div>
  );
}
