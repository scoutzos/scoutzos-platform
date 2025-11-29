import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  success,
  error,
  unauthorized,
  createRequestContext,
  validateBody,
  startDiscoverySchema,
  withRateLimit,
  ApiError,
  ErrorCodes,
} from '@/lib/api';

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

    // TODO: Implement session creation logic
    // 1. Check for existing active session
    // 2. If exists and not expired, return it
    // 3. Otherwise create new session
    // 4. Return session with initial greeting

    // Placeholder response
    const session = {
      id: crypto.randomUUID(),
      user_id: user.id,
      status: 'INITIAL',
      mode: 'discovery',
      entry_point: body.entry_point,
      conversation_history: [],
      partial_profile: {},
      clusters_complete: 0,
      ready_for_recommendation: false,
      message_count: 0,
      created_at: new Date().toISOString(),
      last_activity: new Date().toISOString(),
    };

    return success(
      {
        session,
        greeting: {
          message: "Hi! I'm your AI investment advisor. I'll help you discover your ideal investment strategy and create a personalized buy box. Let's start with understanding your goals - what's driving you to invest in real estate?",
          suggested_responses: [
            'I want to build passive income',
            'I want to build long-term wealth',
            'I want to replace my W-2 income',
            'I want tax benefits',
          ],
        },
      },
      ctx,
      201
    );
  } catch (err) {
    return error(err, ctx);
  }
}
