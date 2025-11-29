/**
 * Discovery Session State Manager
 * Handles conversation state, history, and profile building
 */

import { InvestorProfile, calculateProfileCompleteness, getNextPriorityCluster } from '@/lib/prompts/discovery/schemas';
import { getQuestionForCluster } from '@/lib/prompts/discovery/questions';

export interface ConversationMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
    metadata?: {
        cluster_asked?: string;
        extracted_clusters?: string[];
        intent?: string;
    };
}

export interface DiscoverySession {
    id: string;
    user_id: string;
    status: 'INITIAL' | 'IN_PROGRESS' | 'READY_FOR_RECOMMENDATION' | 'COMPLETED';
    mode: 'discovery' | 'analysis';
    entry_point: string;
    conversation_history: ConversationMessage[];
    partial_profile: Partial<InvestorProfile>;
    clusters_complete: number;
    ready_for_recommendation: boolean;
    message_count: number;
    created_at: string;
    last_activity: string;
    recommendation?: any;
    last_asked_cluster?: string;
    education_given?: string[];
}

/**
 * Patterns that indicate user doesn't know or needs education
 */
const UNCERTAINTY_PATTERNS = [
    /i don'?t know/i,
    /not sure/i,
    /no idea/i,
    /what does that mean/i,
    /what is (a |an )?/i,
    /can you explain/i,
    /i'm confused/i,
    /what's the difference/i,
    /help me understand/i,
    /never heard of/i,
    /what should i/i,
];

/**
 * Education content for common investor questions
 */
export const EDUCATION_CONTENT: Record<string, { topic: string; explanation: string; simpler_question: string }> = {
    credit_score: {
        topic: 'Credit Scores',
        explanation: 'Your credit score (300-850) affects what loans you qualify for. Above 740 gets the best rates. 700+ is good. Below 660 limits options but doesn\'t mean you can\'t invest.',
        simpler_question: 'Would you say your credit is excellent, good, fair, or needs work?',
    },
    brrrr: {
        topic: 'BRRRR Strategy',
        explanation: 'BRRRR stands for Buy, Rehab, Rent, Refinance, Repeat. You buy a fixer-upper, renovate it, rent it out, refinance to pull your cash out, then use that cash to buy another property.',
        simpler_question: 'Are you interested in fixing up properties and keeping them as rentals?',
    },
    reserves: {
        topic: 'Cash Reserves',
        explanation: 'Reserves are money you keep liquid for emergencies—repairs, vacancies, unexpected costs. Most lenders want to see 3-6 months of payments in reserve.',
        simpler_question: 'After your down payment and closing costs, how much cash would you want to keep available for surprises?',
    },
    cap_rate: {
        topic: 'Cap Rate',
        explanation: 'Cap rate is the annual return on a property if you paid all cash. A 10% cap rate means a $100K property earns $10K/year after expenses. Higher cap rates usually mean higher risk areas.',
        simpler_question: 'Would you prefer a safer neighborhood with lower returns, or accept more risk for higher returns?',
    },
    debt_service: {
        topic: 'Debt Service',
        explanation: 'Debt service is your loan payment (principal + interest). If rents cover your mortgage, taxes, and insurance with money left over, that\'s positive cash flow.',
        simpler_question: 'Do you want properties that pay for themselves from day one, or are you okay covering some costs out of pocket?',
    },
    vacancy: {
        topic: 'Vacancy',
        explanation: 'Vacancy is when your property sits empty between tenants. Could be 2 weeks or 2 months. During that time, you still pay the mortgage. Investors typically budget 5-8% for vacancy.',
        simpler_question: 'If your property sat empty for a couple months, could you cover the payments without stress?',
    },
    appreciation: {
        topic: 'Appreciation vs Cash Flow',
        explanation: 'Appreciation is when property values go up over time. Cash flow is the money you pocket each month. Some markets give you one or the other—rarely both.',
        simpler_question: 'Would you rather have money in your pocket each month, or bet on the property being worth more later?',
    },
};

export class SessionStateManager {
    private session: DiscoverySession;

    constructor(session: DiscoverySession) {
        this.session = session;
    }

    /**
     * Add a message to conversation history with optional metadata
     */
    addMessage(
        role: 'user' | 'assistant',
        content: string,
        metadata?: ConversationMessage['metadata']
    ): void {
        this.session.conversation_history.push({
            role,
            content,
            timestamp: new Date().toISOString(),
            metadata,
        });
        this.session.message_count++;
        this.session.last_activity = new Date().toISOString();
    }

    /**
     * Track which cluster was just asked about
     */
    setLastAskedCluster(cluster: string): void {
        this.session.last_asked_cluster = cluster;
    }

