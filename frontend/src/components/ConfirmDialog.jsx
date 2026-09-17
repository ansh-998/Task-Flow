// ============================================================================
// File: frontend/src/components/ConfirmDialog.jsx
// Description: Reusable confirmation modal dialog for critical actions
// ============================================================================

import React from 'react';

export default function ConfirmDialog({
  isOpen,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDanger = false,
  onConfirm,
  onCancel,
  isLoading = false
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="drawer-close" onClick={onCancel} disabled={isLoading}>
            &times;
          </button>
        </div>
        <div className="modal-body">
          <p style={{ color: 'var(--color-gray-600)', marginBottom: '1.5rem' }}>
            {message}
          </p>
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={isLoading}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              className={`btn ${isDanger ? 'btn-danger' : 'btn-primary'}`}
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
