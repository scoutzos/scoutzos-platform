'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-16">
            <div className="text-center">
                <h2 className="text-2xl font-bold tracking-tight text-gray-900">Something went wrong!</h2>
                <p className="mt-2 text-base text-gray-500">{error.message || 'An unexpected error occurred.'}</p>
                <div className="mt-6">
                    <button
                        onClick={
                            // Attempt to recover by trying to re-render the segment
                            () => reset()
                        }
                        className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    >
                        Try again
                    </button>
                </div>
            </div>
        </div>
    );
}
