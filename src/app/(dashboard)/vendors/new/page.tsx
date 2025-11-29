'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { VendorForm } from '@/components/vendors/VendorForm';

export default function NewVendorPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create vendor');
      const vendor = await res.json();
      router.push(`/vendors/${vendor.id}`);
    } catch (error) {
      console.error(error);
      alert('Failed to create vendor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add New Vendor</h1>
        <p className="text-gray-600">Register a service provider</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <VendorForm
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
