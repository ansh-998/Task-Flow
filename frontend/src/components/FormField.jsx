// ============================================================================
// File: frontend/src/components/FormField.jsx
// Description: Reusable form field wrapper with label and error rendering
// ============================================================================

import React from 'react';

export default function FormField({ label, required = false, error, children, style }) {
  return (
    <div className="form-group" style={style}>
      {label && (
        <label className="form-label">
          {label} {required && <span style={{ color: 'var(--color-danger)' }}>*</span>}
        </label>
      )}
      {children}
      {error && <div className="form-error">{error}</div>}
    </div>
  );
}
