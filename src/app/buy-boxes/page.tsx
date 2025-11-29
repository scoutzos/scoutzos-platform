'use client';

import { useEffect, useState } from 'react';
import { BuyBox } from '@/types/buy-boxes';
import BuyBoxCard from '@/components/buy-boxes/BuyBoxCard';
import Link from 'next/link';

interface MatchCount {
    buy_box_id: string;
    count: number;
}

export default function BuyBoxesPage() {
    const [buyBoxes, setBuyBoxes] = useState<BuyBox[]>([]);
    const [matchCounts, setMatchCounts] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch buy boxes and match counts in parallel
                const [buyBoxesRes, matchCountsRes] = await Promise.all([
                    fetch('/api/buy-boxes'),
                    fetch('/api/buy-boxes/match-counts'),
                ]);

                const buyBoxesData = await buyBoxesRes.json();
                if (Array.isArray(buyBoxesData)) {
                    setBuyBoxes(buyBoxesData);
                }

                const matchCountsData = await matchCountsRes.json();
                if (Array.isArray(matchCountsData)) {
                    const counts: Record<string, number> = {};
                    matchCountsData.forEach((item: MatchCount) => {
                        counts[item.buy_box_id] = item.count;
                    });
                    setMatchCounts(counts);
                }
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
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
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Buy Boxes</h1>
                    <p className="text-gray-500 mt-1">Define your investment criteria to automatically match deals.</p>
                </div>
                <Link
                    href="/buy-boxes/new"
                    className="bg-brand-primary hover:bg-brand-primary-hover text-white px-4 py-2 rounded-lg transition-colors"
                >
                    Create Buy Box
                </Link>
            </div>

            {buyBoxes.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
                    <h3 className="text-lg font-medium text-gray-900">No buy boxes yet</h3>
                    <p className="text-gray-500 mt-1 mb-6">Create your first buy box to start finding deals.</p>
                    <Link
                        href="/buy-boxes/new"
                        className="text-brand-primary hover:text-brand-primary-hover font-medium"
                    >
                        Create Buy Box &rarr;
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {buyBoxes.map((buyBox) => (
                        <BuyBoxCard
                            key={buyBox.id}
                            buyBox={buyBox}
                            matchCount={matchCounts[buyBox.id] || 0}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
