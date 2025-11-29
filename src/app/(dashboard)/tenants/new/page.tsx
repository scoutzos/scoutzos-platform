'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { TenantForm } from '@/components/tenants/TenantForm';

export default function NewTenantPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create tenant');
      const tenant = await res.json();
      router.push(`/tenants/${tenant.id}`);
    } catch (error) {
      console.error(error);
      alert('Failed to create tenant');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add New Tenant</h1>
        <p className="text-gray-600">Enter the tenant information below</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <TenantForm
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
