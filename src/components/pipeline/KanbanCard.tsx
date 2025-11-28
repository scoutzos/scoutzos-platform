'use client';

import { Deal } from '@/types/deals';
import { Draggable } from '@hello-pangea/dnd';
import { formatCurrency } from '@/lib/services/underwriting';

interface KanbanCardProps {
    deal: Deal;
    index: number;
}

export default function KanbanCard({ deal, index }: KanbanCardProps) {
    return (
        <Draggable draggableId={deal.id} index={index}>
            {(provided) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className="bg-white p-4 rounded shadow-sm border border-gray-200 mb-3 hover:shadow-md transition-shadow"
                >
                    <h4 className="font-medium text-gray-900 truncate">{deal.address_line1}</h4>
                    <p className="text-sm text-gray-500 truncate">{deal.city}, {deal.state}</p>
                    <div className="mt-2 flex justify-between items-center">
                        <span className="text-sm font-semibold text-blue-600">
                            {formatCurrency(deal.list_price)}
                        </span>
                        {deal.estimated_rent && (
                            <span className="text-xs text-gray-500">
                                Rent: {formatCurrency(deal.estimated_rent)}
                            </span>
                        )}
                    </div>
                </div>
            )}
        </Draggable>
    );
}
