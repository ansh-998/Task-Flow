// ============================================================================
// File: frontend/src/utils/formatDate.js
// Description: Date, time, and relative timestamp formatters
// ============================================================================

export function formatDate(dateInput) {
  if (!dateInput) return '—';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function formatDateTime(dateInput) {
  if (!dateInput) return '—';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function isDatePast(dateInput) {
  if (!dateInput) return false;
  const date = new Date(dateInput);
  return date < new Date();
}

export default {
  formatDate,
  formatDateTime,
  isDatePast
};
