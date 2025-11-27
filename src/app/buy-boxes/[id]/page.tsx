'use client';

import { useEffect, useState, use } from 'react';
import { BuyBox } from '@/types/buy-boxes';
import BuyBoxForm from '@/components/buy-boxes/BuyBoxForm';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function EditBuyBoxPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [buyBox, setBuyBox] = useState<BuyBox | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchBuyBox() {
            try {
                const res = await fetch(`/api/buy-boxes/${id}`);
                if (!res.ok) throw new Error('Buy Box not found');
                const data = await res.json();
                setBuyBox(data);
            } catch (error) {
                console.error('Failed to fetch buy box:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchBuyBox();
    }, [id]);

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this buy box?')) return;

        try {
            const res = await fetch(`/api/buy-boxes/${id}`, { method: 'DELETE' });
            if (res.ok) {
                router.push('/buy-boxes');
            }
        } catch (error) {
            console.error('Failed to delete buy box:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!buyBox) {
        return (
            <div className="container mx-auto px-4 py-8 text-center">
                <h1 className="text-2xl font-bold mb-4">Buy Box Not Found</h1>
                <Link href="/buy-boxes" className="text-blue-600 hover:underline">
                    Back to Buy Boxes
                </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <Link href="/buy-boxes" className="text-gray-500 hover:text-gray-700 mb-4 inline-block">
                        ← Back to Buy Boxes
                    </Link>
                    <h1 className="text-3xl font-bold">Edit Buy Box</h1>
                </div>
                <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                >
                    Delete
                </button>
            </div>

            <BuyBoxForm initialData={buyBox} isEditing />
        </div>
    );
}
