'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const maintenanceSchema = z.object({
  property_id: z.string().uuid('Select a property'),
  unit_id: z.string().uuid().optional(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(10, 'Please provide more details'),
  category: z.enum(['plumbing', 'electrical', 'hvac', 'appliance', 'structural', 'pest', 'landscaping', 'cleaning', 'other']),
  priority: z.enum(['emergency', 'urgent', 'routine', 'preventive']).default('routine'),
  source: z.enum(['tenant', 'owner', 'pm', 'inspection']).default('pm'),
  location_in_unit: z.string().optional(),
  access_instructions: z.string().optional(),
  estimated_cost: z.coerce.number().min(0).optional(),
  scheduled_date: z.string().optional(),
});

type MaintenanceFormData = z.infer<typeof maintenanceSchema>;

interface MaintenanceFormProps {
  defaultValues?: Partial<MaintenanceFormData>;
  properties: { id: string; address: string }[];
  onSubmit: (data: MaintenanceFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function MaintenanceForm({ defaultValues, properties, onSubmit, onCancel, isLoading }: MaintenanceFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      priority: 'routine',
      source: 'pm',
      category: 'other',
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Property Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Property *</label>
          <select
            {...register('property_id')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a property</option>
            {properties.map(p => (
              <option key={p.id} value={p.id}>{p.address}</option>
            ))}
          </select>
          {errors.property_id && <p className="mt-1 text-sm text-red-600">{errors.property_id.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location in Unit</label>
          <input
            {...register('location_in_unit')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Kitchen, Master Bathroom, etc."
          />
        </div>
      </div>

      {/* Issue Details */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Issue Title *</label>
        <input
          {...register('title')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Leaking faucet in kitchen"
        />
        {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
        <textarea
          {...register('description')}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Please describe the issue in detail..."
        />
        {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
      </div>

      {/* Category & Priority */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
          <select
            {...register('category')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="plumbing">Plumbing</option>
            <option value="electrical">Electrical</option>
            <option value="hvac">HVAC</option>
            <option value="appliance">Appliance</option>
            <option value="structural">Structural</option>
            <option value="pest">Pest Control</option>
            <option value="landscaping">Landscaping</option>
            <option value="cleaning">Cleaning</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Priority *</label>
          <select
            {...register('priority')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="emergency">Emergency</option>
            <option value="urgent">Urgent</option>
            <option value="routine">Routine</option>
            <option value="preventive">Preventive</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
          <select
            {...register('source')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="tenant">Tenant</option>
            <option value="owner">Owner</option>
            <option value="pm">Property Manager</option>
            <option value="inspection">Inspection</option>
          </select>
        </div>
      </div>

      {/* Scheduling & Cost */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
          <input
            type="date"
            {...register('scheduled_date')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Cost</label>
          <input
            type="number"
            {...register('estimated_cost')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="0.00"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Access Instructions</label>
        <textarea
          {...register('access_instructions')}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Lockbox code, contact tenant first, etc."
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Create Work Order'}
        </button>
      </div>
    </form>
  );
}
