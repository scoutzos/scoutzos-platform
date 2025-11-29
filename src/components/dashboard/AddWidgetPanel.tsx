'use client';

import { useDashboard } from '@/lib/dashboard/dashboard-context';
import { getAllWidgets } from '@/lib/dashboard/widget-registry';
import { WidgetType } from '@/types/dashboard';
import {
  BarChart3, PieChart, List, Sparkles, Zap, Filter, Map, DollarSign, Plus
} from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  BarChart3: <BarChart3 className="w-5 h-5" />,
  PieChart: <PieChart className="w-5 h-5" />,
  List: <List className="w-5 h-5" />,
  Sparkles: <Sparkles className="w-5 h-5" />,
  Zap: <Zap className="w-5 h-5" />,
  Filter: <Filter className="w-5 h-5" />,
  Map: <Map className="w-5 h-5" />,
  DollarSign: <DollarSign className="w-5 h-5" />,
};

export function AddWidgetPanel() {
  const { state, addWidget } = useDashboard();
  const widgets = getAllWidgets();

  if (!state.isEditMode) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <Plus className="w-4 h-4" />
        Add Widget
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {widgets.map((widget) => (
          <button
            key={widget.type}
            onClick={() => addWidget(widget.type as WidgetType)}
            className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-gray-200 hover:border-brand-primary hover:bg-brand-primary-soft transition-colors text-gray-600 hover:text-brand-primary"
          >
            {iconMap[widget.icon] || <BarChart3 className="w-5 h-5" />}
            <span className="text-xs font-medium text-center leading-tight">{widget.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