    /**
     * Get the last cluster that was asked about
     */
    getLastAskedCluster(): string | undefined {
        return this.session.last_asked_cluster;
    }

    /**
     * Detect if user's message indicates uncertainty or need for education
     */
    detectUncertainty(message: string): {
        isUncertain: boolean;
        educationTopic?: string;
        pattern?: string;
    } {
        const lowerMessage = message.toLowerCase();

        // Check for uncertainty patterns
        for (const pattern of UNCERTAINTY_PATTERNS) {
            if (pattern.test(message)) {
                // Try to detect what topic they're asking about
                const educationTopic = this.detectEducationTopic(lowerMessage);
                return {
                    isUncertain: true,
                    educationTopic,
                    pattern: pattern.source,
                };
            }
        }

        return { isUncertain: false };
    }

    /**
     * Detect which education topic the user is asking about
     */
    private detectEducationTopic(message: string): string | undefined {
        const topicPatterns: Record<string, RegExp[]> = {
            credit_score: [/credit/i, /fico/i, /score/i],
            brrrr: [/brrrr/i, /refinance/i, /pull.*cash/i],
            reserves: [/reserve/i, /emergency/i, /set aside/i, /liquid/i],
            cap_rate: [/cap rate/i, /capitalization/i],
            debt_service: [/debt service/i, /dscr/i, /mortgage.*payment/i],
            vacancy: [/vacancy/i, /vacant/i, /empty/i, /no tenant/i],
            appreciation: [/appreciation/i, /value.*go.*up/i, /cash flow.*vs/i],
        };

        for (const [topic, patterns] of Object.entries(topicPatterns)) {
            if (patterns.some((p) => p.test(message))) {
                return topic;
            }
        }

        // If asking about the last cluster, map to education topic
        const lastCluster = this.session.last_asked_cluster;
        if (lastCluster === 'credit_income') return 'credit_score';
        if (lastCluster === 'risk') return 'cap_rate';
        if (lastCluster === 'capital') return 'reserves';

        return undefined;
    }

    /**
     * Get education content for a topic
     */
    getEducation(topic: string): typeof EDUCATION_CONTENT[string] | undefined {
        return EDUCATION_CONTENT[topic];
    }

    /**
     * Track that education was given for a topic
     */
    recordEducationGiven(topic: string): void {
        if (!this.session.education_given) {
            this.session.education_given = [];
        }
        if (!this.session.education_given.includes(topic)) {
            this.session.education_given.push(topic);
        }
    }

    /**
     * Check if education was already given for a topic
     */
    wasEducationGiven(topic: string): boolean {
        return this.session.education_given?.includes(topic) ?? false;
    }

    /**
     * Update investor profile with new extracted data
     */
    updateProfile(extractedData: Partial<InvestorProfile>): void {
        // Deep merge extracted data into partial profile
        this.session.partial_profile = this.mergeProfiles(
            this.session.partial_profile,
            extractedData
        );

        // Update clusters complete count
        const { clustersComplete } = calculateProfileCompleteness(this.session.partial_profile);
        this.session.clusters_complete = clustersComplete;
    }

    /**
     * Check if session is ready for recommendation
     */
    checkReadiness(): boolean {
        const { completeness } = calculateProfileCompleteness(this.session.partial_profile);

        // Minimum 3 clusters (motivation, capital, one other)
        const hasMotivation = !!this.session.partial_profile.motivation?.primary_goal;
        const hasCapital = !!this.session.partial_profile.capital?.cash_available;
        const hasOneMore = this.session.clusters_complete >= 3;

        const isReady = hasMotivation && hasCapital && hasOneMore;

        if (isReady) {
            this.session.status = 'READY_FOR_RECOMMENDATION';
            this.session.ready_for_recommendation = true;
        }

        return isReady;
    }

    /**
     * Get next cluster to ask about
     */
    getNextCluster(): string | null {
        return getNextPriorityCluster(this.session.partial_profile);
    }

    /**
     * Format conversation history for AI context
     */
    formatHistoryForAI(maxMessages: number = 10): ConversationMessage[] {
        // Get recent messages
        const recent = this.session.conversation_history.slice(-maxMessages);

        // Always include first message if not in recent
        if (this.session.conversation_history.length > maxMessages) {
            return [this.session.conversation_history[0], ...recent];
        }

        return recent;
    }

