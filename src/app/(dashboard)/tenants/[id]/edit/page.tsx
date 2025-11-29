'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { TenantForm } from '@/components/tenants/TenantForm';

export default function EditTenantPage() {
  const router = useRouter();
  const params = useParams();
  const [tenant, setTenant] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    fetch(`/api/tenants/${params.id}`)
      .then(res => res.json())
      .then(data => {
        setTenant(data);
        setIsFetching(false);
      })
      .catch(() => setIsFetching(false));
  }, [params.id]);

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/tenants/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update tenant');
      router.push(`/tenants/${params.id}`);
    } catch (error) {
      console.error(error);
      alert('Failed to update tenant');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Tenant not found</h1>
        <button onClick={() => router.back()} className="mt-4 text-blue-600 hover:underline">
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Tenant</h1>
        <p className="text-gray-600">{tenant.first_name} {tenant.last_name}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <TenantForm
          defaultValues={tenant}
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
