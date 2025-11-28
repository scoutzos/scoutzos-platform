'use client';

import { useState, useEffect, useMemo } from 'react';
import { UnderwritingResult, formatCurrency, formatPercent, getRatingColor, getRatingBgColor, UnderwritingAssumptions, DEFAULT_ASSUMPTIONS } from '@/lib/services/underwriting';
import { Deal } from '@/types/deals';
import { createClient } from '@/lib/supabase/client';

interface AnalysisTabProps {
    dealId: string;
    dealData?: Deal;
}

interface AnalysisError {
    error: string;
    message?: string;
    missingFields?: string[];
}

export default function AnalysisTab({ dealId, dealData }: AnalysisTabProps) {
    const [analysis, setAnalysis] = useState<UnderwritingResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [error, setError] = useState<AnalysisError | null>(null);
    const [assumptionsOpen, setAssumptionsOpen] = useState(false);
    const [assumptions, setAssumptions] = useState<UnderwritingAssumptions>(DEFAULT_ASSUMPTIONS);
    const [savedAssumptions, setSavedAssumptions] = useState<UnderwritingAssumptions>(DEFAULT_ASSUMPTIONS);
    const [insights, setInsights] = useState<{ pros: string[], cons: string[], thesis: string } | null>(null);
    const [calculatedAt, setCalculatedAt] = useState<string | null>(null);

    // Format timestamp for display
    const formatTimestamp = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    // Check if deal data is newer than the analysis
    const isStale = useMemo(() => {
        if (!calculatedAt || !dealData?.updated_at) return false;
        return new Date(dealData.updated_at) > new Date(calculatedAt);
    }, [calculatedAt, dealData?.updated_at]);

    // Check if assumptions have been modified from saved values
    const isModified = useMemo(() => {
        return (
            assumptions.interestRate !== savedAssumptions.interestRate ||
            assumptions.loanToValue !== savedAssumptions.loanToValue ||
            assumptions.vacancyRate !== savedAssumptions.vacancyRate ||
            assumptions.managementRate !== savedAssumptions.managementRate ||
            assumptions.maintenanceRate !== savedAssumptions.maintenanceRate ||
            assumptions.capexRate !== savedAssumptions.capexRate
        );
    }, [assumptions, savedAssumptions]);

    useEffect(() => {
        fetchAnalysis();
    }, [dealId]);

    const fetchAnalysis = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(`/api/deals/${dealId}/analyze`);
            if (response.ok) {
                const data = await response.json();
                if (data.metrics) {
                    // Existing metrics found, run analysis to get full result
                    // Also check if we have stored insights
                    if (data.insights) {
                        setInsights(data.insights);
                    }
                    runAnalysis(assumptions);
                } else {
                    runAnalysis(assumptions);
                }
            } else {
                // No existing analysis, run fresh analysis
                runAnalysis(assumptions);
            }
        } catch (err) {
            console.error(err);
            setError({ error: 'Failed to load analysis', message: 'Could not connect to the server.' });
            setLoading(false);
        }
    };

    const runAnalysis = async (currentAssumptions: UnderwritingAssumptions) => {
        try {
            setAnalyzing(true);
            setError(null);
            const response = await fetch(`/api/deals/${dealId}/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assumptions: currentAssumptions }),
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle structured error response from API
                setError({
                    error: data.error || 'Analysis failed',
                    message: data.message,
                    missingFields: data.missingFields
                });
                return;
            }

            setAnalysis(data.analysis);
            setAssumptions(data.analysis.assumptions);
            setSavedAssumptions(data.analysis.assumptions);
            if (data.calculated_at) {
                setCalculatedAt(data.calculated_at);
            }
            if (data.insights) {
                setInsights(data.insights);
            }
        } catch (err) {
            console.error(err);
            setError({ error: 'Failed to run analysis', message: 'An unexpected error occurred. Please try again.' });
        } finally {
            setAnalyzing(false);
            setLoading(false);
        }
    };

    const handleReset = () => {
        setAssumptions(savedAssumptions);
    };

    const handleAssumptionChange = (key: keyof UnderwritingAssumptions, value: string) => {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
            setAssumptions(prev => ({ ...prev, [key]: numValue }));
        }
    };

    if (loading) return <div className="p-8 text-center">Loading analysis...</div>;
    if (error) return (
        <div className="p-8">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 max-w-2xl mx-auto">
                <div className="flex items-start">
                    <svg className="h-6 w-6 text-amber-500 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                        <h3 className="text-lg font-semibold text-amber-800">{error.error}</h3>
                        {error.message && (
                            <p className="mt-2 text-amber-700">{error.message}</p>
                        )}
                        {error.missingFields && error.missingFields.length > 0 && (
                            <div className="mt-3">
                                <p className="text-sm font-medium text-amber-800">Missing fields:</p>
                                <ul className="mt-1 list-disc list-inside text-sm text-amber-700">
                                    {error.missingFields.map((field, idx) => (
                                        <li key={idx}>{field}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <div className="mt-4">
                            <a
                                href={`/deals/${dealId}/edit`}
                                className="inline-flex items-center px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-md hover:bg-amber-700 transition-colors"
                            >
                                Edit Deal to Add Missing Data
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
    if (!analysis) return <div className="p-8 text-center"><button onClick={() => runAnalysis(assumptions)} className="text-blue-600 hover:underline">Run Analysis</button></div>;

    // Use insights from state, or fallback to empty structure if loading/missing
    const displayInsights = insights || { pros: [], cons: [], thesis: 'Analysis pending...' };

    return (
        <div className="space-y-8">
            {/* Timestamp and Stale Warning */}
            <div className="flex items-center justify-end gap-3">
                {isStale && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-800">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Deal data changed since last analysis
                    </span>
                )}
                {calculatedAt && (
                    <span className="text-xs text-gray-500">
                        Last calculated: {formatTimestamp(calculatedAt)}
                    </span>
                )}
            </div>

            {/* Collapsible Assumptions Panel */}
            <div className="bg-white rounded-lg shadow border border-gray-200">
                <button
                    onClick={() => setAssumptionsOpen(!assumptionsOpen)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <svg
                            className={`h-5 w-5 text-gray-500 transition-transform ${assumptionsOpen ? 'rotate-90' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="text-sm font-semibold text-gray-900">Assumptions</span>
                        {isModified && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                                Modified
                            </span>
                        )}
                    </div>
                    {isModified && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleReset();
                            }}
                            className="text-sm text-gray-500 hover:text-gray-700 underline"
                        >
                            Reset
                        </button>
                    )}
                </button>

                {assumptionsOpen && (
                    <div className="px-4 pb-4 border-t border-gray-100">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Interest Rate</label>
                                <div className="flex items-center">
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={assumptions.interestRate}
                                        onChange={(e) => handleAssumptionChange('interestRate', e.target.value)}
                                        className="w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm border p-2"
                                    />
                                    <span className="ml-1 text-sm text-gray-500">%</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Vacancy</label>
                                <div className="flex items-center">
                                    <input
                                        type="number"
                                        step="1"
                                        value={assumptions.vacancyRate}
                                        onChange={(e) => handleAssumptionChange('vacancyRate', e.target.value)}
                                        className="w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm border p-2"
                                    />
                                    <span className="ml-1 text-sm text-gray-500">%</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">LTV</label>
                                <div className="flex items-center">
                                    <input
                                        type="number"
                                        step="1"
                                        value={assumptions.loanToValue}
                                        onChange={(e) => handleAssumptionChange('loanToValue', e.target.value)}
                                        className="w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm border p-2"
                                    />
                                    <span className="ml-1 text-sm text-gray-500">%</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Management</label>
                                <div className="flex items-center">
                                    <input
                                        type="number"
                                        step="1"
                                        value={assumptions.managementRate}
                                        onChange={(e) => handleAssumptionChange('managementRate', e.target.value)}
                                        className="w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm border p-2"
                                    />
                                    <span className="ml-1 text-sm text-gray-500">%</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Maintenance</label>
                                <div className="flex items-center">
                                    <input
                                        type="number"
                                        step="1"
                                        value={assumptions.maintenanceRate}
                                        onChange={(e) => handleAssumptionChange('maintenanceRate', e.target.value)}
                                        className="w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm border p-2"
                                    />
                                    <span className="ml-1 text-sm text-gray-500">%</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">CapEx</label>
                                <div className="flex items-center">
                                    <input
                                        type="number"
                                        step="1"
                                        value={assumptions.capexRate}
                                        onChange={(e) => handleAssumptionChange('capexRate', e.target.value)}
                                        className="w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm border p-2"
                                    />
                                    <span className="ml-1 text-sm text-gray-500">%</span>
                                </div>
                            </div>
                        </div>

                        {isModified && (
                            <div className="mt-4 flex justify-center">
                                <button
                                    onClick={() => runAnalysis(assumptions)}
                                    disabled={analyzing}
                                    className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-semibold rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {analyzing ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Recalculating...
                                        </>
                                    ) : (
                                        'Recalculate Analysis'
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                )}
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
                    <p className="text-gray-700 italic">{displayInsights.thesis}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="text-sm font-bold text-green-700 uppercase tracking-wide mb-2">Pros</h4>
                        <ul className="list-disc list-inside space-y-1">
                            {displayInsights.pros.map((pro, idx) => (
                                <li key={idx} className="text-sm text-gray-700">{pro}</li>
                            ))}
                            {displayInsights.pros.length === 0 && <li className="text-sm text-gray-500">No significant pros identified based on current metrics.</li>}
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-red-700 uppercase tracking-wide mb-2">Cons</h4>
                        <ul className="list-disc list-inside space-y-1">
                            {displayInsights.cons.map((con, idx) => (
                                <li key={idx} className="text-sm text-gray-700">{con}</li>
                            ))}
                            {displayInsights.cons.length === 0 && <li className="text-sm text-gray-500">No significant cons identified based on current metrics.</li>}
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

        </div>
    );
}
