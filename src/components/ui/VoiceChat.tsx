'use client';

import { useState, useEffect, useRef } from 'react';

interface VoiceChatProps {
    onTranscript: (text: string) => void;
    onResponse?: (text: string) => void;
    autoSpeak?: boolean;
    className?: string;
}

export function VoiceChat({ onTranscript, onResponse, autoSpeak = true, className = '' }: VoiceChatProps) {
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isSupported, setIsSupported] = useState(false);
    const recognitionRef = useRef<any>(null);
    const synthRef = useRef<SpeechSynthesis | null>(null);

    useEffect(() => {
        // Check for browser support
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            setIsSupported(!!SpeechRecognition && !!window.speechSynthesis);

            if (SpeechRecognition) {
                recognitionRef.current = new SpeechRecognition();
                recognitionRef.current.continuous = false;
                recognitionRef.current.interimResults = true;
                recognitionRef.current.lang = 'en-US';

                recognitionRef.current.onresult = (event: any) => {
                    const current = event.resultIndex;
                    const transcriptText = event.results[current][0].transcript;
                    setTranscript(transcriptText);

                    if (event.results[current].isFinal) {
                        onTranscript(transcriptText);
                        setTranscript('');
                    }
                };

                recognitionRef.current.onerror = (event: any) => {
                    console.error('Speech recognition error:', event.error);
                    setIsListening(false);
                };

                recognitionRef.current.onend = () => {
                    setIsListening(false);
                };
            }

            synthRef.current = window.speechSynthesis;
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            if (synthRef.current) {
                synthRef.current.cancel();
            }
        };
    }, [onTranscript]);

    const startListening = () => {
        if (recognitionRef.current && !isListening) {
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const stopListening = () => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    };

    const speak = (text: string) => {
        if (synthRef.current) {
            // Cancel any ongoing speech
            synthRef.current.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;

            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = () => setIsSpeaking(false);

            synthRef.current.speak(utterance);
        }
    };

    const stopSpeaking = () => {
        if (synthRef.current) {
            synthRef.current.cancel();
            setIsSpeaking(false);
        }
    };

    // Auto-speak responses
    useEffect(() => {
        if (onResponse && autoSpeak) {
            // This would be called when AI responds
            // For now, it's just a placeholder
        }
    }, [onResponse, autoSpeak]);

    if (!isSupported) {
        return (
            <div className={`text-sm text-gray-500 ${className}`}>
                Voice features not supported in this browser. Try Chrome or Edge.
            </div>
        );
    }

    return (
        <div className={`flex items-center gap-3 ${className}`}>
            {/* Microphone Button */}
            <button
                onClick={isListening ? stopListening : startListening}
                className={`relative inline-flex items-center justify-center w-12 h-12 rounded-full transition-all ${isListening
                        ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                        : 'bg-brand-primary hover:bg-brand-primary-hover'
                    } text-white shadow-lg hover:shadow-xl`}
                title={isListening ? 'Stop listening' : 'Start voice input'}
            >
                {isListening ? (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                    </svg>
                ) : (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                )}
            </button>

            {/* Speaker Button */}
            {isSpeaking && (
                <button
                    onClick={stopSpeaking}
                    className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 transition-all"
                    title="Stop speaking"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                    </svg>
                </button>
            )}

            {/* Live Transcript */}
            {transcript && (
                <div className="flex-1 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
                    {transcript}
                </div>
            )}

            {/* Status Indicator */}
            {isListening && !transcript && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    Listening...
                </div>
            )}
        </div>
    );
}

// Hook for easy integration
export function useVoiceChat() {
    const [transcript, setTranscript] = useState('');
    const voiceRef = useRef<{ speak: (text: string) => void } | null>(null);

    const speak = (text: string) => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            const utterance = new SpeechSynthesisUtterance(text);
            window.speechSynthesis.speak(utterance);
        }
    };

    return {
        transcript,
        setTranscript,
        speak,
    };
}
