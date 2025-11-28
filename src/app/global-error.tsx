'use client';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html>
            <body>
                <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-16">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Something went wrong!</h2>
                        <p className="mt-2 text-base text-gray-500">A critical error occurred.</p>
                        <div className="mt-6">
                            <button
                                onClick={() => reset()}
                                className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
                            >
                                Try again
                            </button>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    );
}
