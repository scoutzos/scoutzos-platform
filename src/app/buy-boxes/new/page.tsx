'use client';

import BuyBoxForm from '@/components/buy-boxes/BuyBoxForm';
import Link from 'next/link';

export default function NewBuyBoxPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6">
                <Link href="/buy-boxes" className="text-gray-500 hover:text-gray-700 mb-4 inline-block">
                    ← Back to Buy Boxes
                </Link>
                <h1 className="text-3xl font-bold">Create New Buy Box</h1>
            </div>

            <BuyBoxForm />
        </div>
    );
}
