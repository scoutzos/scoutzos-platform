'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { UnderwritingResult, formatCurrency, formatPercent, getRatingColor, getRatingBgColor, UnderwritingAssumptions, DEFAULT_ASSUMPTIONS } from '@/lib/services/underwriting';
import { Deal } from '@/types/deals';
import { QuickEditForm } from './QuickEditForm';
import { calculateSmartRentEstimate, getConfidenceColor, getConfidenceBgColor, SmartRentEstimate } from '@/lib/rentCast';
import { VoiceChat } from '@/components/ui/VoiceChat';
import ScenarioBuilder from './ScenarioBuilder';

interface AnalysisTabProps {
    dealId: string;
    dealData?: Deal;
}

interface AnalysisError {
    error: string;
    message?: string;
    missingFields?: string[];
}

interface AIInsights {
    summary: string;
    strengths: string[];
    risks: string[];
    recommendation: 'Buy' | 'Hold' | 'Pass';
    generatedAt?: string;
}

export default function AnalysisTab({ dealId, dealData }: AnalysisTabProps) {
    const [analysis, setAnalysis] = useState<UnderwritingResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [error, setError] = useState<AnalysisError | null>(null);
    const [assumptionsOpen, setAssumptionsOpen] = useState(false);
    const [assumptions, setAssumptions] = useState<UnderwritingAssumptions>(DEFAULT_ASSUMPTIONS);
    const [savedAssumptions, setSavedAssumptions] = useState<UnderwritingAssumptions>(DEFAULT_ASSUMPTIONS);
    const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
    const [calculatedAt, setCalculatedAt] = useState<string | null>(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
    const [voiceEnabled, setVoiceEnabled] = useState(false);

    // Prevent duplicate AI calls
    const aiCallInProgress = useRef(false);
    const hasAttemptedAiGeneration = useRef(false);

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

    // Calculate smart rent estimate
    const smartRentEstimate = useMemo<SmartRentEstimate | null>(() => {
        if (!dealData) return null;
        return calculateSmartRentEstimate(
            dealData.zillow_rent_estimate,
            dealData.rentcast_rent_estimate,
            dealData.list_price
        );
    }, [dealData]);

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

    // Auto-generate AI insights
    const generateAIInsights = useCallback(async (forceRegenerate = false) => {
        if (aiCallInProgress.current) return;
        if (!forceRegenerate && hasAttemptedAiGeneration.current) return;

        aiCallInProgress.current = true;
        hasAttemptedAiGeneration.current = true;
        setAiLoading(true);
        setAiError(null);

        try {
            // First check if we have cached insights
            const checkRes = await fetch(`/api/deals/${dealId}/advisor`);
            const checkData = await checkRes.json();

            if (checkData.insights && !forceRegenerate) {
                setAiInsights(checkData.insights);
                setAiLoading(false);
                aiCallInProgress.current = false;
                return;
            }

            // Generate new insights
            const genRes = await fetch(`/api/deals/${dealId}/advisor`, { method: 'POST' });
            const genData = await genRes.json();

            if (genData.insights) {
                setAiInsights(genData.insights);
            } else if (genData.error) {
                setAiError(genData.error);
            }
        } catch (err) {
            console.error('AI insights error:', err);
            setAiError('Could not generate AI insights. Try again later.');
        } finally {
            setAiLoading(false);
            aiCallInProgress.current = false;
        }
    }, [dealId]);

    // Run analysis
    const runAnalysis = useCallback(async (currentAssumptions: UnderwritingAssumptions) => {
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
                setError({
                    error: data.error || 'Analysis failed',
                    message: data.message,
                    missingFields: data.missingFields
                });
                return false;
            }

            setAnalysis(data.analysis);
            setAssumptions(data.analysis.assumptions);
            setSavedAssumptions(data.analysis.assumptions);
            if (data.calculated_at) {
                setCalculatedAt(data.calculated_at);
            }
            return true;
        } catch (err) {
            console.error(err);
            setError({ error: 'Failed to run analysis', message: 'An unexpected error occurred. Please try again.' });
            return false;
        } finally {
            setAnalyzing(false);
            setLoading(false);
        }
    }, [dealId]);

    // Auto-run analysis on mount
    useEffect(() => {
        const autoAnalyze = async () => {
            setLoading(true);
            setError(null);
            const success = await runAnalysis(assumptions);
            if (success) {
                // Auto-generate AI insights after analysis succeeds
                generateAIInsights();
            }
        };

        autoAnalyze();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dealId]);

    const handleReset = () => {
        setAssumptions(savedAssumptions);
    };

    const handleRefreshAnalysis = async () => {
        hasAttemptedAiGeneration.current = false;
        const success = await runAnalysis(assumptions);
        if (success) {
            generateAIInsights(true);
        }
    };

    const handleRefreshAIInsights = async () => {
        await generateAIInsights(true);
    };

    const handleAssumptionChange = (key: keyof UnderwritingAssumptions, value: string) => {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
            setAssumptions(prev => ({ ...prev, [key]: numValue }));
        }
    };

    const [showQuickEdit, setShowQuickEdit] = useState(false);

    // Loading state with spinner
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-16">
                <svg className="animate-spin h-12 w-12 text-brand-primary mb-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-gray-700 font-medium">Analyzing deal...</p>
                <p className="text-sm text-gray-500 mt-1">Running financial calculations</p>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="p-8">
                {!showQuickEdit ? (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6 max-w-2xl mx-auto">
                        <div className="flex items-start">
                            <svg className="h-6 w-6 text-amber-500 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200">{error.error}</h3>
                                {error.message && (
                                    <p className="mt-2 text-amber-700 dark:text-amber-300">{error.message}</p>
                                )}
                                {error.missingFields && error.missingFields.length > 0 && (
                                    <div className="mt-3">
                                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Missing fields:</p>
                                        <ul className="mt-1 list-disc list-inside text-sm text-amber-700 dark:text-amber-300">
                                            {error.missingFields.map((field, idx) => (
                                                <li key={idx}>{field}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                <div className="mt-4 flex flex-wrap gap-3">
                                    {error.missingFields && error.missingFields.length > 0 && (
                                        <button
                                            onClick={() => setShowQuickEdit(true)}
                                            className="inline-flex items-center px-4 py-2 bg-brand-primary text-white text-sm font-medium rounded-md hover:bg-brand-primary-hover transition-colors"
                                        >
                                            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                            Quick Add Data
                                        </button>
                                    )}
                                    <a
                                        href={`/deals/${dealId}/edit`}
                                        className="inline-flex items-center px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-md hover:bg-amber-700 transition-colors"
                                    >
                                        Edit Deal Details
                                    </a>
                                    <button
                                        onClick={handleRefreshAnalysis}
                                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
                                    >
                                        Retry Analysis
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <QuickEditForm
                        dealId={dealId}
                        missingFields={error.missingFields || []}
                        onSuccess={() => {
                            setShowQuickEdit(false);
                            handleRefreshAnalysis();
                        }}
                        onCancel={() => setShowQuickEdit(false)}
                    />
                )}
            </div>
        );
    }

    if (!analysis) {
        return (
            <div className="flex flex-col items-center justify-center py-16">
                <svg className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-gray-600 font-medium mb-2">No analysis available</p>
                <button
                    onClick={handleRefreshAnalysis}
                    className="text-brand-primary hover:underline text-sm"
                >
                    Run Analysis
                </button>
            </div>
        );
    }

    const getRecommendationColor = (rec: string) => {
        switch (rec) {
            case 'Buy': return 'bg-green-100 text-green-800';
            case 'Hold': return 'bg-yellow-100 text-yellow-800';
            case 'Pass': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-8">
            {/* Timestamp, Stale Warning, and Refresh Link */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {isStale && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-800">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Deal data changed since last analysis
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    {calculatedAt && (
                        <span className="text-xs text-gray-500">
                            Last calculated: {formatTimestamp(calculatedAt)}
                        </span>
                    )}
                    <button
                        onClick={handleRefreshAnalysis}
                        disabled={analyzing}
                        className="text-xs text-brand-primary hover:underline disabled:opacity-50"
                    >
                        {analyzing ? 'Refreshing...' : 'Refresh Analysis'}
                    </button>
                </div>
            </div>

            {/* AI Investment Analysis - Auto-generated */}
            <div className={`bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg shadow-sm border border-indigo-100 ${aiLoading ? 'animate-pulse' : ''}`}>
                {/* Header */}
                <div className="px-6 py-4 border-b border-indigo-100 flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-indigo-900 flex items-center">
                            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            AI Investment Analysis
                        </h3>
                        <button
                            onClick={() => setVoiceEnabled(!voiceEnabled)}
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${voiceEnabled
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            title={voiceEnabled ? 'Disable voice' : 'Enable voice'}
                        >
                            <svg className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                            {voiceEnabled ? 'Voice On' : 'Voice Off'}
                        </button>
                    </div>
                    {aiInsights && !aiLoading && (
                        <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${getRecommendationColor(aiInsights.recommendation)}`}>
                                {aiInsights.recommendation}
                            </span>
                            <button
                                onClick={handleRefreshAIInsights}
                                disabled={aiLoading}
                                className="text-xs text-indigo-600 hover:underline disabled:opacity-50"
                            >
                                Refresh
                            </button>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Loading State */}
                    {aiLoading && (
                        <div className="flex flex-col items-center justify-center py-8">
                            <svg className="animate-spin h-8 w-8 text-indigo-600 mb-3" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p className="text-indigo-800 font-medium">Generating AI insights...</p>
                            <p className="text-sm text-indigo-600 mt-1">This usually takes 5-15 seconds</p>
                        </div>
                    )}

                    {/* Error State */}
                    {aiError && !aiLoading && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <svg className="h-5 w-5 text-red-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <div>
                                    <p className="text-red-800 font-medium">Failed to generate AI analysis</p>
                                    <p className="text-sm text-red-600 mt-1">{aiError}</p>
                                    <button
                                        onClick={handleRefreshAIInsights}
                                        className="mt-2 text-sm text-red-700 hover:underline"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Insights Content */}
                    {aiInsights && !aiLoading && !aiError && (
                        <div className="space-y-4">
                            {/* Summary */}
                            <div className="bg-white/60 rounded-lg p-4 border border-indigo-100">
                                <p className="text-gray-700 italic">&ldquo;{aiInsights.summary}&rdquo;</p>
                            </div>

                            {/* Strengths & Risks */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-green-50/50 rounded-lg p-4 border border-green-100">
                                    <h4 className="text-sm font-bold text-green-700 uppercase tracking-wide mb-3 flex items-center">
                                        <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Strengths
                                    </h4>
                                    <ul className="space-y-2">
                                        {aiInsights.strengths.map((s, idx) => (
                                            <li key={idx} className="text-sm text-gray-700 flex items-start">
                                                <span className="text-green-500 mr-2 mt-0.5">✓</span>
                                                {s}
                                            </li>
                                        ))}
                                        {aiInsights.strengths.length === 0 && (
                                            <li className="text-sm text-gray-500 italic">No significant strengths identified.</li>
                                        )}
                                    </ul>
                                </div>
                                <div className="bg-red-50/50 rounded-lg p-4 border border-red-100">
                                    <h4 className="text-sm font-bold text-red-700 uppercase tracking-wide mb-3 flex items-center">
                                        <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        Risks
                                    </h4>
                                    <ul className="space-y-2">
                                        {aiInsights.risks.map((r, idx) => (
                                            <li key={idx} className="text-sm text-gray-700 flex items-start">
                                                <span className="text-red-500 mr-2 mt-0.5">⚠</span>
                                                {r}
                                            </li>
                                        ))}
                                        {aiInsights.risks.length === 0 && (
                                            <li className="text-sm text-gray-500 italic">No significant risks identified.</li>
                                        )}
                                    </ul>
                                </div>
                            </div>

                            {/* Timestamp */}
                            {aiInsights.generatedAt && (
                                <p className="text-xs text-indigo-600/70 text-right">
                                    Generated: {formatTimestamp(aiInsights.generatedAt)}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>

            {/* Scenario Builder */ }
    {
        analysis && (
            <ScenarioBuilder
                dealId={dealId}
                baseAssumptions={{
                    purchase_price: analysis.purchasePrice,
                    estimated_rent: dealData?.estimated_rent || analysis.estimatedRent,
                    interest_rate: analysis.assumptions.interestRate,
                    down_payment_pct: 100 - analysis.assumptions.loanToValue
                }}
            />
        )
    }

    {/* Collapsible Assumptions Panel */ }
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

    {/* Smart Rent Estimate Section */ }
    {
        smartRentEstimate && (
            <div className="overflow-hidden rounded-lg bg-white shadow">
                <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-semibold leading-6 text-gray-900">Rent Estimate</h3>
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getConfidenceBgColor(smartRentEstimate.confidence)} ${getConfidenceColor(smartRentEstimate.confidence)}`}>
                            {smartRentEstimate.confidence === 'high' && '✓ High Confidence'}
                            {smartRentEstimate.confidence === 'medium' && '◐ Medium Confidence'}
                            {smartRentEstimate.confidence === 'low' && '⚠ Low Confidence'}
                            {smartRentEstimate.confidence === 'estimated' && '⚠ Estimated'}
                        </div>
                    </div>

                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-gray-900">
                            {formatCurrency(smartRentEstimate.estimatedRent)}
                        </span>
                        <span className="text-gray-500">/month</span>
                    </div>

                    <p className="mt-2 text-sm text-gray-600">{smartRentEstimate.displayNote}</p>

                    {smartRentEstimate.variancePercent !== null && (
                        <div className={`mt-3 flex items-center gap-2 text-sm ${smartRentEstimate.variancePercent > 20 ? 'text-orange-600' : smartRentEstimate.variancePercent > 10 ? 'text-yellow-600' : 'text-green-600'}`}>
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Variance between sources: {smartRentEstimate.variancePercent}%</span>
                        </div>
                    )}

                    {smartRentEstimate.showBothEstimates && (
                        <div className="mt-4 grid grid-cols-2 gap-4">
                            {smartRentEstimate.sources.zillow && (
                                <div className="bg-blue-50 rounded-lg p-3">
                                    <div className="flex items-center gap-2">
                                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">Zillow</span>
                                    </div>
                                    <p className="mt-1 text-lg font-semibold text-blue-900">{formatCurrency(smartRentEstimate.sources.zillow)}</p>
                                </div>
                            )}
                            {smartRentEstimate.sources.rentcast && (
                                <div className="bg-green-50 rounded-lg p-3">
                                    <div className="flex items-center gap-2">
                                        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">RentCast</span>
                                    </div>
                                    <p className="mt-1 text-lg font-semibold text-green-900">{formatCurrency(smartRentEstimate.sources.rentcast)}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {smartRentEstimate.showWarning && smartRentEstimate.confidence === 'estimated' && (
                        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                                <svg className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <div>
                                    <p className="text-sm font-medium text-amber-800">No Market Data Available</p>
                                    <p className="text-xs text-amber-700 mt-1">
                                        This estimate is calculated using the 0.7% rule (monthly rent = 0.7% of purchase price).
                                        Consider getting a professional rent analysis for more accurate projections.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    {/* KPI Cards */ }
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

        </div >
    );
}
