// ============================================================================
// File: frontend/src/components/Modal.jsx
// Description: Generic modal dialog container with accessible backdrop
// ============================================================================

import React from 'react';

export default function Modal({ isOpen, onClose, title, children, footer }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="drawer-close" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
        {footer && (
          <div className="form-actions" style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--color-gray-200)', margin: 0 }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
