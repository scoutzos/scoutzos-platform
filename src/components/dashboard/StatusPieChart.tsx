'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { DealStatus } from '@/types/deals';

interface StatusPieChartProps {
    dealsByStatus: Record<DealStatus, number>;
    totalDeals: number;
}

const STATUS_COLORS: Record<DealStatus, string> = {
    new: '#0284C7',        // brand-primary (blue)
    analyzing: '#F59E0B',  // warning (amber)
    saved: '#10B981',      // brand-ai (green)
    offered: '#1E3A5F',    // brand-primary-deep lightened
    under_contract: '#22C55E', // success (green)
    closed: '#065F46',     // dark green
    passed: '#6B7280',     // gray-500
    dead: '#EF4444',       // error (red)
};

const STATUS_LABELS: Record<DealStatus, string> = {
    new: 'New',
    analyzing: 'Analyzing',
    saved: 'Saved',
    offered: 'Offered',
    under_contract: 'Under Contract',
    closed: 'Closed',
    passed: 'Passed',
    dead: 'Dead',
};

export default function StatusPieChart({ dealsByStatus, totalDeals }: StatusPieChartProps) {
    const chartData = Object.entries(dealsByStatus)
        .filter(([_, count]) => count > 0)
        .map(([status, count]) => ({
            name: STATUS_LABELS[status as DealStatus],
            value: count,
            color: STATUS_COLORS[status as DealStatus],
            status: status as DealStatus,
        }));

    if (chartData.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <svg className="w-12 h-12 mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
                <p className="text-sm">No deals to display</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col">
            <div className="relative h-52">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="value"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value: number, name: string) => [`${value} deals`, name]}
                            contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: '0.5rem',
                                boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{totalDeals}</p>
                        <p className="text-xs text-gray-500">total</p>
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="mt-4 grid grid-cols-2 gap-2">
                {chartData.map((entry) => (
                    <div key={entry.status} className="flex items-center gap-2">
                        <span
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-xs text-gray-600 truncate">
                            {entry.name} ({entry.value})
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
