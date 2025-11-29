'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const leaseSchema = z.object({
  property_id: z.string().uuid('Select a property'),
  unit_id: z.string().uuid().optional(),
  tenant_profile_id: z.string().uuid('Select a tenant'),
  lease_type: z.enum(['fixed', 'month_to_month']),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().optional(),
  rent_amount: z.coerce.number().positive('Rent amount is required'),
  rent_due_day: z.coerce.number().int().min(1).max(28).default(1),
  security_deposit: z.coerce.number().min(0).optional(),
  pet_deposit: z.coerce.number().min(0).optional(),
  late_fee_type: z.enum(['flat', 'percentage', 'daily']).optional(),
  late_fee_amount: z.coerce.number().min(0).optional(),
  late_fee_grace_days: z.coerce.number().int().min(0).default(5),
  parking_spaces: z.coerce.number().int().min(0).default(0),
  status: z.enum(['draft', 'pending_signature', 'active', 'expired', 'terminated', 'renewed']).default('draft'),
  notes: z.string().optional(),
});

type LeaseFormData = z.infer<typeof leaseSchema>;

interface LeaseFormProps {
  defaultValues?: Partial<LeaseFormData>;
  properties: { id: string; address: string }[];
  tenants: { id: string; name: string }[];
  onSubmit: (data: LeaseFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function LeaseForm({ defaultValues, properties, tenants, onSubmit, onCancel, isLoading }: LeaseFormProps) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<LeaseFormData>({
    resolver: zodResolver(leaseSchema),
    defaultValues: {
      lease_type: 'fixed',
      rent_due_day: 1,
      late_fee_grace_days: 5,
      parking_spaces: 0,
      status: 'draft',
      ...defaultValues,
    },
  });

  const leaseType = watch('lease_type');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Property & Tenant Selection */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Property & Tenant</h3>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Tenant *</label>
            <select
              {...register('tenant_profile_id')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a tenant</option>
              {tenants.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            {errors.tenant_profile_id && <p className="mt-1 text-sm text-red-600">{errors.tenant_profile_id.message}</p>}
          </div>
        </div>
      </div>

      {/* Lease Terms */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Lease Terms</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lease Type *</label>
            <select
              {...register('lease_type')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="fixed">Fixed Term</option>
              <option value="month_to_month">Month-to-Month</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              {...register('status')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="draft">Draft</option>
              <option value="pending_signature">Pending Signature</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="terminated">Terminated</option>
              <option value="renewed">Renewed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
            <input
              type="date"
              {...register('start_date')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.start_date && <p className="mt-1 text-sm text-red-600">{errors.start_date.message}</p>}
          </div>

          {leaseType === 'fixed' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                {...register('end_date')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* Rent & Deposits */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Rent & Deposits</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rent *</label>
            <input
              type="number"
              {...register('rent_amount')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.rent_amount && <p className="mt-1 text-sm text-red-600">{errors.rent_amount.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rent Due Day</label>
            <input
              type="number"
              {...register('rent_due_day')}
              min={1}
              max={28}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Security Deposit</label>
            <input
              type="number"
              {...register('security_deposit')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pet Deposit</label>
            <input
              type="number"
              {...register('pet_deposit')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Parking Spaces</label>
            <input
              type="number"
              {...register('parking_spaces')}
              min={0}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Late Fees */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Late Fees</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Late Fee Type</label>
            <select
              {...register('late_fee_type')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">None</option>
              <option value="flat">Flat Fee</option>
              <option value="percentage">Percentage</option>
              <option value="daily">Daily</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Late Fee Amount</label>
            <input
              type="number"
              {...register('late_fee_amount')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Grace Period (days)</label>
            <input
              type="number"
              {...register('late_fee_grace_days')}
              min={0}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          {...register('notes')}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
          {isLoading ? 'Saving...' : 'Save Lease'}
        </button>
      </div>
    </form>
  );
}
