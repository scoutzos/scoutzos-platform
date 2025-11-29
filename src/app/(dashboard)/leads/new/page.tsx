'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { LeadForm } from '@/components/leads/LeadForm';

export default function NewLeadPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    fetch('/api/properties')
      .then(r => r.json())
      .then(props => {
        setProperties(props.map((p: any) => ({ id: p.id, address: `${p.address_line1}, ${p.city}` })));
      });
  }, []);

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create lead');
      const lead = await res.json();
      router.push(`/leads/${lead.id}`);
    } catch (error) {
      console.error(error);
      alert('Failed to create lead');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add New Lead</h1>
        <p className="text-gray-600">Enter lead information</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <LeadForm
          properties={properties}
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
