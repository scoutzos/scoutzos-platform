'use client';

import { useState } from 'react';
import DiscoveryChat from '@/components/discovery/DiscoveryChat';

export default function DiscoveryPage() {
    const [session, setSession] = useState<any>(null);
    const [started, setStarted] = useState(false);
    const [loading, setLoading] = useState(false);

    const startSession = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/discovery/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ entry_point: 'sidebar' })
            });
            const data = await res.json();
            if (data.data) {
                setSession(data.data);
                setStarted(true);
            }
        } catch (err) {
            console.error('Failed to start session:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!started) {
        return (
            <div className="max-w-4xl mx-auto p-8">
                <div className="text-center space-y-6 py-12">
                    <h1 className="text-4xl font-bold text-gray-900">Discover Your Investment Strategy</h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Our AI Advisor will help you define your goals, analyze your resources, and build a personalized buy box in just a few minutes.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mt-12 text-left">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Analyze Your Resources</h3>
                            <p className="text-sm text-gray-500">Understand your capital, credit, and time availability to find the right strategy.</p>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Define Your Goals</h3>
                            <p className="text-sm text-gray-500">Clarify whether you want cash flow, appreciation, tax benefits, or quick flips.</p>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Build Your Buy Box</h3>
                            <p className="text-sm text-gray-500">Get a specific set of criteria to target deals that match your unique profile.</p>
                        </div>
                    </div>

                    <button
                        onClick={startSession}
                        disabled={loading}
                        className="mt-8 px-8 py-4 bg-brand-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-brand-primary-hover transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Starting Advisor...' : 'Start Discovery Session'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-4 md:p-8">
            <DiscoveryChat
                sessionId={session.session.id}
                initialGreeting={session.greeting}
                onComplete={() => {
                    // Handle completion - e.g. show recommendation
                    console.log('Discovery complete!');
                }}
            />
        </div>
    );
}
