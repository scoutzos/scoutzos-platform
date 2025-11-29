'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Deal } from '@/types/deals';
import SwipeCard from '@/components/deals/SwipeCard';

interface DealMetrics {
    deal_id: string;
    cap_rate: number | null;
    monthly_cash_flow: number | null;
}

export default function SwipePage() {
    const [deals, setDeals] = useState<Deal[]>([]);
    const [metricsMap, setMetricsMap] = useState<Record<string, DealMetrics>>({});
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetchDeals();
    }, []);

    const fetchDeals = async () => {
        try {
            setLoading(true);
            // Fetch deals with status 'new' or 'analyzing'
            const res = await fetch('/api/deals?status=new,analyzing&limit=100');
            const data = await res.json();
            const fetchedDeals = data.deals || [];
            setDeals(fetchedDeals);

            // Fetch metrics for all deals
            if (fetchedDeals.length > 0) {
                const dealIds = fetchedDeals.map((d: Deal) => d.id);
                const metricsRes = await fetch('/api/deals/metrics?' + new URLSearchParams({
                    deal_ids: dealIds.join(',')
                }));
                if (metricsRes.ok) {
                    const metricsData = await metricsRes.json();
                    const map: Record<string, DealMetrics> = {};
                    (metricsData.metrics || []).forEach((m: DealMetrics) => {
                        map[m.deal_id] = m;
                    });
                    setMetricsMap(map);
                }
            }
        } catch (error) {
            console.error('Failed to fetch deals:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSwipe = async (direction: 'left' | 'right') => {
        if (updating || currentIndex >= deals.length) return;

        const currentDeal = deals[currentIndex];
        const action = direction === 'right' ? 'save' : 'pass';

        setUpdating(true);

        try {
            const res = await fetch(`/api/deals/${currentDeal.id}/swipe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action }),
            });

            if (!res.ok) {
                console.error('Failed to update deal status');
            }
        } catch (error) {
            console.error('Error updating deal:', error);
        } finally {
            setUpdating(false);
            setCurrentIndex(prev => prev + 1);
        }
    };

    const currentDeal = deals[currentIndex];
    const remainingCount = deals.length - currentIndex;
    const totalCount = deals.length;

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary mx-auto"></div>
                    <p className="mt-4 text-gray-500">Loading deals...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
                <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
                    <Link
                        href="/deals"
                        className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back
                    </Link>
                    <h1 className="text-lg font-semibold text-gray-900">Swipe Deals</h1>
                    <div className="w-16"></div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-md mx-auto px-4 py-6">
                {remainingCount === 0 ? (
                    // No more deals
                    <div className="text-center py-16">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">All caught up!</h2>
                        <p className="text-gray-500 mb-6">No more deals to review right now.</p>
                        <div className="space-y-3">
                            <Link
                                href="/deals"
                                className="block w-full px-4 py-3 bg-brand-primary text-white rounded-xl font-semibold hover:bg-brand-primary-hover transition-colors"
                            >
                                View All Deals
                            </Link>
                            <Link
                                href="/deals/import"
                                className="block w-full px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                            >
                                Import New Deal
                            </Link>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Swipe Card */}
                        <SwipeCard
                            key={currentDeal.id}
                            deal={currentDeal}
                            onSwipe={handleSwipe}
                            metrics={metricsMap[currentDeal.id]}
                        />

                        {/* Action Buttons */}
                        <div className="flex justify-center gap-6 mt-6">
                            <button
                                onClick={() => handleSwipe('left')}
                                disabled={updating}
                                className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center text-error hover:bg-error hover:text-white transition-all disabled:opacity-50 border-2 border-error"
                            >
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                            <button
                                onClick={() => handleSwipe('right')}
                                disabled={updating}
                                className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center text-success hover:bg-success hover:text-white transition-all disabled:opacity-50 border-2 border-success"
                            >
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                            </button>
                        </div>

                        {/* Progress indicator */}
                        <div className="mt-6 text-center">
                            <p className="text-sm text-gray-500">
                                {currentIndex + 1} of {totalCount} deals
                            </p>
                            <div className="mt-2 h-1 bg-gray-200 rounded-full max-w-xs mx-auto overflow-hidden">
                                <div
                                    className="h-full bg-brand-primary transition-all duration-300"
                                    style={{ width: `${((currentIndex + 1) / totalCount) * 100}%` }}
                                />
                            </div>
                        </div>

                        {/* Swipe hint */}
                        <p className="text-center text-xs text-gray-400 mt-4">
                            Swipe right to save, left to pass
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
