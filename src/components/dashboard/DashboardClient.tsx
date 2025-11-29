'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    DollarSign,
    TrendingUp,
    BarChart3,
    Building2,
    Plus,
    LayoutList,
    Search,
    RefreshCw,
    Sparkles,
    AlertCircle,
    Lightbulb,
    ChevronRight
} from 'lucide-react';
import { Deal, DealStatus } from '@/types/deals';

// ===========================================
// TYPES
// ===========================================

interface KPIData {
    label: string;
    value: string;
    change?: string;
    changeType?: 'positive' | 'negative' | 'neutral';
    icon: React.ReactNode;
    sparkData?: number[];
}

interface DealStatusData {
    status: string;
    count: number;
    color: string;
}

interface AIInsight {
    id: string;
    type: 'opportunity' | 'warning' | 'info';
    title: string;
    description: string;
    action?: string;
    actionHref?: string;
}

interface DashboardClientProps {
    totalDeals: number;
    dealsByStatus: Record<DealStatus, number>;
    avgCapRate: number | null;
    totalPipelineValue: number;
    activePipeline: number;
    recentDeals: Deal[];
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

function formatPercent(value: number | null): string {
    if (value === null) return 'N/A';
    return `${value.toFixed(2)}%`;
}

// ===========================================
// COMPONENTS
// ===========================================

// Sparkline Component
function Sparkline({ data, className = '' }: { data: number[]; className?: string }) {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const points = data.map((value, index) => {
        const x = (index / (data.length - 1)) * 100;
        const y = 100 - ((value - min) / range) * 100;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className={`w-16 h-8 ${className}`}
        >
            <polyline
                points={points}
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    );
}

// KPI Card Component
function KPICard({ kpi }: { kpi: KPIData }) {
    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-brand-primary-soft flex items-center justify-center text-brand-primary flex-shrink-0">
                {kpi.icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-500 truncate">{kpi.label}</p>
                <div className="flex items-center gap-3">
                    <p className="text-2xl font-semibold text-gray-900">{kpi.value}</p>
                    {kpi.sparkData && (
                        <Sparkline
                            data={kpi.sparkData}
                            className={kpi.changeType === 'positive' ? 'text-brand-ai' : 'text-gray-400'}
                        />
                    )}
                </div>
                {kpi.change && (
                    <p className={`text-xs mt-1 ${kpi.changeType === 'positive' ? 'text-brand-ai' :
                        kpi.changeType === 'negative' ? 'text-error' :
                            'text-gray-500'
                        }`}>
                        {kpi.change}
                    </p>
                )}
            </div>
        </div>
    );
}

// Deal Status Chart Component
function DealStatusChart({ data }: { data: DealStatusData[] }) {
    const total = data.reduce((sum, item) => sum + item.count, 0);
    const activeData = data.filter(d => d.count > 0);

    // Calculate stroke-dasharray for donut segments
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    let currentOffset = 0;

    const segments = activeData.map(item => {
        const percentage = total > 0 ? item.count / total : 0;
        const dashLength = percentage * circumference;
        const segment = {
            ...item,
            dashArray: `${dashLength} ${circumference - dashLength}`,
            dashOffset: -currentOffset,
        };
        currentOffset += dashLength;
        return segment;
    });

    // Map bg-* to stroke-* colors
    const getStrokeClass = (bgColor: string) => {
        const colorMap: Record<string, string> = {
            'bg-brand-primary': 'stroke-brand-primary',
            'bg-warning': 'stroke-warning',
            'bg-brand-ai': 'stroke-brand-ai',
            'bg-chart-cat-4': 'stroke-[#8B5CF6]',
            'bg-chart-cat-5': 'stroke-[#EC4899]',
            'bg-gray-400': 'stroke-gray-400',
            'bg-success': 'stroke-success',
            'bg-error': 'stroke-error',
        };
        return colorMap[bgColor] || 'stroke-gray-400';
    };

    return (
        <div className="flex items-center gap-8">
            {/* Donut Chart */}
            <div className="relative w-32 h-32 flex-shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    {/* Background circle */}
                    <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="none"
                        stroke="#E5E7EB"
                        strokeWidth="9"
                    />
                    {/* Segments */}
                    {segments.map((segment) => (
                        <circle
                            key={segment.status}
                            cx="50"
                            cy="50"
                            r={radius}
                            fill="none"
                            className={getStrokeClass(segment.color)}
                            strokeWidth="9"
                            strokeDasharray={segment.dashArray}
                            strokeDashoffset={segment.dashOffset}
                            strokeLinecap="round"
                        />
                    ))}
                </svg>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900">{total}</span>
                    <span className="text-xs text-gray-500">total</span>
                </div>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                {data.map(item => (
                    <div key={item.status} className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                        <span className="text-sm text-gray-600">
                            {item.status} ({item.count})
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// AI Insight Card Component
function AIInsightCard({ insight }: { insight: AIInsight }) {
    const iconMap = {
        opportunity: <Lightbulb className="w-4 h-4" />,
        warning: <AlertCircle className="w-4 h-4" />,
        info: <Sparkles className="w-4 h-4" />,
    };

    const bgMap = {
        opportunity: 'bg-brand-ai-soft',
        warning: 'bg-warning-soft',
        info: 'bg-brand-primary-soft',
    };

    const textMap = {
        opportunity: 'text-brand-ai',
        warning: 'text-warning',
        info: 'text-brand-primary',
    };

    return (
        <div className={`p-3 rounded-lg border-l-4 ${insight.type === 'opportunity' ? 'border-brand-ai' : insight.type === 'warning' ? 'border-warning' : 'border-brand-primary'} ${bgMap[insight.type]}`}>
            <div className="flex items-start gap-3">
                <div className={`mt-0.5 ${textMap[insight.type]}`}>
                    {iconMap[insight.type]}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{insight.title}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{insight.description}</p>
                    {insight.action && insight.actionHref && (
                        <Link
                            href={insight.actionHref}
                            className="inline-flex items-center gap-1 text-xs font-medium text-brand-primary hover:text-brand-primary-deep mt-2"
                        >
                            {insight.action}
                            <ChevronRight className="w-3 h-3" />
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}

// Last Updated Indicator Component
function LastUpdated({ timestamp }: { timestamp: Date }) {
    const [isRefreshing, setIsRefreshing] = useState(false);

    const timeAgo = () => {
        const seconds = Math.floor((new Date().getTime() - timestamp.getTime()) / 1000);
        if (seconds < 60) return 'just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes} min ago`;
        const hours = Math.floor(minutes / 60);
        return `${hours} hr ago`;
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        // Refresh the page to get new data
        window.location.reload();
    };

    return (
        <button
            onClick={handleRefresh}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300 transition-colors"
        >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Updated {timeAgo()}</span>
        </button>
    );
}

// ===========================================
// MAIN DASHBOARD COMPONENT
// ===========================================

export default function DashboardClient({
    totalDeals,
    dealsByStatus,
    avgCapRate,
    totalPipelineValue,
    activePipeline,
    recentDeals,
}: DashboardClientProps) {
    const [lastUpdated] = useState(new Date());

    // Build KPIs from real data
    const kpis: KPIData[] = [
        {
            label: 'Pipeline Value',
            value: formatCurrency(totalPipelineValue),
            change: '+12.4%',
            changeType: 'positive',
            icon: <DollarSign className="w-5 h-5" />,
            sparkData: [30, 35, 32, 40, 38, 45, 50, 48, 55, 52, 58, 62],
        },
        {
            label: 'Avg Cap Rate',
            value: formatPercent(avgCapRate),
            change: avgCapRate ? '+0.4%' : undefined,
            changeType: 'positive',
            icon: <TrendingUp className="w-5 h-5" />,
            sparkData: avgCapRate ? [6.2, 6.3, 6.4, 6.3, 6.5, 6.6, 6.7, 6.8, 6.9, 6.8, 6.85, avgCapRate] : undefined,
        },
        {
            label: 'Active Pipeline',
            value: String(activePipeline),
            change: '+3 this week',
            changeType: 'positive',
            icon: <BarChart3 className="w-5 h-5" />,
        },
        {
            label: 'Total Deals',
            value: String(totalDeals),
            icon: <Building2 className="w-5 h-5" />,
        },
    ];

    // Build deal status data
    const dealStatusData: DealStatusData[] = [
        { status: 'New', count: dealsByStatus.new || 0, color: 'bg-brand-primary' },
        { status: 'Analyzing', count: dealsByStatus.analyzing || 0, color: 'bg-warning' },
        { status: 'Saved', count: dealsByStatus.saved || 0, color: 'bg-brand-ai' },
        { status: 'Offered', count: dealsByStatus.offered || 0, color: 'bg-chart-cat-4' },
        { status: 'Under Contract', count: dealsByStatus.under_contract || 0, color: 'bg-chart-cat-5' },
        { status: 'Passed', count: dealsByStatus.passed || 0, color: 'bg-gray-400' },
    ];

    // AI Insights (mock for now - can be connected to real data later)
    const insights: AIInsight[] = [
        {
            id: '1',
            type: 'opportunity',
            title: `${dealsByStatus.new || 0} new deals ready for analysis`,
            description: 'Review new listings and run underwriting analysis.',
            action: 'View Deals',
            actionHref: '/deals?status=new',
        },
        {
            id: '2',
            type: 'warning',
            title: `${dealsByStatus.analyzing || 0} deals in analyzing state`,
            description: 'Complete analysis to move deals through the pipeline.',
            action: 'Continue Analysis',
            actionHref: '/deals?status=analyzing',
        },
        {
            id: '3',
            type: 'info',
            title: 'Pipeline insights available',
            description: 'View your deals organized by status in the pipeline view.',
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Dark header bleed effect */}
            <div className="bg-brand-primary-deep h-24 -mb-16" />

            {/* Main content */}
            <div className="max-w-7xl mx-auto px-6 pb-12">
                {/* Page Header */}
                <div className="flex items-end justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-1">Dashboard</h1>
                        <p className="text-gray-300 text-sm">
                            Your real estate investment command center
                        </p>
                    </div>
                    <LastUpdated timestamp={lastUpdated} />
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {kpis.map((kpi, index) => (
                        <KPICard key={index} kpi={kpi} />
                    ))}
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Left Column - Deals by Status */}
                    <div className="xl:col-span-2 bg-white border border-gray-200 rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-6">Deals by Status</h2>
                        <DealStatusChart data={dealStatusData} />
                    </div>

                    {/* Right Column - sticky on desktop */}
                    <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
                        {/* Quick Actions */}
                        <div className="bg-white border border-gray-200 rounded-xl p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                            <div className="space-y-3">
                                <Link
                                    href="/deals/import"
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

                        {/* AI Insights */}
                        <div className="bg-white border border-gray-200 rounded-xl p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-6 h-6 rounded-full bg-brand-ai-soft flex items-center justify-center">
                                    <Sparkles className="w-3.5 h-3.5 text-brand-ai" />
                                </div>
                                <h2 className="text-lg font-semibold text-gray-900">AI Insights</h2>
                                <span className="ml-auto text-xs bg-brand-ai-soft text-brand-ai-strong px-2 py-0.5 rounded-full font-medium">
                                    {insights.length} new
                                </span>
                            </div>
                            <div className="space-y-3">
                                {insights.map(insight => (
                                    <AIInsightCard key={insight.id} insight={insight} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Deals Section */}
                {recentDeals.length > 0 && (
                    <div className="mt-6 bg-white border border-gray-200 rounded-xl">
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">Recent Deals</h2>
                            <Link href="/deals" className="text-sm text-brand-primary hover:text-brand-primary-hover font-medium">
                                View all
                            </Link>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {recentDeals.map((deal) => (
                                <Link
                                    key={deal.id}
                                    href={`/deals/${deal.id}`}
                                    className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {deal.address_line1}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {deal.city}, {deal.state} {deal.zip}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-brand-primary">
                                                {formatCurrency(deal.list_price)}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {deal.beds} bd / {deal.baths} ba
                                            </p>
                                        </div>
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${deal.status === 'new' ? 'bg-info-soft text-info' :
                                            deal.status === 'analyzing' ? 'bg-warning-soft text-warning' :
                                                deal.status === 'saved' ? 'bg-brand-ai-soft text-brand-ai' :
                                                    deal.status === 'passed' ? 'bg-gray-100 text-gray-500' :
                                                        'bg-gray-100 text-gray-500'
                                            }`}>
                                            {deal.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Keyboard Shortcuts Hint */}
                <div className="mt-8 text-center">
                    <p className="text-xs text-gray-400">
                        Press <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-gray-600 font-mono">N</kbd> to add deal
                        <span className="mx-2">·</span>
                        <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-gray-600 font-mono">P</kbd> for pipeline
                        <span className="mx-2">·</span>
                        <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-gray-600 font-mono">/</kbd> to search
                    </p>
                </div>
            </div>
        </div>
    );
}
