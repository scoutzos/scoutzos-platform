import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import OpenAI from 'openai';
import { RECOMMENDATION_SYSTEM_PROMPT } from '@/lib/prompts/discovery/recommendation';
import { SessionStateManager, type DiscoverySession } from '@/lib/services/discovery-session';
import {
    success,
    error,
    unauthorized,
    notFound,
    badRequest,
    createRequestContext,
    validateBody,
    recommendDiscoverySchema,
    withRateLimit,
} from '@/lib/api';
import { findMatchingDeals } from '@/lib/services/matcher';

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
        const body = await validateBody(request, recommendDiscoverySchema);

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

        const sessionManager = new SessionStateManager(sessionData as DiscoverySession);
        const session = sessionManager.getSession();

        // Check if ready (unless forced)
        if (!session.ready_for_recommendation && !body.force_recommendation) {
            return badRequest(ctx, 'Session not ready for recommendation');
        }

        // Prepare profile summary for AI
        const profileSummary = JSON.stringify(session.partial_profile, null, 2);

        // Call OpenAI
        if (!openai) {
            throw new Error('OpenAI not configured');
        }

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            max_tokens: 1500,
            temperature: 0.7,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: RECOMMENDATION_SYSTEM_PROMPT },
                {
                    role: 'user',
                    content: `Generate an investment strategy and buy box for this investor profile:\n\n${profileSummary}`
                }
            ]
        });

        const responseText = completion.choices[0]?.message?.content || '{}';
        let recommendation;

        try {
            recommendation = JSON.parse(responseText);
        } catch (parseError) {
            console.error('Failed to parse recommendation:', parseError);
            throw new Error('Failed to generate valid recommendation');
        }

        // Save recommendation to session
        await supabaseAdmin
            .from('discovery_sessions')
            .update({
                recommendation: recommendation,
                status: 'COMPLETED',
                completed_at: new Date().toISOString()
            })
            .eq('id', sessionId);

        // Create actual Buy Box record if requested (future step)
        // For now, we just return the recommendation data

        // Find matching deals
        const matches = await findMatchingDeals(recommendation.buy_box);

        return success(
            {
                recommendation,
                matches,
                profile: session.partial_profile
            },
            ctx
        );

    } catch (err) {
        return error(err, ctx);
    }
}
