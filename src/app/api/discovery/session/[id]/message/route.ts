import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import OpenAI from 'openai';
import { DISCOVERY_SYSTEM_PROMPT } from '@/lib/prompts/discovery/system';
import { validateDiscoveryResponse, type DiscoveryModeResponse } from '@/lib/prompts/discovery/schemas';
import { SessionStateManager, type DiscoverySession } from '@/lib/services/discovery-session';
import { getQuestionForCluster } from '@/lib/prompts/discovery/questions';
import {
    success,
    error,
    unauthorized,
    notFound,
    createRequestContext,
    validateBody,
    respondDiscoverySchema,
    withRateLimit,
} from '@/lib/api';

// Initialize OpenAI
const openai = process.env.OPENAI_API_KEY
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const ctx = createRequestContext();

    try {
        const { id: sessionId } = await params;

        // Auth check
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return unauthorized(ctx);
        }

        // Rate limit check
        const rateLimitResponse = await withRateLimit(request, user.id);
        if (rateLimitResponse) return rateLimitResponse;

        // Validate request body
        const body = await validateBody(request, respondDiscoverySchema);

        // Fetch session
        const { data: sessionData, error: sessionError } = await supabaseAdmin
            .from('discovery_sessions')
            .select('*')
            .eq('id', sessionId)
            .eq('user_id', user.id)
            .single();

        if (sessionError || !sessionData) {
            return notFound(ctx, 'Session not found');
        }

        // Initialize state manager
        const sessionManager = new SessionStateManager(sessionData as DiscoverySession);

        // Add user message
        sessionManager.addMessage('user', body.message);

        // Prepare AI context
        const history = sessionManager.formatHistoryForAI();
        const developerMessage = sessionManager.buildDeveloperMessage();

        // Call OpenAI
        if (!openai) {
            throw new Error('OpenAI not configured');
        }

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            max_tokens: 1000,
            temperature: 0.7,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: DISCOVERY_SYSTEM_PROMPT },
                { role: 'system', content: developerMessage },
                ...history.map(msg => ({
                    role: msg.role as 'user' | 'assistant',
                    content: msg.content
                }))
            ]
        });

        const responseText = completion.choices[0]?.message?.content || '{}';
        let aiResponse: DiscoveryModeResponse;

        try {
            aiResponse = JSON.parse(responseText);
        } catch (parseError) {
            console.error('Failed to parse AI response:', parseError);
            // Fallback response
            aiResponse = {
                message: "I'm having trouble processing that. Could you rephrase?",
                extracted_data: {},
                next_question_cluster: null,
                ready_for_recommendation: false,
                detected_intent: 'continue_discovery',
                confidence: 0,
                suggested_responses: []
            };
        }

        // Validate response
        const validation = validateDiscoveryResponse(aiResponse);
        if (!validation.valid) {
            console.warn('AI response validation failed:', validation.errors);
            // In a production system, we might retry here
        }

        // Update session state
        sessionManager.addMessage('assistant', aiResponse.message);

        if (aiResponse.extracted_data) {
            sessionManager.updateProfile(aiResponse.extracted_data);
        }

        // Check readiness
        const isReady = sessionManager.checkReadiness();

        // Save updated session
        const updatedSession = sessionManager.getSession();

        await supabaseAdmin
            .from('discovery_sessions')
            .update({
                conversation_history: updatedSession.conversation_history,
                partial_profile: updatedSession.partial_profile,
                clusters_complete: updatedSession.clusters_complete,
                ready_for_recommendation: updatedSession.ready_for_recommendation,
                message_count: updatedSession.message_count,
                last_activity: updatedSession.last_activity,
                status: isReady ? 'READY_FOR_RECOMMENDATION' : 'IN_PROGRESS'
            })
            .eq('id', sessionId);

        return success(
            {
                message: aiResponse.message,
                suggested_responses: aiResponse.suggested_responses,
                clusters_complete: updatedSession.clusters_complete,
                ready_for_recommendation: isReady,
                profile_completeness: updatedSession.clusters_complete / 7
            },
            ctx
        );

    } catch (err) {
        return error(err, ctx);
    }
}
