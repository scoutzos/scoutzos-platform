import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import OpenAI from 'openai';
import { DISCOVERY_SYSTEM_PROMPT } from '@/lib/prompts/discovery/system';
import { validateDiscoveryResponse, type DiscoveryModeResponse } from '@/lib/prompts/discovery/schemas';
import { createNewSession, SessionStateManager } from '@/lib/services/discovery-session';
import {
  success,
  error,
  unauthorized,
  createRequestContext,
  validateBody,
  startDiscoverySchema,
  withRateLimit,
} from '@/lib/api';

// Initialize OpenAI if available
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export async function POST(request: NextRequest) {
  const ctx = createRequestContext();

  try {
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
    const body = await validateBody(request, startDiscoverySchema);

    // Check for existing active session
    const { data: existingSession } = await supabaseAdmin
      .from('discovery_sessions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['INITIAL', 'IN_PROGRESS', 'READY_FOR_RECOMMENDATION'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existingSession && !body.force_new) {
      // Return existing session
      return success(
        {
          session: existingSession,
          greeting: {
            message: "Welcome back! Let's continue where we left off. What else would you like to tell me about your investment goals?",
            suggested_responses: [
              'Let me start over',
              'Continue from where we were',
              'I want to analyze a specific deal'
            ]
          },
          resumed: true
        },
        ctx
      );
    }

    // Create new session
    const session = createNewSession(user.id, body.entry_point || 'cold_start');

    // Generate initial greeting with AI
    let greeting = {
      message: "Hi! I'm your AI investment advisor. I'll help you discover your ideal investment strategy and create a personalized buy box. Let's start with understanding your goals - what's driving you to invest in real estate?",
      suggested_responses: [
        'I want to build passive income',
        'I want to build long-term wealth',
        'I want to replace my W-2 income',
        'I want tax benefits',
      ],
    };

    if (openai) {
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          max_tokens: 500,
          temperature: 0.8,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: DISCOVERY_SYSTEM_PROMPT },
            {
              role: 'user',
              content: `This is a new investor starting their discovery session. Entry point: ${body.entry_point}. Generate a warm, engaging initial greeting that asks about their primary motivation for investing. Include 4 suggested responses.`
            }
          ]
        });

        const aiResponse: DiscoveryModeResponse = JSON.parse(
          completion.choices[0]?.message?.content || '{}'
        );

        if (aiResponse.message && aiResponse.suggested_responses) {
          greeting = {
            message: aiResponse.message,
            suggested_responses: aiResponse.suggested_responses
          };
        }
      } catch (aiError) {
        console.error('AI greeting generation failed:', aiError);
        // Use default greeting
      }
    }

    // Save session to database
    try {
      await supabaseAdmin.from('discovery_sessions').insert({
        id: session.id,
        user_id: session.user_id,
        status: session.status,
        mode: session.mode,
        entry_point: session.entry_point,
        conversation_history: session.conversation_history,
        partial_profile: session.partial_profile,
        clusters_complete: session.clusters_complete,
        ready_for_recommendation: session.ready_for_recommendation,
        message_count: session.message_count,
        created_at: session.created_at,
        last_activity: session.last_activity
      });
    } catch (dbError) {
      console.warn('Could not save session to database:', dbError);
      // Continue anyway - session is in memory
    }

    return success(
      {
        session,
        greeting,
        resumed: false
      },
      ctx,
      201
    );
  } catch (err) {
    return error(err, ctx);
  }
}
