import Link from 'next/link';
import { BuyBox } from '@/types/buy-boxes';

interface BuyBoxCardProps {
    buyBox: BuyBox;
}

export default function BuyBoxCard({ buyBox }: BuyBoxCardProps) {
    return (
        <Link href={`/buy-boxes/${buyBox.id}`} className="block group">
            <div className="border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-gray-800 dark:border-gray-700 h-full flex flex-col">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-xl truncate pr-2">{buyBox.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${buyBox.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {buyBox.is_active ? 'Active' : 'Inactive'}
                    </span>
                </div>

                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300 flex-grow">
                    <div className="flex justify-between">
                        <span>Markets:</span>
                        <span className="font-medium text-right">{buyBox.markets.join(', ') || 'Any'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Price:</span>
                        <span className="font-medium text-right">
                            {buyBox.min_price ? `$${buyBox.min_price.toLocaleString()}` : '$0'} - {buyBox.max_price ? `$${buyBox.max_price.toLocaleString()}` : 'Any'}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span>Strategy:</span>
                        <span className="font-medium capitalize text-right">{buyBox.strategy?.replace('_', ' ') || 'Any'}</span>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t text-xs text-gray-500">
                    Last matched: {buyBox.last_matched_at ? new Date(buyBox.last_matched_at).toLocaleDateString() : 'Never'}
                </div>
            </div>
        </Link>
    );
}
