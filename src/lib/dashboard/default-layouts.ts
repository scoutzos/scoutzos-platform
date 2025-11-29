import { DashboardTab } from '@/types/dashboard';

export const DEFAULT_LAYOUT: DashboardTab = {
  id: 'default',
  name: 'Deal Flow',
  slug: 'deal-flow',
  isDefault: true,
  layout: [
    { i: 'kpi-1', x: 0, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
    { i: 'kpi-2', x: 3, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
    { i: 'kpi-3', x: 6, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
    { i: 'kpi-4', x: 9, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
    { i: 'chart', x: 0, y: 2, w: 5, h: 4, minW: 4, minH: 3 },
    { i: 'recent', x: 5, y: 2, w: 7, h: 4, minW: 4, minH: 3 },
    { i: 'quick', x: 0, y: 6, w: 4, h: 3, minW: 3, minH: 2 },
    { i: 'ai', x: 4, y: 6, w: 4, h: 4, minW: 3, minH: 3 },
  ],
  widgets: [
    { id: 'kpi-1', type: 'kpi-card', config: { metric: 'pipeline-value', showSparkline: true, showChange: true } },
    { id: 'kpi-2', type: 'kpi-card', config: { metric: 'avg-cap-rate', showSparkline: true, showChange: true } },
    { id: 'kpi-3', type: 'kpi-card', config: { metric: 'active-pipeline', showSparkline: false, showChange: true } },
    { id: 'kpi-4', type: 'kpi-card', config: { metric: 'deal-velocity', showSparkline: false, showChange: true } },
    { id: 'chart', type: 'deals-status-chart', config: {} },
    { id: 'recent', type: 'recent-deals', config: { limit: '5' } },
    { id: 'quick', type: 'quick-actions', config: {} },
    { id: 'ai', type: 'ai-insights', config: {} },
  ],
};

export const PORTFOLIO_LAYOUT: DashboardTab = {
  id: 'portfolio',
  name: 'Portfolio',
  slug: 'portfolio',
  isDefault: false,
  layout: [
    { i: 'kpi-1', x: 0, y: 0, w: 3, h: 2 },
    { i: 'kpi-2', x: 3, y: 0, w: 3, h: 2 },
    { i: 'kpi-3', x: 6, y: 0, w: 3, h: 2 },
    { i: 'kpi-4', x: 9, y: 0, w: 3, h: 2 },
    { i: 'map', x: 0, y: 2, w: 8, h: 4 },
    { i: 'cashflow', x: 8, y: 2, w: 4, h: 3 },
  ],
  widgets: [
    { id: 'kpi-1', type: 'kpi-card', config: { metric: 'total-deals', showSparkline: false } },
    { id: 'kpi-2', type: 'kpi-card', config: { metric: 'pipeline-value', showSparkline: true } },
    { id: 'kpi-3', type: 'kpi-card', config: { metric: 'avg-cap-rate', showSparkline: true } },
    { id: 'kpi-4', type: 'kpi-card', config: { metric: 'avg-cash-on-cash', showSparkline: true } },
    { id: 'map', type: 'portfolio-map', config: {} },
    { id: 'cashflow', type: 'cash-flow-summary', config: {} },
  ],
};

export const DEFAULT_TABS: DashboardTab[] = [DEFAULT_LAYOUT, PORTFOLIO_LAYOUT];
