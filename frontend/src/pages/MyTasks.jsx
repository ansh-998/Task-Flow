// ============================================================================
// File: frontend/src/pages/MyTasks.jsx
// Description: Dedicated My Tasks workspace with status tab filtering
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import tasksApi from '../api/tasks.api.js';
import TaskTable from '../components/TaskTable.jsx';
import TaskDrawer from '../components/TaskDrawer.jsx';

export default function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await tasksApi.getMyTasks();
      setTasks(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Assigned & Review Tasks</h1>
          <p className="page-subtitle">
            All deliverables where you are either the assigned worker or designated reviewer.
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={loadTasks} disabled={loading}>
          &#8635; Refresh
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="empty-state">
          <div className="spinner" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
          <p style={{ marginTop: '0.75rem' }}>Loading tasks...</p>
        </div>
      ) : (
        <TaskTable
          tasks={tasks}
          onSelectTask={(id) => setSelectedTaskId(id)}
          emptyMessage="You have no tasks assigned or awaiting review."
        />
      )}

      <TaskDrawer
        taskId={selectedTaskId}
        isOpen={Boolean(selectedTaskId)}
        onClose={() => setSelectedTaskId(null)}
        onTaskUpdated={loadTasks}
      />
    </div>
  );
}
