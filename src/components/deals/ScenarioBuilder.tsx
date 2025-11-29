'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { ScenarioResponse } from '@/lib/prompts/analysis/schemas';

interface ScenarioBuilderProps {
    dealId: string;
    baseAssumptions: {
        purchase_price: number;
        estimated_rent: number;
        interest_rate: number;
        down_payment_pct: number;
    };
}

export default function ScenarioBuilder({ dealId, baseAssumptions }: ScenarioBuilderProps) {
    const [assumptions, setAssumptions] = useState(baseAssumptions);
    const [result, setResult] = useState<ScenarioResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRunScenario = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/deals/${dealId}/advisor/scenario`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    scenario_name: 'Custom Scenario',
                    assumptions: {
                        purchase_price: assumptions.purchase_price,
                        estimated_rent: assumptions.estimated_rent,
                        interest_rate: assumptions.interest_rate,
                        down_payment_pct: assumptions.down_payment_pct,
                    }
                })
            });

            if (!response.ok) throw new Error('Failed to run scenario');

            const data = await response.json();
            setResult(data);
        } catch (err) {
            setError('Failed to generate scenario analysis');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Scenario Builder ("What If?")</h3>
                <span className="text-sm text-gray-500">Test different financial assumptions</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Controls */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Purchase Price
                        </label>
                        <input
                            type="number"
                            value={assumptions.purchase_price}
                            onChange={(e) => setAssumptions({ ...assumptions, purchase_price: Number(e.target.value) })}
                            className="w-full p-2 border rounded-md"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Estimated Rent
                        </label>
                        <input
                            type="number"
                            value={assumptions.estimated_rent}
                            onChange={(e) => setAssumptions({ ...assumptions, estimated_rent: Number(e.target.value) })}
                            className="w-full p-2 border rounded-md"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Interest Rate (%)
                        </label>
                        <input
                            type="number"
                            step="0.1"
                            value={assumptions.interest_rate}
                            onChange={(e) => setAssumptions({ ...assumptions, interest_rate: Number(e.target.value) })}
                            className="w-full p-2 border rounded-md"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Down Payment (%)
                        </label>
                        <input
                            type="number"
                            value={assumptions.down_payment_pct}
                            onChange={(e) => setAssumptions({ ...assumptions, down_payment_pct: Number(e.target.value) })}
                            className="w-full p-2 border rounded-md"
                        />
                    </div>

                    <Button
                        onClick={handleRunScenario}
                        loading={loading}
                        className="w-full"
                    >
                        Run Scenario
                    </Button>
                </div>

                {/* Results */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    {!result ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center p-8">
                            <p>Adjust assumptions and click "Run Scenario" to see the impact.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <h4 className="font-medium text-gray-900 border-b pb-2">Impact Analysis</h4>

                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div className="p-2 bg-white rounded shadow-sm">
                                    <div className="text-xs text-gray-500">Cash Flow</div>
                                    <div className={`font-bold ${result.delta.monthly_cash_flow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {result.delta.monthly_cash_flow >= 0 ? '+' : ''}${result.delta.monthly_cash_flow}
                                    </div>
                                    <div className="text-xs text-gray-400">vs Base</div>
                                </div>

                                <div className="p-2 bg-white rounded shadow-sm">
                                    <div className="text-xs text-gray-500">Cash on Cash</div>
                                    <div className={`font-bold ${result.delta.cash_on_cash >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {result.delta.cash_on_cash >= 0 ? '+' : ''}{result.delta.cash_on_cash}%
                                    </div>
                                    <div className="text-xs text-gray-400">vs Base</div>
                                </div>

                                <div className="p-2 bg-white rounded shadow-sm">
                                    <div className="text-xs text-gray-500">Cap Rate</div>
                                    <div className={`font-bold ${result.delta.cap_rate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {result.delta.cap_rate >= 0 ? '+' : ''}{result.delta.cap_rate}%
                                    </div>
                                    <div className="text-xs text-gray-400">vs Base</div>
                                </div>
                            </div>

                            <div className="bg-blue-50 p-3 rounded text-sm text-blue-800">
                                <p className="font-medium mb-1">AI Insight:</p>
                                {result.analysis}
                            </div>

                            <div className="text-xs text-gray-500 mt-4">
                                <div className="flex justify-between">
                                    <span>Scenario Cash Flow:</span>
                                    <span className="font-medium">${result.scenario_case.monthly_cash_flow}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Base Cash Flow:</span>
                                    <span className="font-medium">${result.base_case.monthly_cash_flow}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
