'use client';

import { Deal } from '@/types/deals';
import { Draggable } from '@hello-pangea/dnd';
import { formatCurrency } from '@/lib/services/underwriting';
import Image from 'next/image';
import Link from 'next/link';
import { TrendingUp, DollarSign, Home } from 'lucide-react';

interface KanbanCardProps {
    deal: Deal;
    index: number;
}

export default function KanbanCard({ deal, index }: KanbanCardProps) {
    // Calculate cap rate if we have the data
    const capRate = deal.estimated_rent && deal.list_price
        ? ((deal.estimated_rent * 12) / deal.list_price * 100).toFixed(2)
        : null;

    return (
        <Draggable draggableId={deal.id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`
                        bg-white rounded-xl shadow-card border-2 mb-3
                        transition-all duration-200
                        ${snapshot.isDragging
                            ? 'border-brand-primary shadow-elevation-3 rotate-2 scale-105'
                            : 'border-gray-200 hover:border-brand-primary/30 hover:shadow-card-hover'
                        }
                        cursor-grab active:cursor-grabbing
                        group
                    `}
                >
                    <Link href={`/deals/${deal.id}`} className="block">
                        {/* Property Image */}
                        {deal.photos && deal.photos.length > 0 ? (
                            <div className="relative h-32 w-full overflow-hidden rounded-t-xl bg-gray-100">
                                <Image
                                    src={deal.photos[0]}
                                    alt={`Property at ${deal.address_line1}`}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                    sizes="(max-width: 400px) 100vw, 400px"
                                />
                            </div>
                        ) : (
                            <div className="h-32 w-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-xl flex items-center justify-center">
                                <Home className="w-10 h-10 text-gray-400" />
                            </div>
                        )}

                        {/* Card Content */}
                        <div className="p-4">
                            {/* Address */}
                            <h4 className="font-semibold text-gray-900 truncate mb-1 group-hover:text-brand-primary transition-colors">
                                {deal.address_line1}
                            </h4>
                            <p className="text-xs text-gray-500 truncate mb-3">
                                {deal.city}, {deal.state} {deal.zip}
                            </p>

                            {/* Price */}
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-lg font-bold text-brand-primary">
                                    {formatCurrency(deal.list_price)}
                                </span>
                                <div className="text-xs text-gray-500">
                                    {deal.beds}bd · {deal.baths}ba
                                </div>
                            </div>

                            {/* Metrics */}
                            <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                                {capRate && (
                                    <div className="flex items-center gap-1 px-2 py-1 bg-brand-ai-soft rounded-md flex-1">
                                        <TrendingUp className="w-3 h-3 text-brand-ai-strong" />
                                        <span className="text-xs font-semibold text-brand-ai-strong">
                                            {capRate}% Cap
                                        </span>
                                    </div>
                                )}
                                {deal.estimated_rent && (
                                    <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md flex-1">
                                        <DollarSign className="w-3 h-3 text-gray-600" />
                                        <span className="text-xs font-medium text-gray-600">
                                            {formatCurrency(deal.estimated_rent)}/mo
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Link>
                </div>
            )}
        </Draggable>
    );
}
