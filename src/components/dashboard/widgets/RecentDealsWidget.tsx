'use client';

import Link from 'next/link';

interface Deal {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  price: number;
  beds: number;
  baths: number;
  status: string;
}

const MOCK_DEALS: Deal[] = [
  { id: '1', address: '3161 Santa Margarita Road', city: 'West Palm Beach', state: 'FL', zip: '33411', price: 590000, beds: 4, baths: 3, status: 'saved' },
  { id: '2', address: '7114 Kinsmore Ln', city: 'Charlotte', state: 'NC', zip: '28269', price: 324900, beds: 4, baths: 3, status: 'passed' },
  { id: '3', address: '3687 Briarcliff Rd', city: 'Atlanta', state: 'GA', zip: '30345', price: 35000000, beds: 6, baths: 11, status: 'passed' },
  { id: '4', address: '5709 ST ISABEL Drive', city: 'Jacksonville', state: 'FL', zip: '32277', price: 280000, beds: 3, baths: 2, status: 'passed' },
  { id: '5', address: '3301 Pine Grove Cir SE', city: 'Atlanta', state: 'GA', zip: '30316', price: 285000, beds: 5, baths: 3, status: 'passed' },
];

const statusColors: Record<string, string> = {
  saved: 'bg-brand-ai-soft text-brand-ai-strong',
  passed: 'bg-gray-100 text-gray-600',
  new: 'bg-brand-primary-soft text-brand-primary',
  analyzing: 'bg-warning-soft text-warning',
};

export function RecentDealsWidget({ config, isEditMode }: { config: { limit?: string }; isEditMode?: boolean }) {
  const limit = parseInt(config.limit || '5', 10);
  const deals = MOCK_DEALS.slice(0, limit);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-gray-900">Recent Deals</h3>
        <Link href="/deals" className="text-sm text-brand-primary hover:text-brand-primary-deep font-medium">
          View all
        </Link>
      </div>
      <div className="flex-1 overflow-auto">
        <div className="divide-y divide-gray-100">
          {deals.map((deal) => (
            <Link
              key={deal.id}
              href={`/deals/${deal.id}`}
              className="flex items-center justify-between py-3 hover:bg-gray-50 -mx-1 px-1 rounded transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{deal.address}</p>
                <p className="text-xs text-gray-500">{deal.city}, {deal.state} {deal.zip}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                <div className="text-right">
                  <p className="text-sm font-semibold text-brand-primary">${deal.price.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{deal.beds} bd / {deal.baths} ba</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[deal.status] || statusColors.passed}`}>
                  {deal.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
