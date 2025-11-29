import Link from 'next/link';
import { BuyBox } from '@/types/buy-boxes';

interface BuyBoxCardProps {
    buyBox: BuyBox;
    matchCount?: number;
}

export default function BuyBoxCard({ buyBox, matchCount = 0 }: BuyBoxCardProps) {
    return (
        <Link href={`/buy-boxes/${buyBox.id}`} className="block group">
            <article
                className="
                    border border-gray-200 rounded-xl p-6 
                    shadow-card hover:shadow-card-hover 
                    transition-all duration-200
                    bg-white 
                    hover:border-brand-primary/30
                    hover:-translate-y-0.5
                    h-full flex flex-col
                    relative
                    before:absolute before:inset-0 
                    before:bg-gradient-to-br before:from-white before:to-gray-50/50
                    before:opacity-0 hover:before:opacity-100
                    before:transition-opacity before:rounded-xl
                "
                aria-label={`Buy box: ${buyBox.name}`}
            >
                <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="flex items-center gap-3">
                        <h3 className="font-bold text-xl truncate pr-2 text-gray-900 group-hover:text-brand-primary transition-colors">
                            {buyBox.name}
                        </h3>
                        {/* Match count badge */}
                        <span
                            className={`
                                inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
                                ${matchCount > 0
                                    ? 'bg-brand-ai-soft text-brand-ai-strong border border-brand-ai/20'
                                    : 'bg-gray-100 text-gray-500 border border-gray-200'
                                }
                            `}
                            aria-label={`${matchCount} ${matchCount === 1 ? 'match' : 'matches'}`}
                        >
                            {matchCount} {matchCount === 1 ? 'match' : 'matches'}
                        </span>
                    </div>
                    <span
                        className={`
                            px-3 py-1 text-xs rounded-full font-semibold flex-shrink-0
                            ${buyBox.is_active
                                ? 'bg-success-soft text-success border border-success/20'
                                : 'bg-gray-100 text-gray-500 border border-gray-200'
                            }
                        `}
                        aria-label={`Status: ${buyBox.is_active ? 'Active' : 'Inactive'}`}
                    >
                        {buyBox.is_active ? 'Active' : 'Inactive'}
                    </span>
                </div>

                <div className="space-y-2 text-sm text-gray-500 flex-grow relative z-10">
                    <div className="flex justify-between">
                        <span>Markets:</span>
                        <span className="font-medium text-right text-gray-900">{buyBox.markets.join(', ') || 'Any'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Price:</span>
                        <span className="font-medium text-right text-gray-900">
                            {buyBox.min_price ? `$${buyBox.min_price.toLocaleString()}` : '$0'} - {buyBox.max_price ? `$${buyBox.max_price.toLocaleString()}` : 'Any'}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span>Strategy:</span>
                        <span className="font-medium capitalize text-right text-gray-900">{buyBox.strategy?.replace('_', ' ') || 'Any'}</span>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center relative z-10">
                    <span className="text-xs text-gray-400">
                        Last matched: {buyBox.last_matched_at ? new Date(buyBox.last_matched_at).toLocaleDateString() : 'Never'}
                    </span>
                    {matchCount > 0 && (
                        <span className="text-xs text-brand-primary font-semibold flex items-center gap-1">
                            View matches
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </span>
                    )}
                </div>
            </article>
        </Link>
    );
}
