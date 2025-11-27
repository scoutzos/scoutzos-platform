import Link from 'next/link';
import { Deal } from '@/types/deals';

interface DealCardProps {
    deal: Deal;
}

export default function DealCard({ deal }: DealCardProps) {
    return (
        <Link href={`/deals/${deal.id}`} className="block group">
            <div className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-gray-800 dark:border-gray-700">
                <div className="aspect-video bg-gray-200 relative overflow-hidden">
                    {deal.photos && deal.photos.length > 0 ? (
                        <img
                            src={deal.photos[0]}
                            alt={deal.address_line1}
                            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                            No Image
                        </div>
                    )}
                    <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm uppercase font-semibold">
                        {deal.status.replace('_', ' ')}
                    </div>
                </div>
                <div className="p-4">
                    <h3 className="font-semibold text-lg truncate">{deal.address_line1}</h3>
                    <p className="text-gray-500 text-sm mb-2">{deal.city}, {deal.state} {deal.zip}</p>
                    <div className="flex items-center justify-between mt-4">
                        <span className="text-xl font-bold text-green-600">
                            ${deal.list_price.toLocaleString()}
                        </span>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                            <span>{deal.beds || '-'}</span> <span className="text-xs uppercase">Beds</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span>{deal.baths || '-'}</span> <span className="text-xs uppercase">Baths</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span>{deal.sqft ? deal.sqft.toLocaleString() : '-'}</span> <span className="text-xs uppercase">Sqft</span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
