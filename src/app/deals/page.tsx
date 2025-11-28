'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Deal } from '@/types/deals';
import { formatCurrency } from '@/lib/services/underwriting';

// Dynamically import Map to avoid SSR issues with Leaflet
const DealMap = dynamic(() => import('@/components/deals/DealMap'), { ssr: false });

export default function DealsPage() {
    const [deals, setDeals] = useState<Deal[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

    useEffect(() => {
        async function fetchDeals() {
            try {
                const res = await fetch('/api/deals');
                const data = await res.json();
                setDeals(data.deals || []);
            } catch (error) {
                console.error('Failed to fetch deals:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchDeals();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Deals</h1>
                <div className="flex space-x-4">
                    <div className="bg-gray-100 p-1 rounded-lg flex">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md ${viewMode === 'list' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            List
                        </button>
                        <button
                            onClick={() => setViewMode('map')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md ${viewMode === 'map' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            Map
                        </button>
                    </div>
                    <Link
                        href="/deals/import"
                        className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    >
                        Import Deal
                    </Link>
                </div>
            </div>

            {deals.length === 0 && viewMode === 'list' ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-500 text-lg">No deals found. Start by adding one!</p>
                </div>
            ) : viewMode === 'map' ? (
                <DealMap deals={deals} />
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {deals.map((deal) => (
                        <Link key={deal.id} href={`/deals/${deal.id}`} className="block group">
                            <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
                                <div className="h-48 bg-gray-200 relative">
                                    {deal.photos && deal.photos.length > 0 ? (
                                        <img src={deal.photos[0]} alt={deal.address_line1} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-gray-400">
                                            No Image
                                        </div>
                                    )}
                                    <div className="absolute top-2 right-2">
                                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${deal.status === 'new' ? 'bg-blue-100 text-blue-800' :
                                                deal.status === 'analyzing' ? 'bg-yellow-100 text-yellow-800' :
                                                    deal.status === 'saved' ? 'bg-green-100 text-green-800' :
                                                        'bg-gray-100 text-gray-800'
                                            }`}>
                                            {deal.status.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                                <div className="px-4 py-4">
                                    <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 truncate">
                                        {deal.address_line1}
                                    </h3>
                                    <p className="text-sm text-gray-500 truncate">
                                        {deal.city}, {deal.state} {deal.zip}
                                    </p>
                                    <div className="mt-4 flex justify-between items-center">
                                        <span className="text-xl font-bold text-gray-900">
                                            {formatCurrency(deal.list_price)}
                                        </span>
                                        <div className="text-sm text-gray-500">
                                            {deal.beds}bd {deal.baths}ba {deal.sqft?.toLocaleString()}sqft
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
