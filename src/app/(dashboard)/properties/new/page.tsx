'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { PropertyForm } from '@/components/properties/PropertyForm';

export default function NewPropertyPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create property');
      const property = await res.json();
      router.push(`/properties/${property.id}`);
    } catch (error) {
      console.error(error);
      alert('Failed to create property');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add New Property</h1>
        <p className="text-gray-600">Enter the property details below</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <PropertyForm
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
