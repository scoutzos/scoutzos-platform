/**
 * Discovery Session State Manager
 * Handles conversation state, history, and profile building
 */

import { InvestorProfile, calculateProfileCompleteness, getNextPriorityCluster } from '@/lib/prompts/discovery/schemas';

export interface ConversationMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
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
}

export class SessionStateManager {
    private session: DiscoverySession;

    constructor(session: DiscoverySession) {
        this.session = session;
    }

    /**
     * Add a message to conversation history
     */
    addMessage(role: 'user' | 'assistant', content: string): void {
        this.session.conversation_history.push({
            role,
            content,
            timestamp: new Date().toISOString()
        });
        this.session.message_count++;
        this.session.last_activity = new Date().toISOString();
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
     * Build developer message for AI context
     */
    buildDeveloperMessage(): string {
        const nextCluster = this.getNextCluster();
        const summary = this.createStateSummary();

        return `<state>
SESSION INFORMATION:
- Session ID: ${this.session.id}
- Started: ${this.session.created_at}
- Messages exchanged: ${this.session.message_count}
- Entry point: ${this.session.entry_point}

${summary}

PRIORITY CLUSTER TO ASK NEXT: ${nextCluster || 'None - profile complete'}

READY FOR RECOMMENDATION: ${this.session.ready_for_recommendation}

SPECIAL INSTRUCTIONS:
Based on the current state above, continue the conversation naturally. Ask about the PRIORITY CLUSTER unless the investor's message changes the topic.
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
