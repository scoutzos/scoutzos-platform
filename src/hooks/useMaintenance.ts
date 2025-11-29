import { useState, useEffect, useCallback } from 'react';

interface MaintenanceRequest {
  id: string;
  organization_id: string;
  property_id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

export function useMaintenance(options: { status?: string; priority?: string; propertyId?: string; autoFetch?: boolean } = {}) {
  const { status, priority, propertyId, autoFetch = true } = options;
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (priority) params.set('priority', priority);
      if (propertyId) params.set('property_id', propertyId);
      const res = await fetch(`/api/maintenance?${params}`);
      if (!res.ok) throw new Error('Failed to fetch requests');
      const data = await res.json();
      setRequests(data.requests || data.maintenance_requests || data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }, [status, priority, propertyId]);

  const createRequest = async (request: Partial<MaintenanceRequest>) => {
    const res = await fetch('/api/maintenance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request) });
    if (!res.ok) throw new Error('Failed to create request');
    const data = await res.json();
    setRequests(prev => [...prev, data.request || data]);
    return data.request || data;
  };

  const updateRequest = async (id: string, updates: Partial<MaintenanceRequest>) => {
    const res = await fetch(`/api/maintenance/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
    if (!res.ok) throw new Error('Failed to update request');
    const data = await res.json();
    setRequests(prev => prev.map(r => r.id === id ? (data.request || data) : r));
    return data.request || data;
  };

  const deleteRequest = async (id: string) => {
    const res = await fetch(`/api/maintenance/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete request');
    setRequests(prev => prev.filter(r => r.id !== id));
  };

  useEffect(() => { if (autoFetch) fetchRequests(); }, [autoFetch, fetchRequests]);

  return { requests, loading, error, fetchRequests, createRequest, updateRequest, deleteRequest };
}

export function useMaintenanceRequest(id: string | null) {
  const [request, setRequest] = useState<MaintenanceRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/maintenance/${id}`)
      .then(res => { if (!res.ok) throw new Error('Request not found'); return res.json(); })
      .then(data => setRequest(data.request || data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  return { request, loading, error };
}
