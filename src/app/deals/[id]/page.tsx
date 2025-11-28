'use client';

import { useEffect, useState, use } from 'react';
import { Deal } from '@/types/deals';
import { formatCurrency } from '@/lib/services/underwriting';
import AnalysisTab from '@/components/deals/AnalysisTab';
import MatchesTab from '@/components/deals/MatchesTab';
import Link from 'next/link';

export default function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [deal, setDeal] = useState<Deal | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'analysis' | 'matches'>('overview');

    useEffect(() => {
        async function fetchDeal() {
            try {
                const res = await fetch(`/api/deals/${id}`);
                if (!res.ok) throw new Error('Failed to fetch deal');
                const data = await res.json();
                setDeal(data.deal);
            } catch (error) {
                console.error('Failed to fetch deal:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchDeal();
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!deal) {
        return (
            <div className="container mx-auto px-4 py-8 text-center">
                <h1 className="text-2xl font-bold text-gray-900">Deal not found</h1>
                <Link href="/deals" className="text-blue-600 hover:underline mt-4 inline-block">
                    &larr; Back to Deals
                </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <Link href="/deals" className="text-sm text-gray-500 hover:text-gray-700">
                    &larr; Back to Deals
                </Link>
                <div className="mt-4 flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            {deal.address_line1}
                        </h1>
                        <p className="text-xl text-gray-600">
                            {deal.city}, {deal.state} {deal.zip}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-3xl font-bold text-blue-600">
                            {formatCurrency(deal.list_price)}
                        </p>
                        <div className="mt-1">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${deal.status === 'new' ? 'bg-blue-100 text-blue-800' :
                                    deal.status === 'analyzing' ? 'bg-yellow-100 text-yellow-800' :
                                        deal.status === 'saved' ? 'bg-green-100 text-green-800' :
                                            'bg-gray-100 text-gray-800'
                                }`}>
                                {deal.status.toUpperCase()}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-8">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`${activeTab === 'overview'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                            } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('analysis')}
                        className={`${activeTab === 'analysis'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                            } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
                    >
                        Analysis
                    </button>
                    <button
                        onClick={() => setActiveTab('matches')}
                        className={`${activeTab === 'matches'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                            } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
                    >
                        Matches
                    </button>
                </nav>
            </div>

            {/* Tab Content */}
            <div>
                {activeTab === 'overview' && (
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                        <div className="px-4 py-5 sm:px-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">Property Details</h3>
                        </div>
                        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                            <dl className="sm:divide-y sm:divide-gray-200">
                                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">Property Type</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{deal.property_type || 'N/A'}</dd>
                                </div>
                                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">Bedrooms</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{deal.beds || 'N/A'}</dd>
                                </div>
                                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">Bathrooms</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{deal.baths || 'N/A'}</dd>
                                </div>
                                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">Square Footage</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{deal.sqft ? `${deal.sqft.toLocaleString()} sqft` : 'N/A'}</dd>
                                </div>
                                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">Year Built</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{deal.year_built || 'N/A'}</dd>
                                </div>
                                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">Estimated Rent</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{deal.estimated_rent ? formatCurrency(deal.estimated_rent) : 'N/A'}</dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                )}

                {activeTab === 'analysis' && <AnalysisTab dealId={id} dealData={deal} />}

                {activeTab === 'matches' && <MatchesTab dealId={id} dealData={deal} />}
            </div>
        </div>
    );
}