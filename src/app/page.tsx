import { supabaseAdmin } from '@/lib/supabase/admin';
import { Deal, DealStatus } from '@/types/deals';
import Link from 'next/link';
import StatusPieChart from '@/components/dashboard/StatusPieChart';

interface DealMetrics {
    deal_id: string;
    cap_rate: number | null;
    cash_on_cash: number | null;
    monthly_cash_flow: number | null;
}

interface DashboardStats {
    totalDeals: number;
    dealsByStatus: Record<DealStatus, number>;
    avgCapRate: number | null;
    totalPipelineValue: number;
    recentDeals: Deal[];
}

async function getDashboardStats(): Promise<DashboardStats> {
    // Fetch all deals
    const { data: deals, error: dealsError } = await supabaseAdmin
        .from('deals')
        .select('*')
        .order('created_at', { ascending: false });

    if (dealsError) {
        console.error('Error fetching deals:', dealsError);
        return {
            totalDeals: 0,
            dealsByStatus: {} as Record<DealStatus, number>,
            avgCapRate: null,
            totalPipelineValue: 0,
            recentDeals: [],
        };
    }

    const allDeals = (deals || []) as Deal[];

    // Fetch deal metrics for cap rate calculation
    const { data: metrics } = await supabaseAdmin
        .from('deal_metrics')
        .select('deal_id, cap_rate, cash_on_cash, monthly_cash_flow');

    const metricsData = (metrics || []) as DealMetrics[];

    // Calculate stats
    const totalDeals = allDeals.length;

    // Count deals by status
    const dealsByStatus: Record<DealStatus, number> = {
        new: 0,
        analyzing: 0,
        saved: 0,
        offered: 0,
        under_contract: 0,
        closed: 0,
        passed: 0,
        dead: 0,
    };

    allDeals.forEach(deal => {
        if (deal.status in dealsByStatus) {
            dealsByStatus[deal.status]++;
        }
    });

    // Calculate average cap rate
    const capRates = metricsData
        .filter(m => m.cap_rate !== null && m.cap_rate > 0)
        .map(m => m.cap_rate as number);
    const avgCapRate = capRates.length > 0
        ? capRates.reduce((sum, rate) => sum + rate, 0) / capRates.length
        : null;

    // Calculate total pipeline value
    const totalPipelineValue = allDeals.reduce((sum, deal) => sum + (deal.list_price || 0), 0);

    // Get recent deals (last 5)
    const recentDeals = allDeals.slice(0, 5);

    return {
        totalDeals,
        dealsByStatus,
        avgCapRate,
        totalPipelineValue,
        recentDeals,
    };
}

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

function getStatusColor(status: DealStatus): string {
    const colors: Record<DealStatus, string> = {
        new: 'bg-blue-100 text-blue-800',
        analyzing: 'bg-yellow-100 text-yellow-800',
        saved: 'bg-purple-100 text-purple-800',
        offered: 'bg-orange-100 text-orange-800',
        under_contract: 'bg-indigo-100 text-indigo-800',
        closed: 'bg-green-100 text-green-800',
        passed: 'bg-gray-100 text-gray-800',
        dead: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
}

export default async function Home() {
    const stats = await getDashboardStats();

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Section */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Welcome to ScoutzOS</h1>
                    <p className="mt-2 text-gray-600">Your real estate investment command center</p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Total Deals */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 p-3 bg-blue-100 rounded-lg">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Total Deals</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.totalDeals}</p>
                            </div>
                        </div>
                    </div>

                    {/* Active Pipeline */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 p-3 bg-green-100 rounded-lg">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Active Pipeline</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {stats.dealsByStatus.new + stats.dealsByStatus.analyzing + stats.dealsByStatus.saved + stats.dealsByStatus.offered + stats.dealsByStatus.under_contract}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Average Cap Rate */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 p-3 bg-purple-100 rounded-lg">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Avg Cap Rate</p>
                                <p className="text-2xl font-bold text-gray-900">{formatPercent(stats.avgCapRate)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Total Pipeline Value */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 p-3 bg-yellow-100 rounded-lg">
                                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Pipeline Value</p>
                                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalPipelineValue)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Deals by Status Chart and Quick Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Deals by Status Pie Chart */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Deals by Status</h2>
                        <StatusPieChart
                            dealsByStatus={stats.dealsByStatus}
                            totalDeals={stats.totalDeals}
                        />
                    </div>

                    {/* Quick Actions */}
                    <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Link
                                href="/deals/new"
                                className="flex flex-col items-center justify-center px-4 py-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                                <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add Deal
                            </Link>
                            <Link
                                href="/pipeline"
                                className="flex flex-col items-center justify-center px-4 py-6 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                            >
                                <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                                </svg>
                                View Pipeline
                            </Link>
                            <Link
                                href="/deals"
                                className="flex flex-col items-center justify-center px-4 py-6 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                            >
                                <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                Browse Deals
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">Recent Deals</h2>
                            <Link href="/deals" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                                View all
                            </Link>
                        </div>
                    </div>
                    <div className="divide-y divide-gray-200">
                        {stats.recentDeals.length === 0 ? (
                            <div className="px-6 py-8 text-center text-gray-500">
                                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                <p>No deals yet. Add your first deal to get started!</p>
                                <Link href="/deals/new" className="mt-4 inline-block text-blue-600 hover:text-blue-800 font-medium">
                                    Add Deal
                                </Link>
                            </div>
                        ) : (
                            stats.recentDeals.map((deal) => (
                                <Link
                                    key={deal.id}
                                    href={`/deals/${deal.id}`}
                                    className="block px-6 py-4 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center justify-between">
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
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {formatCurrency(deal.list_price)}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {deal.beds} bd / {deal.baths} ba
                                                </p>
                                            </div>
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(deal.status)}`}>
                                                {deal.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
