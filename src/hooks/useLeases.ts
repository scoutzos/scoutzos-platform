import { useState, useEffect, useCallback } from 'react';

interface Lease {
  id: string;
  organization_id: string;
  property_id: string;
  tenant_id: string;
  status: string;
  start_date: string;
  end_date: string;
  rent_amount: number;
  created_at: string;
  updated_at: string;
}

export function useLeases(options: { status?: string; propertyId?: string; tenantId?: string; autoFetch?: boolean } = {}) {
  const { status, propertyId, tenantId, autoFetch = true } = options;
  const [leases, setLeases] = useState<Lease[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeases = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (propertyId) params.set('property_id', propertyId);
      if (tenantId) params.set('tenant_id', tenantId);
      const res = await fetch(`/api/leases?${params}`);
      if (!res.ok) throw new Error('Failed to fetch leases');
      const data = await res.json();
      setLeases(data.leases || data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }, [status, propertyId, tenantId]);

  const createLease = async (lease: Partial<Lease>) => {
    const res = await fetch('/api/leases', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lease) });
    if (!res.ok) throw new Error('Failed to create lease');
    const data = await res.json();
    setLeases(prev => [...prev, data.lease || data]);
    return data.lease || data;
  };

  const updateLease = async (id: string, updates: Partial<Lease>) => {
    const res = await fetch(`/api/leases/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
    if (!res.ok) throw new Error('Failed to update lease');
    const data = await res.json();
    setLeases(prev => prev.map(l => l.id === id ? (data.lease || data) : l));
    return data.lease || data;
  };

  const deleteLease = async (id: string) => {
    const res = await fetch(`/api/leases/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete lease');
    setLeases(prev => prev.filter(l => l.id !== id));
  };

  useEffect(() => { if (autoFetch) fetchLeases(); }, [autoFetch, fetchLeases]);

  return { leases, loading, error, fetchLeases, createLease, updateLease, deleteLease };
}

export function useLease(id: string | null) {
  const [lease, setLease] = useState<Lease | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/leases/${id}`)
      .then(res => { if (!res.ok) throw new Error('Lease not found'); return res.json(); })
      .then(data => setLease(data.lease || data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  return { lease, loading, error };
}