    /**
     * Create state summary for AI context
     */
    createStateSummary(): string {
        const { clustersComplete, missingClusters } = calculateProfileCompleteness(
            this.session.partial_profile
        );

        const profile = this.session.partial_profile;
        const parts: string[] = [];

        if (profile.motivation?.primary_goal) {
            parts.push(`Goal: ${profile.motivation.primary_goal}`);
        }
        if (profile.capital?.cash_available) {
            parts.push(`Capital: $${profile.capital.cash_available.toLocaleString()}`);
            if (profile.capital.reserve_target) {
                parts.push(`(keeping $${profile.capital.reserve_target.toLocaleString()} in reserve)`);
            }
        }
        if (profile.credit_income?.credit_score_band) {
            parts.push(`Credit: ${profile.credit_income.credit_score_band}`);
        }
        if (profile.activity?.renovation_comfort) {
            parts.push(`Activity: ${profile.activity.renovation_comfort}`);
        }
        if (profile.risk?.risk_comfort) {
            parts.push(`Risk: ${profile.risk.risk_comfort}`);
        }
        if (profile.geography?.home_market) {
            parts.push(`Location: ${profile.geography.home_market}`);
        }
        if (profile.timeline?.capital_return_need) {
            parts.push(`Timeline: ${profile.timeline.capital_return_need}`);
        }

        return `INVESTOR SUMMARY: ${parts.join(' | ')}
CLUSTERS COMPLETE: ${clustersComplete}/7
MISSING: ${missingClusters.join(', ')}`;
    }

    /**
     * Get a contextual question for a cluster
     */
    getContextualQuestion(cluster: string): string {
        return getQuestionForCluster(cluster, {
            profile: this.session.partial_profile,
            entryPoint: this.session.entry_point,
        });
    }

    /**
     * Analyze user message for compound answers (multiple data points)
     */
    analyzeCompoundAnswer(message: string): {
        hasMultipleTopics: boolean;
        detectedTopics: string[];
        signals: Record<string, string[]>;
    } {
        const signals: Record<string, string[]> = {
            motivation: [],
            capital: [],
            credit_income: [],
            activity: [],
            risk: [],
            geography: [],
            timeline: [],
        };

        const lowerMessage = message.toLowerCase();

        // Motivation signals
        if (/wealth|long[- ]?term|grow|equity|appreciate/i.test(message)) {
            signals.motivation.push('wealth_building');
        }
        if (/income|cash\s*flow|monthly|passive|rent/i.test(message)) {
            signals.motivation.push('monthly_income');
        }
        if (/flip|quick|profit|sell|arv/i.test(message)) {
            signals.motivation.push('quick_profit');
        }
        if (/tax|deduct|depreci|write[- ]?off/i.test(message)) {
            signals.motivation.push('tax_advantages');
        }

        // Capital signals
        const dollarMatch = message.match(/\$[\d,]+(?:k|K|000)?|\d+(?:k|K)\s*(?:dollars?)?|(?:hundred|fifty)\s*thousand/i);
        if (dollarMatch) {
            signals.capital.push(dollarMatch[0]);
        }

        // Credit signals
        if (/7[0-4]\d|above\s*7[0-4]0|excellent\s*credit/i.test(message)) {
            signals.credit_income.push('700_plus');
        }
        if (/6[0-6]\d|fair|okay\s*credit/i.test(message)) {
            signals.credit_income.push('600s');
        }
        if (/below\s*6[0-5]|bad|poor\s*credit/i.test(message)) {
            signals.credit_income.push('below_620');
        }

        // Activity signals
        if (/full[- ]?time|all\s*day|quit\s*my\s*job/i.test(message)) {
            signals.activity.push('full_time');
        }
        if (/part[- ]?time|weekends?|after\s*work|side/i.test(message)) {
            signals.activity.push('part_time');
        }
        if (/hands[- ]?off|passive|manage|hire|turnkey/i.test(message)) {
            signals.activity.push('passive');
        }

        // Risk signals
        if (/conservative|safe|stable|low[- ]?risk|a[- ]?class/i.test(message)) {
            signals.risk.push('conservative');
        }
        if (/aggressive|high[- ]?risk|c[- ]?class|emerging|up[- ]?and[- ]?coming/i.test(message)) {
            signals.risk.push('aggressive');
        }

        // Geography signals
        if (/local|near\s*me|my\s*area|close\s*to\s*home|within.*miles?/i.test(message)) {
            signals.geography.push('local');
        }
        if (/anywhere|national|remote|out[- ]?of[- ]?state/i.test(message)) {
            signals.geography.push('national');
        }
        // City/state detection
        const locationMatch = message.match(/(?:in|near|around)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?(?:,\s*[A-Z]{2})?)/);
        if (locationMatch) {
            signals.geography.push(locationMatch[1]);
        }

        // Timeline signals
        if (/now|asap|immediately|ready\s*to|this\s*month/i.test(message)) {
            signals.timeline.push('asap');
        }
        if (/\d+\s*months?|soon|few\s*months/i.test(message)) {
            signals.timeline.push('months');
        }
        if (/year|learning|research|not\s*ready/i.test(message)) {
            signals.timeline.push('longer');
        }

