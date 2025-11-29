'use client';

import { Map, Filter, DollarSign } from 'lucide-react';

export function PortfolioMapWidget({ config, isEditMode }: { config: Record<string, unknown>; isEditMode?: boolean }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-gray-400">
      <Map className="w-12 h-12 mb-2" />
      <p className="text-sm">Portfolio Map</p>
      <p className="text-xs">Coming soon</p>
    </div>
  );
}

export function PipelineFunnelWidget({ config, isEditMode }: { config: Record<string, unknown>; isEditMode?: boolean }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-gray-400">
      <Filter className="w-12 h-12 mb-2" />
      <p className="text-sm">Pipeline Funnel</p>
      <p className="text-xs">Coming soon</p>
    </div>
  );
}

export function CashFlowSummaryWidget({ config, isEditMode }: { config: Record<string, unknown>; isEditMode?: boolean }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-gray-400">
      <DollarSign className="w-12 h-12 mb-2" />
      <p className="text-sm">Cash Flow Summary</p>
      <p className="text-xs">Coming soon</p>
    </div>
  );
}
