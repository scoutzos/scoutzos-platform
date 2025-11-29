import Link from 'next/link';
import { Deal } from '@/types/deals';
import Image from 'next/image';

interface DealCardProps {
    deal: Deal;
}

export default function DealCard({ deal }: DealCardProps) {
    return (
        <Link href={`/deals/${deal.id}`} className="block group">
            <article
                className="
                    border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden 
                    shadow-card hover:shadow-card-hover 
                    transition-all duration-200
                    bg-white dark:bg-gray-800
                    hover:border-brand-primary/30
                    hover:-translate-y-0.5
                    relative
                "
                aria-label={`Deal at ${deal.address_line1}, ${deal.city}`}
            >
                <div className="aspect-video bg-gray-100 relative overflow-hidden">
                    {deal.photos && deal.photos.length > 0 ? (
                        <Image
                            src={deal.photos[0]}
                            alt={`Property at ${deal.address_line1}, ${deal.city}, ${deal.state}`}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                        </div>
                    )}
                    <div className="absolute top-2 right-2">
                        <span
                            className="
                                inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold
                                bg-brand-primary-deep/80 text-white backdrop-blur-sm
                                uppercase tracking-wide
                            "
                            aria-label={`Status: ${deal.status.replace('_', ' ')}`}
                        >
                            {deal.status.replace('_', ' ')}
                        </span>
                    </div>
                </div>
                <div className="p-4">
                    <h3 className="font-semibold text-lg truncate text-gray-900 group-hover:text-brand-primary transition-colors">
                        {deal.address_line1}
                    </h3>
                    <p className="text-gray-500 text-sm mb-2">{deal.city}, {deal.state} {deal.zip}</p>
                    <div className="flex items-center justify-between mt-4">
                        <span className="text-xl font-bold text-brand-primary">
                            ${deal.list_price.toLocaleString()}
                        </span>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                            <span className="font-medium">{deal.beds || '-'}</span>
                            <span className="text-xs uppercase text-gray-400">Beds</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="font-medium">{deal.baths || '-'}</span>
                            <span className="text-xs uppercase text-gray-400">Baths</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="font-medium">{deal.sqft ? deal.sqft.toLocaleString() : '-'}</span>
                            <span className="text-xs uppercase text-gray-400">Sqft</span>
                        </div>
                    </div>
                </div>
            </article>
        </Link>
    );
}
