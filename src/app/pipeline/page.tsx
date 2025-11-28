import KanbanBoard from '@/components/pipeline/KanbanBoard';

export default function PipelinePage() {
    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200">
                <h1 className="text-2xl font-bold text-gray-900">Deal Pipeline</h1>
            </div>
            <div className="flex-1 overflow-hidden p-6">
                <KanbanBoard />
            </div>
        </div>
    );
}
