'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { LeaseForm } from '@/components/leases/LeaseForm';

export default function NewLeasePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [properties, setProperties] = useState([]);
  const [tenants, setTenants] = useState([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/properties').then(r => r.json()),
      fetch('/api/tenants').then(r => r.json()),
    ]).then(([props, tens]) => {
      setProperties(props.map((p: any) => ({ id: p.id, address: `${p.address_line1}, ${p.city}` })));
      setTenants(tens.map((t: any) => ({ id: t.id, name: `${t.first_name} ${t.last_name}` })));
    });
  }, []);

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/leases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create lease');
      const lease = await res.json();
      router.push(`/leases/${lease.id}`);
    } catch (error) {
      console.error(error);
      alert('Failed to create lease');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create New Lease</h1>
        <p className="text-gray-600">Set up a lease agreement</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <LeaseForm
          properties={properties}
          tenants={tenants}
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
