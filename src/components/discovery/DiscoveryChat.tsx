'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { VoiceChat } from '@/components/ui/VoiceChat';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface DiscoveryChatProps {
    sessionId: string;
    initialGreeting?: {
        message: string;
        suggested_responses: string[];
    };
    onComplete?: () => void;
}

export default function DiscoveryChat({ sessionId, initialGreeting, onComplete }: DiscoveryChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [suggestedResponses, setSuggestedResponses] = useState<string[]>([]);
    const [progress, setProgress] = useState(0);
    const [isReady, setIsReady] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Initialize with greeting
    useEffect(() => {
        if (initialGreeting && messages.length === 0) {
            setMessages([
                {
                    id: 'greeting',
                    role: 'assistant',
                    content: initialGreeting.message,
                    timestamp: new Date()
                }
            ]);
            setSuggestedResponses(initialGreeting.suggested_responses || []);
        }
    }, [initialGreeting, messages.length]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (text: string) => {
        if (!text.trim() || isLoading) return;

        // Add user message immediately
        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setSuggestedResponses([]);
        setIsLoading(true);

        try {
            const response = await fetch(`/api/discovery/session/${sessionId}/message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: sessionId,
                    message: text
                })
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error.message);
            }

            // Add AI response
            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.data.message,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, aiMsg]);
            setSuggestedResponses(data.data.suggested_responses || []);
            setProgress(data.data.profile_completeness * 100);

            if (data.data.ready_for_recommendation) {
                setIsReady(true);
                // Automatically fetch recommendation when ready
                fetchRecommendation();
            }

        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchRecommendation = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/discovery/session/${sessionId}/recommend`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: sessionId })
            });
            const data = await response.json();

            if (data.data?.recommendation) {
                const rec = data.data.recommendation;

                // Add recommendation message
                const recMsg: Message = {
                    id: 'recommendation',
                    role: 'assistant',
                    content: `Based on our conversation, I recommend the **${rec.strategy_name}**. ${rec.explanation}`,
                    timestamp: new Date()
                };

                setMessages(prev => [...prev, recMsg]);

                // Add matches if available
                if (data.data.matches && data.data.matches.length > 0) {
                    const matchesHtml = data.data.matches.map((m: any) => `
                        <div class="mt-4 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                            <div class="font-bold text-brand-primary">${m.deal_data.address}</div>
                            <div class="text-xs text-gray-500">${m.deal_data.city}, ${m.deal_data.state}</div>
                            <div class="mt-2 text-sm font-semibold">$${m.deal_data.list_price.toLocaleString()}</div>
                            <div class="mt-1 text-xs text-green-600">Match Score: ${m.score}%</div>
                            <div class="mt-1 text-xs text-gray-600">${m.reasons.join(', ')}</div>
                            <a href="/deals/${m.deal_id}" class="block mt-2 text-center text-xs bg-brand-primary text-white py-1 rounded hover:bg-brand-primary-hover no-underline">View Deal</a>
                        </div>
                    `).join('');

                    const matchMsg: Message = {
                        id: 'matches',
                        role: 'assistant',
                        content: `I found ${data.data.matches.length} deals that match your new profile:<br/>${matchesHtml}`,
                        timestamp: new Date()
                    };

                    // Add small delay for natural feel
                    setTimeout(() => {
                        setMessages(prev => [...prev, matchMsg]);
                    }, 1000);
                }

                if (onComplete) onComplete();
            }
        } catch (err) {
            console.error('Failed to fetch recommendation:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[600px] bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Header / Progress */}
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-semibold text-gray-900">AI Investment Advisor</h3>
                    <p className="text-xs text-gray-500">Building your investor profile</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-brand-primary transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <span className="text-xs font-medium text-gray-600">{Math.round(progress)}%</span>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${msg.role === 'user'
                                ? 'bg-brand-primary text-white rounded-br-none'
                                : 'bg-gray-100 text-gray-800 rounded-bl-none'
                                }`}
                        >
                            <div dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-100 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-2">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Suggested Responses */}
            {suggestedResponses.length > 0 && !isLoading && !isReady && (
                <div className="px-4 py-2 flex flex-wrap gap-2">
                    {suggestedResponses.map((response, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleSendMessage(response)}
                            className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors border border-indigo-100"
                        >
                            {response}
                        </button>
                    ))}
                </div>
            )}

            {/* Input Area */}
            <div className="p-4 border-t border-gray-200 bg-white">
                {isReady ? (
                    <div className="text-center py-2">
                        <p className="text-sm text-green-600 font-medium">Session Complete! Analysis Generated.</p>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <VoiceChat
                            onTranscript={(text) => setInput(text)}
                            onResponse={(text) => {
                                // Optional: Auto-speak AI response
                            }}
                            className="flex-shrink-0"
                        />
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(input)}
                            placeholder="Type your answer..."
                            className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                            disabled={isLoading}
                        />
                        <button
                            onClick={() => handleSendMessage(input)}
                            disabled={!input.trim() || isLoading}
                            className="bg-brand-primary text-white p-2 rounded-full hover:bg-brand-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
