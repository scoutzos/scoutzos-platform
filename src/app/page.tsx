'use client';

import { DashboardProvider } from '@/lib/dashboard/dashboard-context';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardTabs } from '@/components/dashboard/DashboardTabs';
import { DashboardCanvas } from '@/components/dashboard/DashboardCanvas';
import { AddWidgetPanel } from '@/components/dashboard/AddWidgetPanel';

export default function DashboardPage() {
  return (
    <DashboardProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Dark header bleed */}
        <div className="bg-brand-primary-deep">
          <div className="max-w-7xl mx-auto px-6 pt-6 pb-20">
            <DashboardHeader />
          </div>
        </div>

        {/* Main content - pulls up into header */}
        <div className="max-w-7xl mx-auto px-6 -mt-14">
          <DashboardTabs />
          <AddWidgetPanel />
          <DashboardCanvas />

          {/* Keyboard shortcuts hint */}
          <div className="mt-8 pb-8 text-center">
            <p className="text-xs text-gray-400">
              Press{' '}
              <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-gray-600 font-mono">
                E
              </kbd>{' '}
              to edit layout
              <span className="mx-2">·</span>
              <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-gray-600 font-mono">
                N
              </kbd>{' '}
              to add deal
              <span className="mx-2">·</span>
              <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-gray-600 font-mono">
                /
              </kbd>{' '}
              to search
            </p>
          </div>
        </div>
      </div>
    </DashboardProvider>
  );
}
