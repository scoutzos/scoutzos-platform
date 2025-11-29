'use client';

import { useState, useRef } from 'react';
import { Deal } from '@/types/deals';
import { formatCurrency } from '@/lib/services/underwriting';

interface SwipeCardProps {
    deal: Deal;
    onSwipe: (direction: 'left' | 'right') => void;
    metrics?: {
        cap_rate?: number | null;
        monthly_cash_flow?: number | null;
    };
}

export default function SwipeCard({ deal, onSwipe, metrics }: SwipeCardProps) {
    const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
    const [startX, setStartX] = useState(0);
    const [offsetX, setOffsetX] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    const handleDragStart = (clientX: number) => {
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

    // Mouse events
    const handleMouseDown = (e: React.MouseEvent) => handleDragStart(e.clientX);
    const handleMouseMove = (e: React.MouseEvent) => handleDragMove(e.clientX);
    const handleMouseUp = () => handleDragEnd();
    const handleMouseLeave = () => {
        if (isDragging) handleDragEnd();
    };

    // Touch events
    const handleTouchStart = (e: React.TouchEvent) => handleDragStart(e.touches[0].clientX);
    const handleTouchMove = (e: React.TouchEvent) => handleDragMove(e.touches[0].clientX);
    const handleTouchEnd = () => handleDragEnd();

    // Calculate rotation based on drag
    const rotation = isDragging ? offsetX * 0.05 : 0;

    // Determine card transform
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

    // Show overlay indicators during drag
    const showSaveIndicator = offsetX > 50;
    const showPassIndicator = offsetX < -50;

    return (
        <div
            ref={cardRef}
            className={`relative w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden cursor-grab active:cursor-grabbing select-none transition-transform ${swipeDirection ? 'duration-300' : isDragging ? 'duration-0' : 'duration-200'}`}
            style={{
                transform: getCardTransform(),
                opacity: swipeDirection ? 0 : 1,
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Save indicator overlay */}
            <div
                className={`absolute inset-0 bg-success/20 z-10 flex items-center justify-center transition-opacity duration-200 ${showSaveIndicator ? 'opacity-100' : 'opacity-0'}`}
            >
                <div className="bg-success text-white px-6 py-3 rounded-xl text-2xl font-bold transform -rotate-12 border-4 border-white shadow-lg">
                    SAVE
                </div>
            </div>

            {/* Pass indicator overlay */}
            <div
                className={`absolute inset-0 bg-error/20 z-10 flex items-center justify-center transition-opacity duration-200 ${showPassIndicator ? 'opacity-100' : 'opacity-0'}`}
            >
                <div className="bg-error text-white px-6 py-3 rounded-xl text-2xl font-bold transform rotate-12 border-4 border-white shadow-lg">
                    PASS
                </div>
            </div>

            {/* Photo */}
            <div className="aspect-[4/3] bg-gray-200 relative">
                {deal.photos && deal.photos.length > 0 ? (
                    <img
                        src={deal.photos[0]}
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

                {/* Status badge */}
                <div className="absolute top-3 right-3">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-sm ${
                        deal.status === 'new' ? 'bg-info/80 text-white' :
                        deal.status === 'analyzing' ? 'bg-warning/80 text-white' :
                        'bg-gray-800/80 text-white'
                    }`}>
                        {deal.status.toUpperCase()}
                    </span>
                </div>

                {/* Photo count */}
                {deal.photos && deal.photos.length > 1 && (
                    <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                        1 / {deal.photos.length}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-5">
                {/* Address */}
                <h2 className="text-xl font-bold text-gray-900 truncate">{deal.address_line1}</h2>
                <p className="text-gray-500 text-sm">{deal.city}, {deal.state} {deal.zip}</p>

                {/* Price and Details */}
                <div className="mt-4 flex items-center justify-between">
                    <span className="text-2xl font-bold text-brand-primary">
                        {formatCurrency(deal.list_price)}
                    </span>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                            <span className="font-semibold">{deal.beds || '-'}</span>
                            <span className="text-gray-400">bd</span>
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="font-semibold">{deal.baths || '-'}</span>
                            <span className="text-gray-400">ba</span>
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="font-semibold">{deal.sqft?.toLocaleString() || '-'}</span>
                            <span className="text-gray-400">sqft</span>
                        </span>
                    </div>
                </div>

                {/* Metrics */}
                <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Cap Rate</p>
                        <p className="text-lg font-bold text-gray-900">
                            {metrics?.cap_rate ? `${metrics.cap_rate.toFixed(1)}%` : 'N/A'}
                        </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Cash Flow</p>
                        <p className={`text-lg font-bold ${metrics?.monthly_cash_flow && metrics.monthly_cash_flow > 0 ? 'text-success' : metrics?.monthly_cash_flow && metrics.monthly_cash_flow < 0 ? 'text-error' : 'text-gray-900'}`}>
                            {metrics?.monthly_cash_flow ? `${formatCurrency(metrics.monthly_cash_flow)}/mo` : 'N/A'}
                        </p>
                    </div>
                </div>

                {/* Rent estimate if available */}
                {deal.estimated_rent && (
                    <div className="mt-3 text-center text-sm text-gray-500">
                        Est. Rent: <span className="font-semibold text-gray-700">{formatCurrency(deal.estimated_rent)}/mo</span>
                    </div>
                )}
            </div>
        </div>
    );
}
