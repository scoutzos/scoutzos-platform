'use client';

import { useState, useEffect } from 'react';
import { UnderwritingResult, formatCurrency, formatPercent, getRatingColor, getRatingBgColor } from '@/lib/services/underwriting';
import { Deal } from '@/types/deals';
import { createClient } from '@/lib/supabase/client';

interface AnalysisTabProps {
    dealId: string;
    dealData?: Deal;
}

export default function AnalysisTab({ dealId, dealData }: AnalysisTabProps) {
    const [analysis, setAnalysis] = useState<UnderwritingResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClient();

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
                    // Reconstruct UnderwritingResult from stored metrics
                    // This is a simplification; ideally we'd store the full result or re-calculate
                    // For now, let's trigger a re-analysis if we don't have the full object, or just display what we have
                    // To keep it simple for this session, let's just trigger analysis if we can't find it, or use the analyze endpoint to get it
                    runAnalysis();
                } else {
                    runAnalysis();
                }
            } else {
                runAnalysis();
            }
        } catch (err) {
            console.error(err);
            setError('Failed to load analysis');
        } finally {
            setLoading(false);
        }
    };

    const runAnalysis = async () => {
        try {
            setAnalyzing(true);
            const response = await fetch(`/api/deals/${dealId}/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}), // Use default assumptions
            });

            if (!response.ok) throw new Error('Analysis failed');

            const data = await response.json();
            setAnalysis(data.analysis);
        } catch (err) {
            console.error(err);
            setError('Failed to run analysis');
        } finally {
            setAnalyzing(false);
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading analysis...</div>;
    if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
    if (!analysis) return <div className="p-8 text-center"><button onClick={runAnalysis} className="text-blue-600 hover:underline">Run Analysis</button></div>;

    return (
        <div className="space-y-8">
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
