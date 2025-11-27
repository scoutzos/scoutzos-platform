'use client';

import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';

export default function Navbar() {
    const { session, loading, signOut } = useAuth();

    return (
        <nav className="bg-white border-b border-gray-200">
            <div className="container mx-auto px-4">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <Link href="/" className="flex-shrink-0 flex items-center font-bold text-xl text-blue-600">
                            ScoutzOS
                        </Link>
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            <Link
                                href="/deals"
                                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                            >
                                Deals
                            </Link>
                            <Link
                                href="/buy-boxes"
                                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                            >
                                Buy Boxes
                            </Link>
                        </div>
                    </div>
                    <div className="flex items-center">
                        {loading ? (
                            <div className="h-8 w-8 animate-pulse bg-gray-200 rounded-full"></div>
                        ) : session ? (
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-gray-700 hidden md:block">
                                    {session.user.email}
                                </span>
                                <button
                                    onClick={() => signOut()}
                                    className="text-sm font-medium text-gray-500 hover:text-gray-700"
                                >
                                    Sign out
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                <Link
                                    href="/login"
                                    className="text-sm font-medium text-gray-500 hover:text-gray-900"
                                >
                                    Sign in
                                </Link>
                                <Link
                                    href="/signup"
                                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                                >
                                    Sign up
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
