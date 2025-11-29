'use client';

import { DollarSign, TrendingUp, BarChart3, Building2, Zap, Percent } from 'lucide-react';
import { Sparkline } from './Sparkline';
import { KPIMetric } from '@/types/dashboard';

const KPI_DATA: Record<KPIMetric, { value: string; change?: string; changeType?: 'positive' | 'negative'; sparkData?: number[] }> = {
  'pipeline-value': { value: '$38,094,800', change: '+12.4%', changeType: 'positive', sparkData: [30, 35, 32, 40, 38, 45, 50, 48, 55, 52, 58, 62] },
  'avg-cap-rate': { value: '6.86%', change: '+0.4%', changeType: 'positive', sparkData: [6.2, 6.3, 6.4, 6.3, 6.5, 6.6, 6.7, 6.8, 6.9, 6.8, 6.85, 6.86] },
  'active-pipeline': { value: '7', change: '+3 this week', changeType: 'positive' },
  'total-deals': { value: '11' },
  'deal-velocity': { value: '8.6', change: '+2 vs last week', changeType: 'positive', sparkData: [4, 5, 6, 5, 7, 6, 8, 7, 9, 8, 8.6] },
  'saved-deals': { value: '1' },
  'avg-cash-on-cash': { value: '8.2%', change: '+0.8%', changeType: 'positive', sparkData: [7.1, 7.3, 7.5, 7.8, 7.9, 8.0, 8.1, 8.2] },
  'total-properties': { value: '0' },
  'monthly-revenue': { value: '$0' },
};

const KPI_LABELS: Record<KPIMetric, string> = {
  'pipeline-value': 'Pipeline Value',
  'avg-cap-rate': 'Avg Cap Rate',
  'active-pipeline': 'Active Pipeline',
  'total-deals': 'Total Deals',
  'deal-velocity': 'Deal Velocity',
  'saved-deals': 'Saved Deals',
  'avg-cash-on-cash': 'Avg Cash-on-Cash',
  'total-properties': 'Total Properties',
  'monthly-revenue': 'Monthly Revenue',
};

const KPI_ICONS: Record<KPIMetric, React.ReactNode> = {
  'pipeline-value': <DollarSign className="w-5 h-5" />,
  'avg-cap-rate': <TrendingUp className="w-5 h-5" />,
  'active-pipeline': <BarChart3 className="w-5 h-5" />,
  'total-deals': <Building2 className="w-5 h-5" />,
  'deal-velocity': <Zap className="w-5 h-5" />,
  'saved-deals': <Building2 className="w-5 h-5" />,
  'avg-cash-on-cash': <Percent className="w-5 h-5" />,
  'total-properties': <Building2 className="w-5 h-5" />,
  'monthly-revenue': <DollarSign className="w-5 h-5" />,
};

interface Props {
  config: { metric?: KPIMetric; showSparkline?: boolean; showChange?: boolean };
  isEditMode?: boolean;
}

export function KPICardWidget({ config }: Props) {
  const metric = config.metric || 'pipeline-value';
  const data = KPI_DATA[metric];

  return (
    <div className="h-full flex items-start gap-4">
      <div className="w-10 h-10 rounded-lg bg-brand-primary-soft flex items-center justify-center text-brand-primary flex-shrink-0">
        {KPI_ICONS[metric]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500 truncate">{KPI_LABELS[metric]}</p>
        <div className="flex items-center gap-3">
          <p className="text-2xl font-semibold text-gray-900">{data.value}</p>
          {config.showSparkline !== false && data.sparkData && (
            <Sparkline data={data.sparkData} className={data.changeType === 'positive' ? 'text-brand-ai' : 'text-gray-400'} />
          )}
        </div>
        {config.showChange !== false && data.change && (
          <p className={`text-xs mt-0.5 ${data.changeType === 'positive' ? 'text-brand-ai' : data.changeType === 'negative' ? 'text-error' : 'text-gray-500'}`}>
            {data.change}
          </p>
        )}
      </div>
    </div>
  );
}
