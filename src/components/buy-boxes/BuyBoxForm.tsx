'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BuyBox } from '@/types/buy-boxes';

interface BuyBoxFormProps {
    initialData?: Partial<BuyBox>;
    isEditing?: boolean;
}

export default function BuyBoxForm({ initialData, isEditing = false }: BuyBoxFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<Partial<BuyBox>>({
        name: '',
        markets: [],
        property_types: [],
        min_price: undefined,
        max_price: undefined,
        min_beds: undefined,
        max_beds: undefined,
        min_baths: undefined,
        max_baths: undefined,
        strategy: 'buy_hold',
        target_cap_rate: undefined,
        target_cash_on_cash: undefined,
        is_active: true,
        ...initialData,
    });

    // Helper for array fields (comma separated string <-> array)
    const handleArrayChange = (field: 'markets' | 'property_types', value: string) => {
        setFormData({ ...formData, [field]: value.split(',').map(s => s.trim()).filter(Boolean) });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const url = isEditing ? `/api/buy-boxes/${initialData?.id}` : '/api/buy-boxes';
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to save buy box');
            }

            router.push('/buy-boxes');
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-sm border">
            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm">
                    {error}
                </div>
            )}

            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Basic Info</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                            <input
                                type="text"
                                required
                                value={formData.name || ''}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="e.g., Austin SFR Fix & Flip"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Markets (comma separated)</label>
                            <input
                                type="text"
                                value={formData.markets?.join(', ') || ''}
                                onChange={(e) => handleArrayChange('markets', e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Austin, Round Rock, Pflugerville"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Property Types (comma separated)</label>
                            <input
                                type="text"
                                value={formData.property_types?.join(', ') || ''}
                                onChange={(e) => handleArrayChange('property_types', e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="sfr, duplex, triplex, multifamily"
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Criteria</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Min Price</label>
                            <input
                                type="number"
                                value={formData.min_price || ''}
                                onChange={(e) => setFormData({ ...formData, min_price: e.target.value ? Number(e.target.value) : undefined })}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Max Price</label>
                            <input
                                type="number"
                                value={formData.max_price || ''}
                                onChange={(e) => setFormData({ ...formData, max_price: e.target.value ? Number(e.target.value) : undefined })}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Min Beds</label>
                            <input
                                type="number"
                                value={formData.min_beds || ''}
                                onChange={(e) => setFormData({ ...formData, min_beds: e.target.value ? Number(e.target.value) : undefined })}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Max Beds</label>
                            <input
                                type="number"
                                value={formData.max_beds || ''}
                                onChange={(e) => setFormData({ ...formData, max_beds: e.target.value ? Number(e.target.value) : undefined })}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Financial Targets</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Strategy</label>
                            <select
                                value={formData.strategy || 'buy_hold'}
                                onChange={(e) => setFormData({ ...formData, strategy: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="buy_hold">Buy & Hold</option>
                                <option value="brrrr">BRRRR</option>
                                <option value="flip">Flip</option>
                                <option value="str">Short Term Rental</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Target Cap Rate (%)</label>
                            <input
                                type="number"
                                step="0.1"
                                value={formData.target_cap_rate || ''}
                                onChange={(e) => setFormData({ ...formData, target_cap_rate: e.target.value ? Number(e.target.value) : undefined })}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Target Cash-on-Cash (%)</label>
                            <input
                                type="number"
                                step="0.1"
                                value={formData.target_cash_on_cash || ''}
                                onChange={(e) => setFormData({ ...formData, target_cash_on_cash: e.target.value ? Number(e.target.value) : undefined })}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div className="flex items-center pt-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium text-gray-700">Active</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                    {loading ? 'Saving...' : isEditing ? 'Update Buy Box' : 'Create Buy Box'}
                </button>
            </div>
        </form>
    );
}
