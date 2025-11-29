import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  success,
  error,
  unauthorized,
  notFound,
  createRequestContext,
  ApiError,
  ErrorCodes,
} from '@/lib/api';
import {
  calculateProfileCompleteness,
  hasMinimumProfile,
} from '@/lib/prompts/discovery/schemas';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const ctx = createRequestContext();

  try {
    const { id: sessionId } = await params;

    // Auth check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return unauthorized(ctx);
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sessionId)) {
      throw new ApiError(ErrorCodes.VALIDATION_ERROR, 'Invalid session ID format');
    }

    // Fetch session from database
    const { data: sessionData, error: sessionError } = await supabaseAdmin
      .from('discovery_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !sessionData) {
      return notFound(ctx, 'Session not found');
    }

    // Calculate profile completeness
    const profile = sessionData.partial_profile || {};
    const { completeness, clustersComplete, missingClusters } = calculateProfileCompleteness(profile);

    // Calculate conversation stats
    const conversationHistory = sessionData.conversation_history || [];
    const userMessages = conversationHistory.filter((m: { role: string }) => m.role === 'user').length;
    const assistantMessages = conversationHistory.filter((m: { role: string }) => m.role === 'assistant').length;

    // Calculate duration if started
    let durationMinutes = 0;
    if (sessionData.started_at) {
      const startTime = new Date(sessionData.started_at).getTime();
      const lastActivity = new Date(sessionData.last_activity || Date.now()).getTime();
      durationMinutes = Math.round((lastActivity - startTime) / (1000 * 60));
    }

    // Calculate expiry time based on status
    let expiresAt: string | null = null;
    if (['ACTIVE', 'IN_PROGRESS', 'IDLE', 'PAUSED'].includes(sessionData.status)) {
      const lastActivity = new Date(sessionData.last_activity || sessionData.created_at);
      // 12 hours for idle/paused, 24 hours for active
      const expiryHours = ['IDLE', 'PAUSED'].includes(sessionData.status) ? 12 : 24;
      expiresAt = new Date(lastActivity.getTime() + expiryHours * 60 * 60 * 1000).toISOString();
    }

    // Build cluster status with individual completion flags
    const clusterStatus = {
      motivation: {
        complete: !!profile.motivation?.primary_goal,
        data: profile.motivation || null,
      },
      capital: {
        complete: !!profile.capital?.cash_available,
        data: profile.capital || null,
      },
      credit_income: {
        complete: !!profile.credit_income?.credit_score_band,
        data: profile.credit_income || null,
      },
      activity: {
        complete: !!profile.activity?.time_available,
        data: profile.activity || null,
      },
      risk: {
        complete: !!profile.risk?.risk_comfort,
        data: profile.risk || null,
      },
      geography: {
        complete: !!profile.geography?.home_market,
        data: profile.geography || null,
      },
      timeline: {
        complete: !!profile.timeline?.first_deal_timeline,
        data: profile.timeline || null,
      },
    };

    return success(
      {
        session: {
          id: sessionData.id,
          status: sessionData.status,
          mode: sessionData.mode || 'discovery',
          entry_point: sessionData.entry_point,
          started_at: sessionData.started_at,
          last_activity: sessionData.last_activity,
          created_at: sessionData.created_at,
          expires_at: expiresAt,
          message_count: sessionData.message_count || 0,
        },
        profile: {
          clusters: clusterStatus,
          raw: profile,
        },
        profile_state: {
          clusters_complete: clustersComplete,
          total: 7,
          percentage: Math.round(completeness * 100),
          missing_clusters: missingClusters,
          ready_for_recommendation: sessionData.ready_for_recommendation || hasMinimumProfile(profile),
          minimum_met: hasMinimumProfile(profile),
        },
        conversation_summary: {
          total_messages: conversationHistory.length,
          user_messages: userMessages,
          ai_messages: assistantMessages,
          duration_minutes: durationMinutes,
        },
        conversation_history: conversationHistory,
        // Include buy box and profile IDs if session is completed
        outcomes: sessionData.status === 'COMPLETED'
          ? {
              buy_box_id: sessionData.buy_box_id,
              final_profile_id: sessionData.final_profile_id,
            }
          : null,
      },
      ctx
    );
  } catch (err) {
    return error(err, ctx);
  }
}
