import { useState, useEffect, useCallback } from 'react';

interface Tenant {
  id: string;
  organization_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export function useTenants(options: { status?: string; autoFetch?: boolean } = {}) {
  const { status, autoFetch = true } = options;
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      const res = await fetch(`/api/tenants?${params}`);
      if (!res.ok) throw new Error('Failed to fetch tenants');
      const data = await res.json();
      setTenants(data.tenants || data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }, [status]);

  const createTenant = async (tenant: Partial<Tenant>) => {
    const res = await fetch('/api/tenants', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(tenant) });
    if (!res.ok) throw new Error('Failed to create tenant');
    const data = await res.json();
    setTenants(prev => [...prev, data.tenant || data]);
    return data.tenant || data;
  };

  const updateTenant = async (id: string, updates: Partial<Tenant>) => {
    const res = await fetch(`/api/tenants/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
    if (!res.ok) throw new Error('Failed to update tenant');
    const data = await res.json();
    setTenants(prev => prev.map(t => t.id === id ? (data.tenant || data) : t));
    return data.tenant || data;
  };

  const deleteTenant = async (id: string) => {
    const res = await fetch(`/api/tenants/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete tenant');
    setTenants(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => { if (autoFetch) fetchTenants(); }, [autoFetch, fetchTenants]);

  return { tenants, loading, error, fetchTenants, createTenant, updateTenant, deleteTenant };
}

export function useTenant(id: string | null) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/tenants/${id}`)
      .then(res => { if (!res.ok) throw new Error('Tenant not found'); return res.json(); })
      .then(data => setTenant(data.tenant || data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  return { tenant, loading, error };
}
