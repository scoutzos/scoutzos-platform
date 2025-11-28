'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { Deal, DealStatus } from '@/types/deals';
import KanbanCard from './KanbanCard';
import { createClient } from '@/lib/supabase/client';

const COLUMNS: { id: DealStatus; title: string }[] = [
    { id: 'new', title: 'New' },
    { id: 'analyzing', title: 'Analyzing' },
    { id: 'saved', title: 'Saved' },
    { id: 'offered', title: 'Offer Made' },
    { id: 'under_contract', title: 'Under Contract' },
    { id: 'closed', title: 'Closed' },
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
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
        } catch (error) {
            console.error('Failed to update deal status:', error);
            // Revert on error
            fetchDeals();
        }
    };

    if (loading) return <div className="p-8 text-center">Loading pipeline...</div>;

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex h-full overflow-x-auto pb-4 space-x-4">
                {COLUMNS.map((column) => {
                    const columnDeals = deals.filter(deal => deal.status === column.id);
                    return (
                        <div key={column.id} className="flex-shrink-0 w-80 bg-gray-50 rounded-lg flex flex-col max-h-full">
                            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                                <h3 className="font-semibold text-gray-700">{column.title}</h3>
                                <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">
                                    {columnDeals.length}
                                </span>
                            </div>
                            <Droppable droppableId={column.id}>
                                {(provided) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className="p-4 flex-1 overflow-y-auto min-h-[150px]"
                                    >
                                        {columnDeals.map((deal, index) => (
                                            <KanbanCard key={deal.id} deal={deal} index={index} />
                                        ))}
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
