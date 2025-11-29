import { useState, useEffect, useCallback } from 'react';

interface Property {
  id: string;
  organization_id: string;
  name: string;
  property_type: string;
  status: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  lot_size?: number;
  year_built?: number;
  monthly_rent?: number;
  deposit_amount?: number;
  description?: string;
  amenities?: string[];
  photos?: string[];
  created_at: string;
  updated_at: string;
}

interface UsePropertiesOptions {
  status?: string;
  autoFetch?: boolean;
}

export function useProperties(options: UsePropertiesOptions = {}) {
  const { status, autoFetch = true } = options;
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      const res = await fetch(`/api/properties?${params}`);
      if (!res.ok) throw new Error('Failed to fetch properties');
      const data = await res.json();
      setProperties(data.properties || data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }, [status]);

  const createProperty = async (property: Partial<Property>) => {
    const res = await fetch('/api/properties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(property),
    });
    if (!res.ok) throw new Error('Failed to create property');
    const data = await res.json();
    setProperties(prev => [...prev, data.property || data]);
    return data.property || data;
  };

  const updateProperty = async (id: string, updates: Partial<Property>) => {
    const res = await fetch(`/api/properties/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update property');
    const data = await res.json();
    setProperties(prev => prev.map(p => p.id === id ? (data.property || data) : p));
    return data.property || data;
  };

  const deleteProperty = async (id: string) => {
    const res = await fetch(`/api/properties/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete property');
    setProperties(prev => prev.filter(p => p.id !== id));
  };

  useEffect(() => {
    if (autoFetch) fetchProperties();
  }, [autoFetch, fetchProperties]);

  return { properties, loading, error, fetchProperties, createProperty, updateProperty, deleteProperty };
}

export function useProperty(id: string | null) {
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/properties/${id}`)
      .then(res => { if (!res.ok) throw new Error('Property not found'); return res.json(); })
      .then(data => setProperty(data.property || data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  return { property, loading, error };
}
