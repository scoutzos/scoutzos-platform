'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Deal } from '@/types/deals';
import { formatCurrency } from '@/lib/services/underwriting';

interface SwipeCardProps {
    deal: Deal;
    onSwipe: (direction: 'left' | 'right') => void;
    metrics?: {
        cap_rate?: number | null;
        monthly_cash_flow?: number | null;
        cash_on_cash?: number | null;
        dscr?: number | null;
    };
}

interface AIInsights {
    summary: string;
    strengths: string[];
    risks: string[];
    recommendation: 'Buy' | 'Hold' | 'Pass';
    generatedAt: string;
}

export default function SwipeCard({ deal, onSwipe, metrics }: SwipeCardProps) {
    const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
    const [startX, setStartX] = useState(0);
    const [offsetX, setOffsetX] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
    const [photoIndex, setPhotoIndex] = useState(0);
    const cardRef = useRef<HTMLDivElement>(null);
    const aiCallInProgress = useRef(false);

    // Cache key for AI insights
    const insightsCacheKey = `ai_insights_${deal.id}`;

    const fetchAIInsights = useCallback(async () => {
        if (aiCallInProgress.current) return;

        // Check sessionStorage first
        const cached = sessionStorage.getItem(insightsCacheKey);
        if (cached) {
            try {
                setAiInsights(JSON.parse(cached));
                return;
            } catch {
                // Invalid cache, continue to fetch
            }
        }

        aiCallInProgress.current = true;
        setAiLoading(true);
        setAiError(null);

        try {
            // First check if cached on server
            const checkRes = await fetch(`/api/deals/${deal.id}/advisor`);
            const checkData = await checkRes.json();

            if (checkData.insights) {
                setAiInsights(checkData.insights);
                sessionStorage.setItem(insightsCacheKey, JSON.stringify(checkData.insights));
                setAiLoading(false);
                aiCallInProgress.current = false;
                return;
            }

            // Generate new insights
            const genRes = await fetch(`/api/deals/${deal.id}/advisor`, { method: 'POST' });
            const genData = await genRes.json();

            if (genData.insights) {
                setAiInsights(genData.insights);
                sessionStorage.setItem(insightsCacheKey, JSON.stringify(genData.insights));
            } else {
                setAiError('Failed to generate insights');
            }
        } catch (err) {
            console.error('AI insights error:', err);
            setAiError('Could not load AI insights');
        } finally {
            setAiLoading(false);
            aiCallInProgress.current = false;
        }
    }, [deal.id, insightsCacheKey]);

    // Auto-fetch AI insights on mount
    useEffect(() => {
        fetchAIInsights();
    }, [fetchAIInsights]);

    const handleDragStart = (clientX: number) => {
        if (showDetails) return; // Don't drag when details are open
        setIsDragging(true);
        setStartX(clientX);
    };

    const handleDragMove = (clientX: number) => {
        if (!isDragging) return;
        const diff = clientX - startX;
        setOffsetX(diff);
    };

    const handleDragEnd = () => {
        if (!isDragging) return;
        setIsDragging(false);

        const threshold = 100;
        if (offsetX > threshold) {
            triggerSwipe('right');
        } else if (offsetX < -threshold) {
            triggerSwipe('left');
        } else {
            setOffsetX(0);
        }
    };

    const triggerSwipe = (direction: 'left' | 'right') => {
        setSwipeDirection(direction);
        setTimeout(() => {
            onSwipe(direction);
        }, 300);
    };

    const handleMouseDown = (e: React.MouseEvent) => handleDragStart(e.clientX);
    const handleMouseMove = (e: React.MouseEvent) => handleDragMove(e.clientX);
    const handleMouseUp = () => handleDragEnd();
    const handleMouseLeave = () => {
        if (isDragging) handleDragEnd();
    };

    const handleTouchStart = (e: React.TouchEvent) => handleDragStart(e.touches[0].clientX);
    const handleTouchMove = (e: React.TouchEvent) => handleDragMove(e.touches[0].clientX);
    const handleTouchEnd = () => handleDragEnd();

    const rotation = isDragging ? offsetX * 0.05 : 0;

    const getCardTransform = () => {
        if (swipeDirection === 'right') {
            return 'translateX(150%) rotate(30deg)';
        }
        if (swipeDirection === 'left') {
            return 'translateX(-150%) rotate(-30deg)';
        }
        if (isDragging) {
            return `translateX(${offsetX}px) rotate(${rotation}deg)`;
        }
        return 'translateX(0) rotate(0deg)';
    };

    const showSaveIndicator = offsetX > 50;
    const showPassIndicator = offsetX < -50;

    // Calculate price per sqft
    const pricePerSqft = deal.sqft && deal.list_price ? Math.round(deal.list_price / deal.sqft) : null;

    // Cycle through photos
    const nextPhoto = () => {
        if (deal.photos && deal.photos.length > 1) {
            setPhotoIndex((prev) => (prev + 1) % deal.photos.length);
        }
    };

    const prevPhoto = () => {
        if (deal.photos && deal.photos.length > 1) {
            setPhotoIndex((prev) => (prev - 1 + deal.photos.length) % deal.photos.length);
        }
    };

    const getRecommendationColor = (rec: string) => {
        switch (rec) {
            case 'Buy': return 'bg-green-100 text-green-800';
            case 'Hold': return 'bg-yellow-100 text-yellow-800';
            case 'Pass': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div
            ref={cardRef}
            className={`relative w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden select-none transition-transform ${swipeDirection ? 'duration-300' : isDragging ? 'duration-0' : 'duration-200'} ${showDetails ? '' : 'cursor-grab active:cursor-grabbing'}`}
            style={{
                transform: getCardTransform(),
                opacity: swipeDirection ? 0 : 1,
            }}
            onMouseDown={showDetails ? undefined : handleMouseDown}
            onMouseMove={showDetails ? undefined : handleMouseMove}
            onMouseUp={showDetails ? undefined : handleMouseUp}
            onMouseLeave={showDetails ? undefined : handleMouseLeave}
            onTouchStart={showDetails ? undefined : handleTouchStart}
            onTouchMove={showDetails ? undefined : handleTouchMove}
            onTouchEnd={showDetails ? undefined : handleTouchEnd}
        >
            {/* Swipe indicators */}
            <div className={`absolute inset-0 bg-success/20 z-10 flex items-center justify-center transition-opacity duration-200 pointer-events-none ${showSaveIndicator ? 'opacity-100' : 'opacity-0'}`}>
                <div className="bg-success text-white px-6 py-3 rounded-xl text-2xl font-bold transform -rotate-12 border-4 border-white shadow-lg">
                    SAVE
                </div>
            </div>
            <div className={`absolute inset-0 bg-error/20 z-10 flex items-center justify-center transition-opacity duration-200 pointer-events-none ${showPassIndicator ? 'opacity-100' : 'opacity-0'}`}>
                <div className="bg-error text-white px-6 py-3 rounded-xl text-2xl font-bold transform rotate-12 border-4 border-white shadow-lg">
                    PASS
                </div>
            </div>

            {/* Photo Section */}
            <div className="aspect-[4/3] bg-gray-200 relative">
                {deal.photos && deal.photos.length > 0 ? (
                    <img
                        src={deal.photos[photoIndex]}
                        alt={deal.address_line1}
                        className="w-full h-full object-cover"
                        draggable={false}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                )}

                {/* Photo navigation */}
                {deal.photos && deal.photos.length > 1 && (
                    <>
                        <button
                            onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                            {deal.photos.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`w-2 h-2 rounded-full ${idx === photoIndex ? 'bg-white' : 'bg-white/50'}`}
                                />
                            ))}
                        </div>
                    </>
                )}

                {/* Status and Days on Market badges */}
                <div className="absolute top-3 left-3 flex gap-2">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-sm ${deal.status === 'new' ? 'bg-info/80 text-white' : deal.status === 'analyzing' ? 'bg-warning/80 text-white' : 'bg-gray-800/80 text-white'}`}>
                        {deal.status.toUpperCase()}
                    </span>
                    {deal.days_on_market && (
                        <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-black/60 text-white backdrop-blur-sm">
                            {deal.days_on_market} days
                        </span>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="p-5">
                <h2 className="text-xl font-bold text-gray-900 truncate">{deal.address_line1}</h2>
                <p className="text-gray-500 text-sm">{deal.city}, {deal.state} {deal.zip}</p>

                {/* Price and Details */}
                <div className="mt-3 flex items-center justify-between">
                    <span className="text-2xl font-bold text-brand-primary">
                        {formatCurrency(deal.list_price)}
                    </span>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                        <span>{deal.beds || '-'} bd</span>
                        <span>•</span>
                        <span>{deal.baths || '-'} ba</span>
                        <span>•</span>
                        <span>{deal.sqft?.toLocaleString() || '-'} sqft</span>
                    </div>
                </div>

                {/* Extended Property Info */}
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    {deal.year_built && (
                        <div className="bg-gray-50 rounded p-2 text-center">
                            <p className="text-gray-400">Year Built</p>
                            <p className="font-semibold text-gray-700">{deal.year_built}</p>
                        </div>
                    )}
                    {deal.lot_size && (
                        <div className="bg-gray-50 rounded p-2 text-center">
                            <p className="text-gray-400">Lot Size</p>
                            <p className="font-semibold text-gray-700">{deal.lot_size.toLocaleString()} sqft</p>
                        </div>
                    )}
                    {pricePerSqft && (
                        <div className="bg-gray-50 rounded p-2 text-center">
                            <p className="text-gray-400">$/sqft</p>
                            <p className="font-semibold text-gray-700">${pricePerSqft}</p>
                        </div>
                    )}
                </div>

                {/* Financial Metrics */}
                <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-4 gap-2">
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                        <p className="text-xs text-gray-400">Cap Rate</p>
                        <p className="text-sm font-bold text-gray-900">
                            {metrics?.cap_rate ? `${metrics.cap_rate.toFixed(1)}%` : 'N/A'}
                        </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                        <p className="text-xs text-gray-400">CoC</p>
                        <p className="text-sm font-bold text-gray-900">
                            {metrics?.cash_on_cash ? `${metrics.cash_on_cash.toFixed(1)}%` : 'N/A'}
                        </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                        <p className="text-xs text-gray-400">DSCR</p>
                        <p className="text-sm font-bold text-gray-900">
                            {metrics?.dscr ? metrics.dscr.toFixed(2) : 'N/A'}
                        </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                        <p className="text-xs text-gray-400">Cash Flow</p>
                        <p className={`text-sm font-bold ${metrics?.monthly_cash_flow && metrics.monthly_cash_flow > 0 ? 'text-success' : metrics?.monthly_cash_flow && metrics.monthly_cash_flow < 0 ? 'text-error' : 'text-gray-900'}`}>
                            {metrics?.monthly_cash_flow ? `$${Math.round(metrics.monthly_cash_flow)}` : 'N/A'}
                        </p>
                    </div>
                </div>

                {/* Rent estimate */}
                {deal.estimated_rent && (
                    <div className="mt-3 text-center text-sm text-gray-500">
                        Est. Rent: <span className="font-semibold text-gray-700">{formatCurrency(deal.estimated_rent)}/mo</span>
                    </div>
                )}

                {/* AI Insights - Always visible, auto-generated */}
                <div className="mt-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                    {aiLoading && (
                        <div className="flex items-center justify-center py-4">
                            <svg className="animate-spin h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="ml-2 text-sm text-indigo-700">Generating AI insights...</span>
                        </div>
                    )}

                    {aiError && !aiLoading && (
                        <div className="text-center py-3">
                            <p className="text-red-600 text-xs">{aiError}</p>
                            <button
                                onClick={(e) => { e.stopPropagation(); aiCallInProgress.current = false; fetchAIInsights(); }}
                                className="mt-1 text-indigo-600 text-xs hover:underline"
                            >
                                Try Again
                            </button>
                        </div>
                    )}

                    {aiInsights && !aiLoading && (
                        <div className="space-y-3">
                            {/* Header with Recommendation */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                    <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    <span className="text-xs font-semibold text-indigo-600 uppercase">AI Analysis</span>
                                </div>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getRecommendationColor(aiInsights.recommendation)}`}>
                                    {aiInsights.recommendation}
                                </span>
                            </div>

                            {/* Summary */}
                            <p className="text-xs text-gray-700 italic leading-relaxed">&ldquo;{aiInsights.summary}&rdquo;</p>

                            {/* Toggle for details */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowDetails(!showDetails);
                                }}
                                className="w-full text-xs text-indigo-600 hover:text-indigo-800 flex items-center justify-center gap-1"
                            >
                                {showDetails ? 'Hide Details' : 'Show Details'}
                                <svg className={`w-3 h-3 transition-transform ${showDetails ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {/* Detailed Strengths & Risks */}
                            {showDetails && (
                                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-indigo-100">
                                    <div>
                                        <p className="text-xs font-semibold text-green-700 mb-1">Strengths</p>
                                        <ul className="space-y-1">
                                            {aiInsights.strengths.slice(0, 3).map((s, i) => (
                                                <li key={i} className="text-xs text-gray-600 flex items-start">
                                                    <span className="text-green-500 mr-1 flex-shrink-0">✓</span>
                                                    <span className="line-clamp-2">{s}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-red-700 mb-1">Risks</p>
                                        <ul className="space-y-1">
                                            {aiInsights.risks.slice(0, 3).map((r, i) => (
                                                <li key={i} className="text-xs text-gray-600 flex items-start">
                                                    <span className="text-red-500 mr-1 flex-shrink-0">⚠</span>
                                                    <span className="line-clamp-2">{r}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
