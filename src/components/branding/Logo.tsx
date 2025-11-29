export function LogoMark({ className = "w-10 h-10" }: { className?: string }) {
    return (
        <svg viewBox="0 0 40 40" className={className} aria-label="ScoutzOS Logo">
            <defs>
                <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0284C7" />
                    <stop offset="100%" stopColor="#10B981" />
                </linearGradient>
            </defs>
            <rect x="0" y="0" width="40" height="40" rx="8" fill="url(#logoGradient)" />
            <path
                d="M10 20 L20 10 L30 20 L20 30 Z"
                fill="white"
                opacity="0.9"
            />
            <circle cx="20" cy="20" r="3" fill="white" />
        </svg>
    );
}

export function Logo({ className = "", showText = true }: { className?: string; showText?: boolean }) {
    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <LogoMark />
            {showText && (
                <span className="font-bold text-xl">
                    Scoutz<span className="text-brand-ai">OS</span>
                </span>
            )}
        </div>
    );
}
