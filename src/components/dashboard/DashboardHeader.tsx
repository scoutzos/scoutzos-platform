'use client';

import { useState } from 'react';
import { useDashboard } from '@/lib/dashboard/dashboard-context';
import { RefreshCw, Edit3, Save, RotateCcw } from 'lucide-react';

export function DashboardHeader() {
  const { state, toggleEditMode, saveLayout, resetToDefault } = useDashboard();
  const [lastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const timeAgo = () => {
    const seconds = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min ago`;
  };

  return (
    <div className="flex items-end justify-between mb-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Dashboard</h1>
        <p className="text-gray-300 text-sm">Your real estate investment command center</p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleRefresh}
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Updated {timeAgo()}</span>
        </button>

        {state.isEditMode ? (
          <div className="flex items-center gap-2">
            <button
              onClick={resetToDefault}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-300 hover:text-white transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <button
              onClick={() => {
                saveLayout();
                toggleEditMode();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-ai text-white text-sm font-medium rounded-lg hover:bg-brand-ai-strong transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Layout
            </button>
          </div>
        ) : (
          <button
            onClick={toggleEditMode}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 text-white text-sm font-medium rounded-lg hover:bg-white/20 transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            Customize
          </button>
        )}
      </div>
    </div>
  );
}
