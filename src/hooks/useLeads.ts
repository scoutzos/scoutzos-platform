import { useState, useEffect, useCallback } from 'react';

interface Lead {
  id: string;
  organization_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export function useLeads(options: { status?: string; propertyId?: string; autoFetch?: boolean } = {}) {
  const { status, propertyId, autoFetch = true } = options;
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (propertyId) params.set('property_id', propertyId);
      const res = await fetch(`/api/leads?${params}`);
      if (!res.ok) throw new Error('Failed to fetch leads');
      const data = await res.json();
      setLeads(data.leads || data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }, [status, propertyId]);

  const createLead = async (lead: Partial<Lead>) => {
    const res = await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lead) });
    if (!res.ok) throw new Error('Failed to create lead');
    const data = await res.json();
    setLeads(prev => [...prev, data.lead || data]);
    return data.lead || data;
  };

  const updateLead = async (id: string, updates: Partial<Lead>) => {
    const res = await fetch(`/api/leads/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
    if (!res.ok) throw new Error('Failed to update lead');
    const data = await res.json();
    setLeads(prev => prev.map(l => l.id === id ? (data.lead || data) : l));
    return data.lead || data;
  };

  const deleteLead = async (id: string) => {
    const res = await fetch(`/api/leads/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete lead');
    setLeads(prev => prev.filter(l => l.id !== id));
  };

  useEffect(() => { if (autoFetch) fetchLeads(); }, [autoFetch, fetchLeads]);

  return { leads, loading, error, fetchLeads, createLead, updateLead, deleteLead };
}

export function useLead(id: string | null) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/leads/${id}`)
      .then(res => { if (!res.ok) throw new Error('Lead not found'); return res.json(); })
      .then(data => setLead(data.lead || data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  return { lead, loading, error };
}
