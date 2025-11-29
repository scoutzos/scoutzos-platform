import KanbanBoard from '@/components/pipeline/KanbanBoard';
import { LayoutGrid } from 'lucide-react';

export default function PipelinePage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="border-b border-gray-200 bg-white">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-brand-primary-soft rounded-lg flex items-center justify-center">
                            <LayoutGrid className="w-5 h-5 text-brand-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Deal Pipeline</h1>
                            <p className="text-sm text-gray-500">Drag and drop deals to update their status</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <KanbanBoard />
            </div>
        </div>
    );
}
