// ============================================================================
// File: frontend/src/hooks/useFetch.js
// Description: Reusable data fetching hook with loading, error, and refetch states
// ============================================================================

import { useState, useEffect, useCallback } from 'react';

export function useFetch(fetchFn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFn();
      setData(res.data !== undefined ? res.data : res);
      return res;
    } catch (err) {
      setError(err.message || 'Failed to fetch data');
      throw err;
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    execute().catch(() => {});
  }, [execute]);

  return {
    data,
    loading,
    error,
    refetch: execute,
    setData
  };
}

export default useFetch;
