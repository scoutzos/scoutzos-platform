export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
}: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}) {
    return (
        <div className="text-center py-16 px-4">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Icon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">{description}</p>
            {action && (
                <button
                    onClick={action.onClick}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-primary text-white rounded-lg font-semibold hover:bg-brand-primary-hover transition-colors"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
}
