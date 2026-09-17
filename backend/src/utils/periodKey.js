// ============================================================================
// File: server/src/utils/periodKey.js
// Description: Period key calculation and deterministic recurrence helpers
// ============================================================================

export function computePeriodKey(dateInput, interval) {
  const d = new Date(dateInput);
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth() + 1;

  if (interval === 'monthly') {
    return `${year}-${String(month).padStart(2, '0')}`;
  }

  if (interval === 'quarterly') {
    const quarter = Math.ceil(month / 3);
    return `${year}-Q${quarter}`;
  }

  if (interval === 'yearly') {
    return `${year}`;
  }

  return `${year}-${String(month).padStart(2, '0')}`;
}

export function computeNextPeriod(periodKey, interval) {
  if (interval === 'monthly') {
    const [yearStr, monthStr] = periodKey.split('-');
    let year = parseInt(yearStr, 10);
    let month = parseInt(monthStr, 10);

    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }

    const nextKey = `${year}-${String(month).padStart(2, '0')}`;
    const periodStart = new Date(Date.UTC(year, month - 1, 1));
    const lastDayOfMonth = new Date(Date.UTC(year, month, 0)).getDate();
    const periodEnd = new Date(Date.UTC(year, month - 1, lastDayOfMonth));

    return {
      periodKey: nextKey,
      periodStart,
      periodEnd
    };
  }

  if (interval === 'quarterly') {
    const [yearStr, qStr] = periodKey.split('-Q');
    let year = parseInt(yearStr, 10);
    let q = parseInt(qStr, 10);

    q += 1;
    if (q > 4) {
      q = 1;
      year += 1;
    }

    const nextKey = `${year}-Q${q}`;
    const startMonth = (q - 1) * 3;
    const periodStart = new Date(Date.UTC(year, startMonth, 1));
    const endMonth = startMonth + 3;
    const lastDay = new Date(Date.UTC(year, endMonth, 0)).getDate();
    const periodEnd = new Date(Date.UTC(year, endMonth - 1, lastDay));

    return {
      periodKey: nextKey,
      periodStart,
      periodEnd
    };
  }

  if (interval === 'yearly') {
    let year = parseInt(periodKey, 10);
    year += 1;
    const nextKey = `${year}`;
    const periodStart = new Date(Date.UTC(year, 0, 1));
    const periodEnd = new Date(Date.UTC(year, 11, 31));

    return {
      periodKey: nextKey,
      periodStart,
      periodEnd
    };
  }

  // Default fallback
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return {
    periodKey: computePeriodKey(d, 'monthly'),
    periodStart: new Date(Date.UTC(d.getFullYear(), d.getMonth(), 1)),
    periodEnd: new Date(Date.UTC(d.getFullYear(), d.getMonth() + 1, 0))
  };
}
