'use client';

import { WidgetConfig } from '@/types/dashboard';
import { KPICardWidget } from './KPICardWidget';
import { DealsStatusChartWidget } from './DealsStatusChartWidget';
import { RecentDealsWidget } from './RecentDealsWidget';
import { AIInsightsWidget } from './AIInsightsWidget';
import { QuickActionsWidget } from './QuickActionsWidget';
import { PortfolioMapWidget, PipelineFunnelWidget, CashFlowSummaryWidget } from './PlaceholderWidgets';

interface WidgetRendererProps {
  widget: WidgetConfig;
  isEditMode: boolean;
}

export function WidgetRenderer({ widget, isEditMode }: WidgetRendererProps) {
  const props = { config: widget.config, isEditMode };

  switch (widget.type) {
    case 'kpi-card':
      return <KPICardWidget {...props} />;
    case 'deals-status-chart':
      return <DealsStatusChartWidget {...props} />;
    case 'recent-deals':
      return <RecentDealsWidget {...props} />;
    case 'ai-insights':
      return <AIInsightsWidget {...props} />;
    case 'quick-actions':
      return <QuickActionsWidget {...props} />;
    case 'pipeline-funnel':
      return <PipelineFunnelWidget {...props} />;
    case 'portfolio-map':
      return <PortfolioMapWidget {...props} />;
    case 'cash-flow-summary':
      return <CashFlowSummaryWidget {...props} />;
    default:
      return <div className="p-4 text-gray-500 text-sm">Unknown widget</div>;
  }
}
