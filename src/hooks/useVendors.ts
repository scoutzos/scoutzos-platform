import { useState, useEffect, useCallback } from 'react';

interface Vendor {
  id: string;
  organization_id: string;
  company_name: string;
  category: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export function useVendors(options: { status?: string; category?: string; autoFetch?: boolean } = {}) {
  const { status, category, autoFetch = true } = options;
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (category) params.set('category', category);
      const res = await fetch(`/api/vendors?${params}`);
      if (!res.ok) throw new Error('Failed to fetch vendors');
      const data = await res.json();
      setVendors(data.vendors || data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }, [status, category]);

  const createVendor = async (vendor: Partial<Vendor>) => {
    const res = await fetch('/api/vendors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(vendor) });
    if (!res.ok) throw new Error('Failed to create vendor');
    const data = await res.json();
    setVendors(prev => [...prev, data.vendor || data]);
    return data.vendor || data;
  };

  const updateVendor = async (id: string, updates: Partial<Vendor>) => {
    const res = await fetch(`/api/vendors/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
    if (!res.ok) throw new Error('Failed to update vendor');
    const data = await res.json();
    setVendors(prev => prev.map(v => v.id === id ? (data.vendor || data) : v));
    return data.vendor || data;
  };

  const deleteVendor = async (id: string) => {
    const res = await fetch(`/api/vendors/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete vendor');
    setVendors(prev => prev.filter(v => v.id !== id));
  };

  useEffect(() => { if (autoFetch) fetchVendors(); }, [autoFetch, fetchVendors]);

  return { vendors, loading, error, fetchVendors, createVendor, updateVendor, deleteVendor };
}

export function useVendor(id: string | null) {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/vendors/${id}`)
      .then(res => { if (!res.ok) throw new Error('Vendor not found'); return res.json(); })
      .then(data => setVendor(data.vendor || data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  return { vendor, loading, error };
}
