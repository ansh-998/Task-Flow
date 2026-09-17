// ============================================================================
// File: client/src/components/TaskTable.jsx
// Description: Reusable task data grid with search, filter, and drawer trigger
// ============================================================================

import React, { useState, useMemo } from 'react';
import StatusBadge from './StatusBadge.jsx';

export default function TaskTable({ tasks = [], onSelectTask, emptyMessage = 'No tasks found.' }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesSearch =
        searchTerm === '' ||
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.engagement?.client?.name && t.engagement.client.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.engagement?.title && t.engagement.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.assignee?.fullName && t.assignee.fullName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [tasks, searchTerm, statusFilter]);

  return (
    <div className="table-card">
      <div className="table-toolbar">
        <div className="table-search">
          <input
            type="text"
            className="form-control"
            placeholder="Search tasks, clients, workers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select
            className="form-control"
            style={{ width: 'auto' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="waiting_for_client">Waiting on Client</option>
            <option value="ready_for_review">Ready for Review</option>
            <option value="changes_requested">Changes Requested</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        {filteredTasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">&#128221;</div>
            <p>{emptyMessage}</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Task Title</th>
                <th>Client</th>
                <th>Engagement / Period</th>
                <th>Assignee</th>
                <th>Reviewer</th>
                <th>Due Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task) => {
                const isOverdue =
                  task.dueDate &&
                  new Date(task.dueDate) < new Date() &&
                  !['completed', 'cancelled'].includes(task.status);

                return (
                  <tr
                    key={task.id}
                    className="clickable-row"
                    onClick={() => onSelectTask(task.id)}
                  >
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--color-gray-900)' }}>
                        {task.title}
                      </div>
                    </td>
                    <td>{task.engagement?.client?.name || '—'}</td>
                    <td>
                      <div>{task.engagement?.title || '—'}</div>
                      {task.engagement?.periodKey && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)' }}>
                          {task.engagement.periodKey}
                        </div>
                      )}
                    </td>
                    <td>{task.assignee?.fullName || <span style={{ color: 'var(--color-gray-400)' }}>Unassigned</span>}</td>
                    <td>{task.reviewer?.fullName || <span style={{ color: 'var(--color-gray-400)' }}>None</span>}</td>
                    <td>
                      <span style={{ color: isOverdue ? 'var(--color-danger)' : 'inherit', fontWeight: isOverdue ? 600 : 400 }}>
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}
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
  );
}
