'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Deal } from '@/types/deals';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function EditDealPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const [dealId, setDealId] = useState<string>('');
    const [deal, setDeal] = useState<Partial<Deal> | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        params.then(p => {
            setDealId(p.id);
            fetchDeal(p.id);
        });
    }, []);

    const fetchDeal = async (id: string) => {
        try {
            const response = await fetch(`/api/deals/${id}`);
            if (!response.ok) throw new Error('Failed to fetch deal');
            const data = await response.json();
            setDeal(data);
        } catch (err) {
            setError('Failed to load deal');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!deal) return;

        try {
            setSaving(true);
            setError(null);

            const response = await fetch(`/api/deals/${dealId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(deal),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to update deal');
            }

            router.push(`/deals/${dealId}`);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const updateField = (field: keyof Deal, value: any) => {
        setDeal(prev => prev ? { ...prev, [field]: value } : null);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-gray-600 dark:text-gray-400">Loading deal...</div>
            </div>
        );
    }

    if (!deal) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-red-600">Deal not found</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="max-w-3xl mx-auto">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Deal</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Update property details for analysis
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                            <p className="text-red-800 dark:text-red-200">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-card p-6 space-y-6">
                        {/* Property Details */}
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Property Details</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Bedrooms"
                                    type="number"
                                    value={deal.beds || ''}
                                    onChange={(e) => updateField('beds', parseInt(e.target.value) || null)}
                                    placeholder="e.g., 3"
                                />
                                <Input
                                    label="Bathrooms"
                                    type="number"
                                    step="0.5"
                                    value={deal.baths || ''}
                                    onChange={(e) => updateField('baths', parseFloat(e.target.value) || null)}
                                    placeholder="e.g., 2.5"
                                />
                                <Input
                                    label="Square Feet"
                                    type="number"
                                    value={deal.sqft || ''}
                                    onChange={(e) => updateField('sqft', parseInt(e.target.value) || null)}
                                    placeholder="e.g., 1500"
                                />
                                <Input
                                    label="Year Built"
                                    type="number"
                                    value={deal.year_built || ''}
                                    onChange={(e) => updateField('year_built', parseInt(e.target.value) || null)}
                                    placeholder="e.g., 2010"
                                />
                            </div>
                        </div>

                        {/* Financial Details */}
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Financial Details</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Estimated Monthly Rent"
                                    type="number"
                                    value={deal.estimated_rent || ''}
                                    onChange={(e) => updateField('estimated_rent', parseInt(e.target.value) || null)}
                                    placeholder="e.g., 2500"
                                    required
                                    helperText="Required for analysis"
                                />
                                <Input
                                    label="Annual Property Tax"
                                    type="number"
                                    value={deal.tax_annual || ''}
                                    onChange={(e) => updateField('tax_annual', parseInt(e.target.value) || null)}
                                    placeholder="e.g., 3600"
                                    helperText="Leave blank to estimate"
                                />
                                <Input
                                    label="Annual Insurance"
                                    type="number"
                                    value={deal.insurance_annual || ''}
                                    onChange={(e) => updateField('insurance_annual', parseInt(e.target.value) || null)}
                                    placeholder="e.g., 1200"
                                    helperText="Leave blank to estimate"
                                />
                                <Input
                                    label="Monthly HOA"
                                    type="number"
                                    value={deal.hoa_monthly || ''}
                                    onChange={(e) => updateField('hoa_monthly', parseInt(e.target.value) || null)}
                                    placeholder="e.g., 150"
                                    helperText="Leave blank if none"
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => router.back()}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                loading={saving}
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
