import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  success,
  error,
  unauthorized,
  createRequestContext,
  withRateLimit,
  ApiError,
  ErrorCodes,
} from '@/lib/api';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const ctx = createRequestContext();

  try {
    const { id } = await params;

    // Auth check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return unauthorized(ctx);
    }

    // Rate limit check
    const rateLimitResponse = await withRateLimit(request, user.id, id);
    if (rateLimitResponse) return rateLimitResponse;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new ApiError(ErrorCodes.VALIDATION_ERROR, 'Invalid session ID format');
    }

    // TODO: Implement session resume logic
    // 1. Fetch session by ID
    // 2. Verify user owns this session
    // 3. Check if session can be resumed (not completed/expired)
    // 4. Update status to ACTIVE
    // 5. Return session with continuation message

    // Placeholder response
    return success(
      {
        session: {
          id,
          user_id: user.id,
          status: 'ACTIVE',
          mode: 'discovery',
          clusters_complete: 2,
          ready_for_recommendation: false,
          last_activity: new Date().toISOString(),
        },
        continuation: {
          message: "Welcome back! Let's continue where we left off. We were discussing your investment timeline. When are you hoping to close on your first property?",
          context: {
            last_cluster: 'capital',
            next_cluster: 'timeline',
          },
          suggested_responses: [
            'As soon as possible',
            'Within 3 months',
            'Within 6 months',
            'Just exploring for now',
          ],
        },
      },
      ctx
    );
  } catch (err) {
    return error(err, ctx);
  }
}
