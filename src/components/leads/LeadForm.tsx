'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const leadSchema = z.object({
  lead_type: z.enum(['tenant', 'owner', 'buyer', 'seller', 'vendor']),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  source: z.string().optional(),
  source_url: z.string().url().optional().or(z.literal('')),
  property_id: z.string().uuid().optional().or(z.literal('')),
  pipeline_stage: z.string().default('new'),
  move_in_date: z.string().optional(),
  budget_min: z.coerce.number().min(0).optional(),
  budget_max: z.coerce.number().min(0).optional(),
  beds_wanted: z.coerce.number().int().min(0).optional(),
  baths_wanted: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
});

type LeadFormData = z.infer<typeof leadSchema>;

interface LeadFormProps {
  defaultValues?: Partial<LeadFormData>;
  properties?: { id: string; address: string }[];
  onSubmit: (data: LeadFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const SOURCES = [
  'Zillow',
  'Apartments.com',
  'Facebook',
  'Instagram',
  'Google',
  'Referral',
  'Walk-in',
  'Phone',
  'Website',
  'Other',
];

const PIPELINE_STAGES = {
  tenant: ['new', 'contacted', 'showing_scheduled', 'application', 'screening', 'approved', 'lease_sent', 'signed', 'lost'],
  owner: ['new', 'contacted', 'meeting_scheduled', 'proposal_sent', 'negotiating', 'signed', 'lost'],
  buyer: ['new', 'contacted', 'showing_scheduled', 'offer_made', 'under_contract', 'closed', 'lost'],
  seller: ['new', 'contacted', 'listing_appointment', 'listed', 'under_contract', 'closed', 'lost'],
  vendor: ['new', 'contacted', 'application', 'approved', 'lost'],
};

export function LeadForm({ defaultValues, properties = [], onSubmit, onCancel, isLoading }: LeadFormProps) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      lead_type: 'tenant',
      pipeline_stage: 'new',
      ...defaultValues,
    },
  });

  const leadType = watch('lead_type');
  const stages = PIPELINE_STAGES[leadType] || PIPELINE_STAGES.tenant;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Lead Type & Source */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Lead Type *</label>
          <select
            {...register('lead_type')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="tenant">Tenant</option>
            <option value="owner">Owner</option>
            <option value="buyer">Buyer</option>
            <option value="seller">Seller</option>
            <option value="vendor">Vendor</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
          <select
            {...register('source')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select source</option>
            {SOURCES.map(s => (
              <option key={s} value={s.toLowerCase()}>{s}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pipeline Stage</label>
          <select
            {...register('pipeline_stage')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {stages.map(stage => (
              <option key={stage} value={stage}>
                {stage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Contact Info */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
            <input
              {...register('first_name')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.first_name && <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
            <input
              {...register('last_name')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              {...register('email')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              {...register('phone')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Property Interest (for tenant/buyer leads) */}
      {(leadType === 'tenant' || leadType === 'buyer') && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Property Interest</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {properties.length > 0 && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Interested Property</label>
                <select
                  {...register('property_id')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a property</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.address}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Move-in Date</label>
              <input
                type="date"
                {...register('move_in_date')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget Min</label>
                <input
                  type="number"
                  {...register('budget_min')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget Max</label>
                <input
                  type="number"
                  {...register('budget_max')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Beds Wanted</label>
              <input
                type="number"
                {...register('beds_wanted')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Baths Wanted</label>
              <input
                type="number"
                step="0.5"
                {...register('baths_wanted')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          {...register('notes')}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Additional notes about this lead..."
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
          {isLoading ? 'Saving...' : 'Save Lead'}
        </button>
      </div>
    </form>
  );
}
