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

    // Helper function to get match score styling
    const getMatchScoreStyle = (score: number) => {
        if (score >= 90) return { bg: 'bg-success', label: 'Excellent' };
        if (score >= 75) return { bg: 'bg-brand-primary', label: 'Strong' };
        if (score >= 60) return { bg: 'bg-info', label: 'Good' };
        if (score >= 40) return { bg: 'bg-warning', label: 'Fair' };
        return { bg: 'bg-gray-400', label: 'Weak' };
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Finding investors...</div>;
    if (error) return <div className="p-8 text-center text-error">{error}</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Matched Investors ({matches.length})</h3>
                <button
                    onClick={runMatching}
                    disabled={matching}
                    className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-card ring-1 ring-inset ring-gray-200 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                    {matching ? 'Matching...' : 'Refresh Matches'}
                </button>
            </div>

            {matches.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-500">No matching buy boxes found for this deal.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {matches.map((match) => {
                        const scoreStyle = getMatchScoreStyle(match.match_score);
                        return (
                            <div key={match.buy_box_id} className="relative flex items-center space-x-4 rounded-xl border border-gray-200 bg-white px-6 py-5 shadow-card focus-within:ring-2 focus-within:ring-brand-primary focus-within:ring-offset-2 hover:border-brand-primary/30 hover:shadow-card-hover transition-all">
                                <div className="flex-shrink-0">
                                    <div className={`h-14 w-14 rounded-full flex items-center justify-center text-white font-bold text-lg ${scoreStyle.bg}`}>
                                        {match.match_score}%
                                    </div>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <a href="#" className="focus:outline-none">
                                        <span className="absolute inset-0" aria-hidden="true" />
                                        <p className="text-sm font-semibold text-gray-900">{match.buy_box_name}</p>
                                        <p className="truncate text-sm text-gray-500">Investor ID: {match.investor_id}</p>
                                        <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${scoreStyle.bg === 'bg-success' ? 'bg-success-soft text-success' : scoreStyle.bg === 'bg-brand-primary' ? 'bg-brand-primary-soft text-brand-primary' : scoreStyle.bg === 'bg-info' ? 'bg-info-soft text-info' : scoreStyle.bg === 'bg-warning' ? 'bg-warning-soft text-warning' : 'bg-gray-100 text-gray-500'}`}>
                                            {scoreStyle.label} Match
                                        </span>
                                    </a>
                                </div>
                                <div className="flex flex-col items-end space-y-1">
                                    {match.match_reasons.slice(0, 2).map((reason, idx) => (
                                        <span key={idx} className="inline-flex items-center rounded-full bg-success-soft px-2 py-1 text-xs font-medium text-success ring-1 ring-inset ring-success/20">
                                            {reason.description}
                                        </span>
                                    ))}
                                    {match.match_reasons.length > 2 && (
                                        <span className="text-xs text-gray-400">+{match.match_reasons.length - 2} more reasons</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
