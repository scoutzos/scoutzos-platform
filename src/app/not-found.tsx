import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-16">
            <div className="text-center">
                <h2 className="text-2xl font-bold tracking-tight text-gray-900">Page Not Found</h2>
                <p className="mt-2 text-base text-gray-500">Could not find requested resource</p>
                <div className="mt-6">
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
                    >
                        Return Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
