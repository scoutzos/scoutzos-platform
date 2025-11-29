export function DealCardSkeleton() {
    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
            <div className="h-48 bg-gray-200" />
            <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="flex justify-between items-center mt-4">
                    <div className="h-6 bg-gray-200 rounded w-24" />
                    <div className="h-4 bg-gray-200 rounded w-20" />
                </div>
            </div>
        </div>
    );
}

export function BuyBoxCardSkeleton() {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
            <div className="flex justify-between items-start mb-4">
                <div className="h-6 bg-gray-200 rounded w-32" />
                <div className="h-6 bg-gray-200 rounded-full w-16" />
            </div>
            <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-5/6" />
                <div className="h-4 bg-gray-200 rounded w-4/6" />
            </div>
        </div>
    );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200 animate-pulse">
                    <div className="h-10 w-10 bg-gray-200 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                    <div className="h-8 w-20 bg-gray-200 rounded" />
                </div>
            ))}
        </div>
    );
}

export function PageSkeleton() {
    return (
        <div className="container mx-auto px-4 py-8 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-6" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                    <DealCardSkeleton key={i} />
                ))}
            </div>
        </div>
    );
}
