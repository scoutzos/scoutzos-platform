'use client';

import Link from 'next/link';
import { Plus, LayoutList, Search } from 'lucide-react';

export function QuickActionsWidget({ config, isEditMode }: { config: Record<string, unknown>; isEditMode?: boolean }) {
  return (
    <div className="h-full flex flex-col">
      <h3 className="text-base font-semibold text-gray-900 mb-3">Quick Actions</h3>
      <div className="space-y-2.5 flex-1">
        <Link
          href="/deals/new"
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-brand-primary hover:bg-brand-primary-deep text-white font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Deal
        </Link>
        <Link
          href="/pipeline"
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-white border border-gray-200 text-gray-900 font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          <LayoutList className="w-4 h-4" />
          View Pipeline
        </Link>
        <Link
          href="/deals"
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-white border border-gray-200 text-gray-900 font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Search className="w-4 h-4" />
          Browse Deals
        </Link>
      </div>
    </div>
  );
}
