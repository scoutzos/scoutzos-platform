'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface QuickEditFormProps {
    dealId: string;
    missingFields: string[];
    onSuccess: () => void;
    onCancel: () => void;
}

export function QuickEditForm({ dealId, missingFields, onSuccess, onCancel }: QuickEditFormProps) {
    const [formData, setFormData] = useState<Record<string, number>>({});
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fieldMapping: Record<string, { key: string; label: string; placeholder: string; type?: string; step?: string }> = {
        'Purchase Price': { key: 'list_price', label: 'Purchase Price', placeholder: '590000' },
        'Estimated Monthly Rent': { key: 'estimated_rent', label: 'Estimated Monthly Rent', placeholder: '2500' },
        'Bedrooms': { key: 'beds', label: 'Bedrooms', placeholder: '3' },
        'Bathrooms': { key: 'baths', label: 'Bathrooms', placeholder: '2.5', step: '0.5' },
        'Square Feet': { key: 'sqft', label: 'Square Feet', placeholder: '1500' },
        'Annual Property Tax': { key: 'tax_annual', label: 'Annual Property Tax', placeholder: '3600' },
        'Annual Insurance': { key: 'insurance_annual', label: 'Annual Insurance', placeholder: '1200' },
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setSaving(true);
            setError(null);

            const response = await fetch(`/api/deals/${dealId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to update deal');
            }

            onSuccess();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const updateField = (key: string, value: string) => {
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && numValue > 0) {
            setFormData(prev => ({ ...prev, [key]: numValue }));
        } else if (value === '') {
            const newData = { ...formData };
            delete newData[key];
            setFormData(newData);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-brand-primary p-6">
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Add Missing Data</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Fill in the required fields below to run the analysis
                </p>
            </div>

            {error && (
                <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {missingFields.map((field) => {
                        const mapping = fieldMapping[field];
                        if (!mapping) return null;

                        return (
                            <Input
                                key={mapping.key}
                                label={mapping.label}
                                type="number"
                                step={mapping.step || '1'}
                                placeholder={mapping.placeholder}
                                value={formData[mapping.key] || ''}
                                onChange={(e) => updateField(mapping.key, e.target.value)}
                                required
                            />
                        );
                    })}
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onCancel}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        loading={saving}
                    >
                        {saving ? 'Saving & Analyzing...' : 'Save & Run Analysis'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
