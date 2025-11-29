'use client';

import Link from 'next/link';
import { Sparkles, AlertCircle, Lightbulb, ChevronRight } from 'lucide-react';
import { AIInsight } from '@/types/dashboard';

const MOCK_INSIGHTS: AIInsight[] = [
  { id: '1', type: 'opportunity', title: '2 deals match your buy box', description: 'New listings in Jacksonville match your SFR criteria.', action: 'View Matches', actionHref: '/deals?filter=matches' },
  { id: '2', type: 'warning', title: '3 deals need rent estimates', description: 'Rent data is stale. Refresh for accurate underwriting.', action: 'Update Now', actionHref: '/deals?filter=stale' },
  { id: '3', type: 'info', title: 'Cap rates up in Orange Park', description: 'Average cap rate increased 0.4% this month.' },
];

const iconMap = {
  opportunity: <Lightbulb className="w-4 h-4" />,
  warning: <AlertCircle className="w-4 h-4" />,
  info: <Sparkles className="w-4 h-4" />,
};

const colorMap = {
  opportunity: { bg: 'bg-brand-ai-soft', text: 'text-brand-ai', border: 'border-l-brand-ai' },
  warning: { bg: 'bg-warning-soft', text: 'text-warning', border: 'border-l-warning' },
  info: { bg: 'bg-brand-primary-soft', text: 'text-brand-primary', border: 'border-l-brand-primary' },
};

export function AIInsightsWidget({ config, isEditMode }: { config: Record<string, unknown>; isEditMode?: boolean }) {
  return (
    <div className="h-full flex flex-col ai-insights-sticky">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-full bg-brand-ai-soft flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-brand-ai" />
        </div>
        <h3 className="text-base font-semibold text-gray-900">AI Insights</h3>
        <span className="ml-auto text-xs bg-brand-ai-soft text-brand-ai-strong px-2 py-0.5 rounded-full font-medium">
          {MOCK_INSIGHTS.length} new
        </span>
      </div>
      <div className="space-y-2.5 flex-1">
        {MOCK_INSIGHTS.map((insight) => {
          const colors = colorMap[insight.type];
          return (
            <div key={insight.id} className={`p-3 rounded-lg ${colors.bg} border-l-[3px] ${colors.border}`}>
              <div className="flex items-start gap-2.5">
                <div className={`mt-0.5 ${colors.text}`}>{iconMap[insight.type]}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 leading-tight">{insight.title}</p>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">{insight.description}</p>
                  {insight.action && insight.actionHref && (
                    <Link href={insight.actionHref} className="inline-flex items-center gap-1 text-xs font-medium text-brand-primary hover:text-brand-primary-deep mt-1.5">
                      {insight.action}
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