        // Count topics with signals
        const detectedTopics = Object.entries(signals)
            .filter(([, values]) => values.length > 0)
            .map(([topic]) => topic);

        return {
            hasMultipleTopics: detectedTopics.length > 1,
            detectedTopics,
            signals,
        };
    }

    /**
     * Build developer message for AI context (enhanced version)
     */
    buildDeveloperMessage(userMessage?: string): string {
        const nextCluster = this.getNextCluster();
        const summary = this.createStateSummary();
        const { clustersComplete, missingClusters } = calculateProfileCompleteness(
            this.session.partial_profile
        );

        // Get contextual question for next cluster
        const suggestedQuestion = nextCluster
            ? this.getContextualQuestion(nextCluster)
            : null;

        // Analyze user message for compound answers if provided
        let compoundAnalysis = '';
        let uncertaintyNote = '';
        if (userMessage) {
            const compound = this.analyzeCompoundAnswer(userMessage);
            if (compound.hasMultipleTopics) {
                compoundAnalysis = `
COMPOUND ANSWER DETECTED:
The investor mentioned topics related to: ${compound.detectedTopics.join(', ')}
Extract ALL data points from their message. Acknowledge each piece of information briefly before asking about the next unknown topic.`;
            }

            const uncertainty = this.detectUncertainty(userMessage);
            if (uncertainty.isUncertain) {
                const education = uncertainty.educationTopic
                    ? this.getEducation(uncertainty.educationTopic)
                    : null;
                const alreadyExplained = uncertainty.educationTopic
                    ? this.wasEducationGiven(uncertainty.educationTopic)
                    : false;

                uncertaintyNote = `
UNCERTAINTY DETECTED:
The investor seems unsure or confused.${education ? `
Topic: ${education.topic}
${alreadyExplained ? 'You already explained this - try a different angle or simpler terms.' : `Explanation to give: ${education.explanation}`}
Simpler question to ask: ${education.simpler_question}` : `
Provide a brief, plain-English explanation and offer a simpler version of the question.`}`;
            }
        }

        // Build education history note
        const educationNote = this.session.education_given?.length
            ? `\nEducation already provided: ${this.session.education_given.join(', ')}`
            : '';

        return `<state>
SESSION CONTEXT:
- Session ID: ${this.session.id}
- Messages exchanged: ${this.session.message_count}
- Entry point: ${this.session.entry_point}
- Last cluster asked: ${this.session.last_asked_cluster || 'none'}
${educationNote}

${summary}

NEXT PRIORITY: ${nextCluster || 'Profile complete - ready for recommendation'}
${suggestedQuestion ? `SUGGESTED QUESTION: "${suggestedQuestion}"` : ''}

READINESS STATUS:
- Clusters complete: ${clustersComplete}/7
- Minimum met for recommendation: ${this.session.ready_for_recommendation}
- Missing: ${missingClusters.join(', ') || 'none'}
${compoundAnalysis}${uncertaintyNote}

INSTRUCTIONS:
1. If multiple data points detected, extract ALL of them and acknowledge briefly
2. If investor is confused, explain simply before re-asking
3. Ask about ${nextCluster || 'nothing - offer recommendation'} next unless conversation flow suggests otherwise
4. Keep responses to 2-4 sentences unless explaining a concept
5. After each response, track which cluster you're asking about in next_question_cluster
</state>`;
    }

    /**
     * Get the session data
     */
    getSession(): DiscoverySession {
        return this.session;
    }

    /**
     * Deep merge two profile objects
     */
    private mergeProfiles(
        existing: Partial<InvestorProfile>,
        updates: Partial<InvestorProfile>
    ): Partial<InvestorProfile> {
        const merged = { ...existing };

        for (const [key, value] of Object.entries(updates)) {
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                merged[key as keyof InvestorProfile] = {
                    ...(merged[key as keyof InvestorProfile] || {}),
                    ...value
                } as any;
            } else if (value !== null && value !== undefined) {
                merged[key as keyof InvestorProfile] = value as any;
            }
        }

        return merged;
    }
}

/**
 * Create a new discovery session
 */
export function createNewSession(userId: string, entryPoint: string = 'cold_start'): DiscoverySession {
    return {
        id: crypto.randomUUID(),
        user_id: userId,
        status: 'INITIAL',
        mode: 'discovery',
        entry_point: entryPoint,
        conversation_history: [],
        partial_profile: {},
        clusters_complete: 0,
        ready_for_recommendation: false,
        message_count: 0,
        created_at: new Date().toISOString(),
        last_activity: new Date().toISOString()
    };
}
