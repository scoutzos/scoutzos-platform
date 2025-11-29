'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { MaintenanceForm } from '@/components/maintenance/MaintenanceForm';

export default function EditMaintenancePage() {
  const router = useRouter();
  const params = useParams();
  const [workOrder, setWorkOrder] = useState<any>(null);
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/work-orders/${params.id}`).then(r => r.json()),
      fetch('/api/properties').then(r => r.json()),
    ]).then(([wo, props]) => {
      setWorkOrder(wo);
      setProperties(props.map((p: any) => ({ id: p.id, address: `${p.address_line1}, ${p.city}` })));
      setIsFetching(false);
    }).catch(() => setIsFetching(false));
  }, [params.id]);

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/work-orders/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update work order');
      router.push(`/maintenance/${params.id}`);
    } catch (error) {
      console.error(error);
      alert('Failed to update work order');
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

  if (!workOrder) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Work order not found</h1>
        <button onClick={() => router.back()} className="mt-4 text-blue-600 hover:underline">
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Work Order</h1>
        <p className="text-gray-600">{workOrder.title}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <MaintenanceForm
          defaultValues={workOrder}
          properties={properties}
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
