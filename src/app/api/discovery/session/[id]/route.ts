import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  success,
  error,
  unauthorized,
  notFound,
  createRequestContext,
  ApiError,
  ErrorCodes,
} from '@/lib/api';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const ctx = createRequestContext();

  try {
    const { id } = await params;

    // Auth check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return unauthorized(ctx);
    }

    // TODO: Implement session fetch logic
    // 1. Fetch session by ID
    // 2. Verify user owns this session
    // 3. Return session data with conversation history

    // Placeholder - check if valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new ApiError(ErrorCodes.VALIDATION_ERROR, 'Invalid session ID format');
    }

    // Placeholder response
    return success(
      {
        session: {
          id,
          user_id: user.id,
          status: 'ACTIVE',
          mode: 'discovery',
          entry_point: 'sidebar',
          conversation_history: [
            {
              role: 'assistant',
              content: "Hi! I'm your AI investment advisor...",
              timestamp: new Date().toISOString(),
            },
          ],
          partial_profile: {},
          clusters_complete: 0,
          ready_for_recommendation: false,
          message_count: 0,
          created_at: new Date().toISOString(),
          last_activity: new Date().toISOString(),
        },
      },
      ctx
    );
  } catch (err) {
    return error(err, ctx);
  }
}
