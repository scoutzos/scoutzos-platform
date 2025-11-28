'use client';

import { useState, useEffect } from 'react';
import { MatchResult } from '@/lib/services/matching';
import { Deal } from '@/types/deals';

interface MatchesTabProps {
    dealId: string;
    dealData?: Deal;
}

export default function MatchesTab({ dealId, dealData }: MatchesTabProps) {
    const [matches, setMatches] = useState<MatchResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [matching, setMatching] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchMatches();
    }, [dealId]);

    const fetchMatches = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/deals/${dealId}/match`);
            if (response.ok) {
                const data = await response.json();
                if (data.matches && data.matches.length > 0) {
                    setMatches(data.matches);
                } else {
                    // Trigger matching if no matches found
                    runMatching();
                }
            } else {
                runMatching();
            }
        } catch (err) {
            console.error(err);
            setError('Failed to load matches');
        } finally {
            setLoading(false);
        }
    };

    const runMatching = async () => {
        try {
            setMatching(true);
            const response = await fetch(`/api/deals/${dealId}/match`, {
                method: 'POST',
            });

            if (!response.ok) throw new Error('Matching failed');

            const data = await response.json();
            setMatches(data.matches);
        } catch (err) {
            console.error(err);
            setError('Failed to run matching');
        } finally {
            setMatching(false);
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Finding investors...</div>;
    if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Matched Investors ({matches.length})</h3>
                <button
                    onClick={runMatching}
                    disabled={matching}
                    className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                >
                    {matching ? 'Matching...' : 'Refresh Matches'}
                </button>
            </div>

            {matches.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <p className="text-gray-500">No matching buy boxes found for this deal.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {matches.map((match) => (
                        <div key={match.buy_box_id} className="relative flex items-center space-x-3 rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:border-gray-400">
                            <div className="flex-shrink-0">
                                <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-bold ${match.is_strong_match ? 'bg-green-500' : match.is_match ? 'bg-blue-500' : 'bg-gray-400'}`}>
                                    {match.match_score}%
                                </div>
                            </div>
                            <div className="min-w-0 flex-1">
                                <a href="#" className="focus:outline-none">
                                    <span className="absolute inset-0" aria-hidden="true" />
                                    <p className="text-sm font-medium text-gray-900">{match.buy_box_name}</p>
                                    <p className="truncate text-sm text-gray-500">Investor ID: {match.investor_id}</p>
                                </a>
                            </div>
                            <div className="flex flex-col items-end space-y-1">
                                {match.match_reasons.slice(0, 2).map((reason, idx) => (
                                    <span key={idx} className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                        {reason.description}
                                    </span>
                                ))}
                                {match.match_reasons.length > 2 && (
                                    <span className="text-xs text-gray-500">+{match.match_reasons.length - 2} more reasons</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
