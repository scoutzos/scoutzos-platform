'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { Deal, DealStatus } from '@/types/deals';
import KanbanCard from './KanbanCard';
import { createClient } from '@/lib/supabase/client';
import { Inbox } from 'lucide-react';

const COLUMNS: { id: DealStatus; title: string; color: string }[] = [
    { id: 'new', title: 'New', color: 'bg-blue-500' },
    { id: 'analyzing', title: 'Analyzing', color: 'bg-yellow-500' },
    { id: 'saved', title: 'Saved', color: 'bg-green-500' },
    { id: 'offered', title: 'Offer Made', color: 'bg-purple-500' },
    { id: 'under_contract', title: 'Under Contract', color: 'bg-orange-500' },
    { id: 'closed', title: 'Closed', color: 'bg-brand-ai' },
];

export default function KanbanBoard() {
    const [deals, setDeals] = useState<Deal[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        fetchDeals();
    }, []);

    const fetchDeals = async () => {
        try {
            const res = await fetch('/api/deals?limit=100');
            const data = await res.json();
            setDeals(data.deals || []);
        } catch (error) {
            console.error('Failed to fetch deals:', error);
        } finally {
            setLoading(false);
        }
    };

    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        const newStatus = destination.droppableId as DealStatus;

        // Optimistic update
        const updatedDeals = deals.map(deal =>
            deal.id === draggableId ? { ...deal, status: newStatus } : deal
        );
        setDeals(updatedDeals);

        // API update
        try {
            await fetch(`/api/deals/${draggableId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
        } catch (error) {
            console.error('Failed to update deal status:', error);
            // Revert on error
            fetchDeals();
        }
    };

    if (loading) {
        return (
            <div className="flex h-full overflow-x-auto pb-4 space-x-4">
                {COLUMNS.map((column) => (
                    <div key={column.id} className="flex-shrink-0 w-80 bg-white rounded-xl border border-gray-200 shadow-card">
                        <div className="p-4 border-b border-gray-200">
                            <div className="h-6 bg-gray-200 rounded w-24 animate-pulse" />
                        </div>
                        <div className="p-4 space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-48 bg-gray-100 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex h-full overflow-x-auto pb-4 space-x-4">
                {COLUMNS.map((column) => {
                    const columnDeals = deals.filter(deal => deal.status === column.id);
                    return (
                        <div key={column.id} className="flex-shrink-0 w-80 bg-white rounded-xl flex flex-col max-h-full border border-gray-200 shadow-card">
                            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-xl">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${column.color}`} />
                                    <h3 className="font-semibold text-gray-900">{column.title}</h3>
                                </div>
                                <span className="bg-brand-primary-soft text-brand-primary text-xs font-semibold px-2.5 py-1 rounded-full">
                                    {columnDeals.length}
                                </span>
                            </div>
                            <Droppable droppableId={column.id}>
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={`
                                            p-4 flex-1 overflow-y-auto min-h-[200px]
                                            ${snapshot.isDraggingOver ? 'bg-brand-primary-soft/30' : ''}
                                            transition-colors duration-200
                                        `}
                                    >
                                        {columnDeals.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                                <Inbox className="w-12 h-12 mb-2" />
                                                <p className="text-sm">No deals</p>
                                            </div>
                                        ) : (
                                            columnDeals.map((deal, index) => (
                                                <KanbanCard key={deal.id} deal={deal} index={index} />
                                            ))
                                        )}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    );
                })}
            </div>
        </DragDropContext>
    );
}
