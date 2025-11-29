import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  success,
  error,
  unauthorized,
  notFound,
  createRequestContext,
  validateBody,
  ApiError,
  ErrorCodes,
} from '@/lib/api';
import { z } from 'zod';
import {
  getSessionForUser,
  updateSession,
  transitionState,
  SessionStatus,
  TransitionTrigger,
  SessionNotFoundError,
  SessionAccessDeniedError,
  isResumableStatus,
} from '@/lib/session';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Validation schema for auto-save
const autoSaveSchema = z.object({
  save_trigger: z.enum(['message', 'extraction', 'idle', 'blur', 'periodic', 'complete', 'error']),
  conversation: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
        timestamp: z.string(),
        cluster: z.string().optional(),
        extracted_data: z.record(z.unknown()).optional(),
      })
    )
    .optional(),
  profile: z.record(z.unknown()).optional(),
  ui_state: z
    .object({
      scroll_position: z.number().optional(),
      input_draft: z.string().optional(),
      pending_action: z.string().nullable().optional(),
      expanded_sections: z.array(z.string()).optional(),
    })
    .optional(),
});

export async function POST(request: NextRequest, { params }: RouteParams) {
  const ctx = createRequestContext();

  try {
    const { id: sessionId } = await params;

    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return unauthorized(ctx);
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sessionId)) {
      throw new ApiError(ErrorCodes.VALIDATION_ERROR, 'Invalid session ID format');
    }

    // Validate request body
    const body = await validateBody(request, autoSaveSchema);

    // Get session and verify ownership
    let session;
    try {
      session = await getSessionForUser(sessionId, user.id);
    } catch (err) {
      if (err instanceof SessionNotFoundError) {
        return notFound('Session', ctx);
      }
      if (err instanceof SessionAccessDeniedError) {
        return unauthorized(ctx);
      }
      throw err;
    }

    // Check if session can be updated
    if (!isResumableStatus(session.status as SessionStatus)) {
      throw new ApiError(
        ErrorCodes.INVALID_STATE,
        `Cannot save to session in ${session.status} state`
      );
    }

    // Build update payload
    const updates: Record<string, unknown> = {};

    if (body.conversation) {
      updates.conversation_history = body.conversation;
      updates.message_count = body.conversation.length;

      // Update last messages
      const userMessages = body.conversation.filter((m) => m.role === 'user');
      const assistantMessages = body.conversation.filter((m) => m.role === 'assistant');

      if (userMessages.length > 0) {
        updates.last_user_message = userMessages[userMessages.length - 1].content;
      }
      if (assistantMessages.length > 0) {
        updates.last_assistant_message = assistantMessages[assistantMessages.length - 1].content;
      }
    }

    if (body.profile) {
      // Merge with existing partial profile
      updates.partial_profile = {
        ...session.partial_profile,
        ...body.profile,
      };

      // Calculate clusters complete (count non-empty top-level keys)
      const profileKeys = [
        'motivation',
        'capital',
        'credit_income',
        'activity',
        'risk',
        'geography',
        'timeline',
      ];
      const mergedProfile = updates.partial_profile as Record<string, unknown>;
      const clustersComplete = profileKeys.filter(
        (key) =>
          mergedProfile[key] &&
          typeof mergedProfile[key] === 'object' &&
          Object.keys(mergedProfile[key] as object).length > 0
      ).length;
      updates.clusters_complete = clustersComplete;
    }

    if (body.ui_state) {
      updates.ui_state = {
        ...session.ui_state,
        ...body.ui_state,
      };
    }

    // Handle state transitions based on save trigger
    let updatedSession = session;

    if (body.save_trigger === 'message' && session.status === SessionStatus.INITIAL) {
      // First message - transition to ACTIVE
      updatedSession = await transitionState(
        sessionId,
        SessionStatus.ACTIVE,
        TransitionTrigger.FIRST_RESPONSE,
        { save_trigger: body.save_trigger }
      );
    } else if (
      body.save_trigger === 'message' &&
      [SessionStatus.IDLE, SessionStatus.PAUSED].includes(session.status as SessionStatus)
    ) {
      // User returned - transition to ACTIVE
      updatedSession = await transitionState(
        sessionId,
        SessionStatus.ACTIVE,
        TransitionTrigger.USER_RESUME,
        { save_trigger: body.save_trigger }
      );
    } else if (body.save_trigger === 'blur' && session.status === SessionStatus.ACTIVE) {
      // User left - transition to PAUSED
      updatedSession = await transitionState(
        sessionId,
        SessionStatus.PAUSED,
        TransitionTrigger.USER_PAUSE,
        { save_trigger: body.save_trigger }
      );
    } else if (body.save_trigger === 'complete' && session.status === SessionStatus.ACTIVE) {
      // Profile complete - transition to COMPLETED
      updatedSession = await transitionState(
        sessionId,
        SessionStatus.COMPLETED,
        TransitionTrigger.PROFILE_COMPLETE,
        { save_trigger: body.save_trigger }
      );
    }

    // Apply other updates
    if (Object.keys(updates).length > 0) {
      updatedSession = await updateSession(sessionId, updates);
    }

    return success(
      {
        session_id: updatedSession.id,
        status: updatedSession.status,
        last_activity: updatedSession.last_activity,
        saved: true,
        trigger: body.save_trigger,
      },
      ctx
    );
  } catch (err) {
    return error(err, ctx);
  }
}
