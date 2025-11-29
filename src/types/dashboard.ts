export type WidgetType =
  | 'kpi-card'
  | 'deals-status-chart'
  | 'recent-deals'
  | 'ai-insights'
  | 'quick-actions'
  | 'pipeline-funnel'
  | 'portfolio-map'
  | 'cash-flow-summary';

export type KPIMetric =
  | 'pipeline-value'
  | 'avg-cap-rate'
  | 'active-pipeline'
  | 'total-deals'
  | 'deal-velocity'
  | 'saved-deals'
  | 'avg-cash-on-cash'
  | 'total-properties'
  | 'monthly-revenue';

export interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  static?: boolean;
}

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title?: string;
  config: Record<string, unknown>;
}

export interface DashboardTab {
  id: string;
  name: string;
  slug: string;
  isDefault: boolean;
  layout: LayoutItem[];
  widgets: WidgetConfig[];
}

export interface WidgetDefinition {
  type: WidgetType;
  name: string;
  description: string;
  icon: string;
  defaultSize: { w: number; h: number };
  minSize: { w: number; h: number };
  maxSize?: { w: number; h: number };
  configurable: boolean;
  configFields?: ConfigField[];
}

export interface ConfigField {
  key: string;
  label: string;
  type: 'select' | 'number' | 'boolean' | 'text';
  options?: { value: string; label: string }[];
  default: unknown;
}

export type InsightType = 'opportunity' | 'warning' | 'info';

export interface AIInsight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  action?: string;
  actionHref?: string;
}

export interface DealStatus {
  status: string;
  count: number;
  color: string;
}
