import Link from 'next/link';
import { BuyBox } from '@/types/buy-boxes';

interface BuyBoxCardProps {
    buyBox: BuyBox;
    matchCount?: number;
}

export default function BuyBoxCard({ buyBox, matchCount = 0 }: BuyBoxCardProps) {
    return (
        <Link href={`/buy-boxes/${buyBox.id}`} className="block group">
            <div className="border border-gray-200 rounded-xl p-6 shadow-card hover:shadow-card-hover transition-all bg-white card-interactive h-full flex flex-col">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <h3 className="font-bold text-xl truncate pr-2 text-gray-900">{buyBox.name}</h3>
                        {/* Match count badge */}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            matchCount > 0
                                ? 'bg-brand-primary-soft text-brand-primary'
                                : 'bg-gray-100 text-gray-500'
                        }`}>
                            {matchCount} {matchCount === 1 ? 'match' : 'matches'}
                        </span>
                    </div>
                    <span className={`px-3 py-1 text-xs rounded-full font-medium flex-shrink-0 ${buyBox.is_active ? 'bg-success-soft text-success' : 'bg-gray-100 text-gray-500'}`}>
                        {buyBox.is_active ? 'Active' : 'Inactive'}
                    </span>
                </div>

                <div className="space-y-2 text-sm text-gray-500 flex-grow">
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

                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                    <span className="text-xs text-gray-400">
                        Last matched: {buyBox.last_matched_at ? new Date(buyBox.last_matched_at).toLocaleDateString() : 'Never'}
                    </span>
                    {matchCount > 0 && (
                        <span className="text-xs text-brand-primary font-medium">
                            View matches →
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}
