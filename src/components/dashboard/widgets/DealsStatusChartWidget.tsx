'use client';

import { DealStatus } from '@/types/dashboard';

const MOCK_DATA: DealStatus[] = [
  { status: 'Saved', count: 7, color: '#10B981' },
  { status: 'Passed', count: 4, color: '#6B7280' },
  { status: 'New', count: 0, color: '#0284C7' },
  { status: 'Analyzing', count: 0, color: '#F59E0B' },
  { status: 'Offered', count: 0, color: '#0A2342' },
  { status: 'Under Contract', count: 0, color: '#22C55E' },
];

export function DealsStatusChartWidget({ config, isEditMode }: { config: Record<string, unknown>; isEditMode?: boolean }) {
  const data = MOCK_DATA.filter(d => d.count > 0);
  const total = data.reduce((sum, d) => sum + d.count, 0) || 1;

  const radius = 36;
  const strokeWidth = 9;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-base font-semibold text-gray-900 mb-4">Deals by Status</h3>
      <div className="flex items-center gap-6 flex-1">
        <div className="relative w-28 h-28 flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r={radius} fill="none" stroke="#E5E7EB" strokeWidth={strokeWidth} />
            {data.map((item) => {
              const pct = item.count / total;
              const dash = pct * circumference;
              const segment = (
                <circle
                  key={item.status}
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke={item.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="round"
                />
              );
              offset += dash;
              return segment;
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-gray-900">{total}</span>
            <span className="text-xs text-gray-500">total</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          {MOCK_DATA.map((item) => (
            <div key={item.status} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-sm text-gray-600">{item.status} ({item.count})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
