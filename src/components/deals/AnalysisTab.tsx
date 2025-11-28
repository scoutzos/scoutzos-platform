'use client';

import { useState, useEffect } from 'react';
import { UnderwritingResult, formatCurrency, formatPercent, getRatingColor, getRatingBgColor, UnderwritingAssumptions, DEFAULT_ASSUMPTIONS } from '@/lib/services/underwriting';
import { Deal } from '@/types/deals';
import { createClient } from '@/lib/supabase/client';
import { generateInsights } from '@/lib/services/ai-insights';

interface AnalysisTabProps {
    dealId: string;
    dealData?: Deal;
}

export default function AnalysisTab({ dealId, dealData }: AnalysisTabProps) {
    const [analysis, setAnalysis] = useState<UnderwritingResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [assumptions, setAssumptions] = useState<UnderwritingAssumptions>(DEFAULT_ASSUMPTIONS);

    useEffect(() => {
        fetchAnalysis();
    }, [dealId]);

    const fetchAnalysis = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/deals/${dealId}/analyze`);
            if (response.ok) {
                const data = await response.json();
                if (data.metrics) {
                    runAnalysis(assumptions);
                } else {
                    runAnalysis(assumptions);
                }
            } else {
                runAnalysis(assumptions);
            }
        } catch (err) {
            console.error(err);
            setError('Failed to load analysis');
        } finally {
            setLoading(false);
        }
    };

    const runAnalysis = async (currentAssumptions: UnderwritingAssumptions) => {
        try {
            setAnalyzing(true);
            const response = await fetch(`/api/deals/${dealId}/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assumptions: currentAssumptions }),
            });

            if (!response.ok) throw new Error('Analysis failed');

            const data = await response.json();
            setAnalysis(data.analysis);
            setAssumptions(data.analysis.assumptions);
        } catch (err) {
            console.error(err);
            setError('Failed to run analysis');
        } finally {
            setAnalyzing(false);
            setLoading(false);
            setIsEditing(false);
        }
    };

    const handleAssumptionChange = (key: keyof UnderwritingAssumptions, value: string) => {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
            setAssumptions(prev => ({ ...prev, [key]: numValue }));
        }
    };

    if (loading) return <div className="p-8 text-center">Loading analysis...</div>;
    if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
    if (!analysis) return <div className="p-8 text-center"><button onClick={() => runAnalysis(assumptions)} className="text-blue-600 hover:underline">Run Analysis</button></div>;

    const insights = generateInsights(analysis);

    return (
        <div className="space-y-8">
            <div className="flex justify-end">
                <button
                    onClick={() => setIsEditing(true)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                    Edit Assumptions
                </button>
            </div>

            {/* AI Insights Section */}
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-6 shadow-sm border border-indigo-100">
                <h3 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center">
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    AI Investment Insights
                </h3>

                <div className="mb-4">
                    <h4 className="text-sm font-bold text-indigo-800 uppercase tracking-wide mb-2">Investment Thesis</h4>
                    <p className="text-gray-700 italic">{insights.thesis}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="text-sm font-bold text-green-700 uppercase tracking-wide mb-2">Pros</h4>
                        <ul className="list-disc list-inside space-y-1">
                            {insights.pros.map((pro, idx) => (
                                <li key={idx} className="text-sm text-gray-700">{pro}</li>
                            ))}
                            {insights.pros.length === 0 && <li className="text-sm text-gray-500">No significant pros identified based on current metrics.</li>}
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-red-700 uppercase tracking-wide mb-2">Cons</h4>
                        <ul className="list-disc list-inside space-y-1">
                            {insights.cons.map((con, idx) => (
                                <li key={idx} className="text-sm text-gray-700">{con}</li>
                            ))}
                            {insights.cons.length === 0 && <li className="text-sm text-gray-500">No significant cons identified based on current metrics.</li>}
                        </ul>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
                    <dt className="truncate text-sm font-medium text-gray-500">Cap Rate</dt>
                    <dd className={`mt-1 text-3xl font-semibold tracking-tight ${getRatingColor(analysis.ratings.capRate)}`}>
                        {formatPercent(analysis.capRate)}
                    </dd>
                    <div className={`mt-2 inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getRatingBgColor(analysis.ratings.capRate)} ${getRatingColor(analysis.ratings.capRate)} ring-opacity-20`}>
                        {analysis.ratings.capRate.toUpperCase()}
                    </div>
                </div>
                <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
                    <dt className="truncate text-sm font-medium text-gray-500">Cash on Cash</dt>
                    <dd className={`mt-1 text-3xl font-semibold tracking-tight ${getRatingColor(analysis.ratings.cashOnCash)}`}>
                        {formatPercent(analysis.cashOnCash)}
                    </dd>
                    <div className={`mt-2 inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getRatingBgColor(analysis.ratings.cashOnCash)} ${getRatingColor(analysis.ratings.cashOnCash)} ring-opacity-20`}>
                        {analysis.ratings.cashOnCash.toUpperCase()}
                    </div>
                </div>
                <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
                    <dt className="truncate text-sm font-medium text-gray-500">Monthly Cash Flow</dt>
                    <dd className={`mt-1 text-3xl font-semibold tracking-tight ${getRatingColor(analysis.ratings.cashFlow)}`}>
                        {formatCurrency(analysis.monthlyCashFlow)}
                    </dd>
                    <div className={`mt-2 inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getRatingBgColor(analysis.ratings.cashFlow)} ${getRatingColor(analysis.ratings.cashFlow)} ring-opacity-20`}>
                        {analysis.ratings.cashFlow.toUpperCase()}
                    </div>
                </div>
                <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
                    <dt className="truncate text-sm font-medium text-gray-500">DSCR</dt>
                    <dd className={`mt-1 text-3xl font-semibold tracking-tight ${getRatingColor(analysis.ratings.dscr)}`}>
                        {analysis.dscr}
                    </dd>
                    <div className={`mt-2 inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getRatingBgColor(analysis.ratings.dscr)} ${getRatingColor(analysis.ratings.dscr)} ring-opacity-20`}>
                        {analysis.ratings.dscr.toUpperCase()}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/* Investment Breakdown */}
                <div className="overflow-hidden rounded-lg bg-white shadow">
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-base font-semibold leading-6 text-gray-900">Investment Breakdown</h3>
                        <dl className="mt-5 divide-y divide-gray-200">
                            <div className="py-3 flex justify-between">
                                <dt className="text-sm font-medium text-gray-500">Purchase Price</dt>
                                <dd className="text-sm font-medium text-gray-900">{formatCurrency(analysis.purchasePrice)}</dd>
                            </div>
                            <div className="py-3 flex justify-between">
                                <dt className="text-sm font-medium text-gray-500">Down Payment ({100 - analysis.assumptions.loanToValue}%)</dt>
                                <dd className="text-sm font-medium text-gray-900">{formatCurrency(analysis.downPayment)}</dd>
                            </div>
                            <div className="py-3 flex justify-between">
                                <dt className="text-sm font-medium text-gray-500">Closing Costs ({analysis.assumptions.closingCostRate}%)</dt>
                                <dd className="text-sm font-medium text-gray-900">{formatCurrency(analysis.closingCosts)}</dd>
                            </div>
                            <div className="py-3 flex justify-between bg-gray-50 px-2 -mx-2 rounded">
                                <dt className="text-sm font-bold text-gray-900">Total Cash Required</dt>
                                <dd className="text-sm font-bold text-gray-900">{formatCurrency(analysis.totalCashRequired)}</dd>
                            </div>
                        </dl>
                    </div>
                </div>

                {/* Monthly Expenses */}
                <div className="overflow-hidden rounded-lg bg-white shadow">
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-base font-semibold leading-6 text-gray-900">Monthly Expenses</h3>
                        <dl className="mt-5 divide-y divide-gray-200">
                            <div className="py-3 flex justify-between">
                                <dt className="text-sm font-medium text-gray-500">Mortgage (P&I)</dt>
                                <dd className="text-sm font-medium text-gray-900">{formatCurrency(analysis.monthlyMortgage)}</dd>
                            </div>
                            <div className="py-3 flex justify-between">
                                <dt className="text-sm font-medium text-gray-500">Property Taxes</dt>
                                <dd className="text-sm font-medium text-gray-900">{formatCurrency(analysis.expenses.propertyTaxes)}</dd>
                            </div>
                            <div className="py-3 flex justify-between">
                                <dt className="text-sm font-medium text-gray-500">Insurance</dt>
                                <dd className="text-sm font-medium text-gray-900">{formatCurrency(analysis.expenses.insurance)}</dd>
                            </div>
                            <div className="py-3 flex justify-between">
                                <dt className="text-sm font-medium text-gray-500">Property Management ({analysis.assumptions.managementRate}%)</dt>
                                <dd className="text-sm font-medium text-gray-900">{formatCurrency(analysis.expenses.management)}</dd>
                            </div>
                            <div className="py-3 flex justify-between">
                                <dt className="text-sm font-medium text-gray-500">Maintenance & CapEx ({analysis.assumptions.maintenanceRate + analysis.assumptions.capexRate}%)</dt>
                                <dd className="text-sm font-medium text-gray-900">{formatCurrency(analysis.expenses.maintenance + analysis.expenses.capex)}</dd>
                            </div>
                            <div className="py-3 flex justify-between">
                                <dt className="text-sm font-medium text-gray-500">Vacancy ({analysis.assumptions.vacancyRate}%)</dt>
                                <dd className="text-sm font-medium text-gray-900">{formatCurrency(analysis.expenses.vacancy)}</dd>
                            </div>
                            <div className="py-3 flex justify-between bg-gray-50 px-2 -mx-2 rounded">
                                <dt className="text-sm font-bold text-gray-900">Total Monthly Expenses</dt>
                                <dd className="text-sm font-bold text-gray-900">{formatCurrency(analysis.totalMonthlyExpenses + analysis.monthlyMortgage)}</dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {isEditing && (
                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsEditing(false)} />

                        <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                            <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                                <button
                                    type="button"
                                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                                    onClick={() => setIsEditing(false)}
                                >
                                    <span className="sr-only">Close</span>
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="sm:flex sm:items-start">
                                <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                                    <h3 className="text-base font-semibold leading-6 text-gray-900">Edit Assumptions</h3>
                                    <div className="mt-4 grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Interest Rate (%)</label>
                                            <input
                                                type="number"
                                                value={assumptions.interestRate}
                                                onChange={(e) => handleAssumptionChange('interestRate', e.target.value)}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Loan to Value (%)</label>
                                            <input
                                                type="number"
                                                value={assumptions.loanToValue}
                                                onChange={(e) => handleAssumptionChange('loanToValue', e.target.value)}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Vacancy Rate (%)</label>
                                            <input
                                                type="number"
                                                value={assumptions.vacancyRate}
                                                onChange={(e) => handleAssumptionChange('vacancyRate', e.target.value)}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Management Rate (%)</label>
                                            <input
                                                type="number"
                                                value={assumptions.managementRate}
                                                onChange={(e) => handleAssumptionChange('managementRate', e.target.value)}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Maintenance Rate (%)</label>
                                            <input
                                                type="number"
                                                value={assumptions.maintenanceRate}
                                                onChange={(e) => handleAssumptionChange('maintenanceRate', e.target.value)}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">CapEx Rate (%)</label>
                                            <input
                                                type="number"
                                                value={assumptions.capexRate}
                                                onChange={(e) => handleAssumptionChange('capexRate', e.target.value)}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                        <button
                                            type="button"
                                            className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto"
                                            onClick={() => runAnalysis(assumptions)}
                                        >
                                            {analyzing ? 'Calculating...' : 'Recalculate'}
                                        </button>
                                        <button
                                            type="button"
                                            className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                                            onClick={() => setIsEditing(false)}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
