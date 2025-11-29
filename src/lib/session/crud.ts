/**
 * Session CRUD Operations
 * Database operations for discovery sessions
 */

import { createClient } from '@/lib/supabase/server';
import {
  SessionStatus,
  TransitionTrigger,
  isValidTransition,
  InvalidTransitionError,
  getTimestampFieldForStatus,
} from './state-machine';
import type {
  DiscoverySession,
  CreateSessionParams,
  UpdateSessionParams,
  SessionHistoryEntry,
  SessionSummary,
} from './types';

// Error types
export class SessionNotFoundError extends Error {
  constructor(sessionId: string) {
    super(`Session not found: ${sessionId}`);
    this.name = 'SessionNotFoundError';
  }
}

export class SessionAccessDeniedError extends Error {
  constructor(sessionId: string) {
    super(`Access denied to session: ${sessionId}`);
    this.name = 'SessionAccessDeniedError';
  }
}

/**
 * Create a new discovery session
 */
export async function createSession(params: CreateSessionParams): Promise<DiscoverySession> {
  const supabase = await createClient();

  const sessionData = {
    user_id: params.user_id,
    status: SessionStatus.INITIAL,
    mode: params.mode || 'discovery',
    entry_point: params.entry_point || 'sidebar',
    conversation_history: params.initial_message
      ? [
          {
            role: 'user',
            content: params.initial_message,
            timestamp: new Date().toISOString(),
          },
        ]
      : [],
    partial_profile: {},
    clusters_complete: 0,
    ready_for_recommendation: false,
    message_count: params.initial_message ? 1 : 0,
    last_user_message: params.initial_message || null,
    ui_state: {},
    client_info: params.client_info || {},
    last_activity: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('discovery_sessions')
    .insert(sessionData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create session: ${error.message}`);
  }

  // Log the initial creation
  await logSessionHistory(data.id, {
    previous_status: undefined,
    new_status: SessionStatus.INITIAL,
    trigger: TransitionTrigger.FIRST_RESPONSE,
    metadata: { entry_point: params.entry_point },
  });

  return data as DiscoverySession;
}

/**
 * Get a session by ID
 */
export async function getSession(sessionId: string): Promise<DiscoverySession> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('discovery_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new SessionNotFoundError(sessionId);
    }
    throw new Error(`Failed to get session: ${error.message}`);
  }

  return data as DiscoverySession;
}

/**
 * Get a session with ownership verification
 */
export async function getSessionForUser(
  sessionId: string,
  userId: string
): Promise<DiscoverySession> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('discovery_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new SessionNotFoundError(sessionId);
    }
    throw new Error(`Failed to get session: ${error.message}`);
  }

  if (!data) {
    throw new SessionAccessDeniedError(sessionId);
  }

  return data as DiscoverySession;
}

/**
 * Update a session
 */
export async function updateSession(
  sessionId: string,
  updates: UpdateSessionParams
): Promise<DiscoverySession> {
  const supabase = await createClient();

  // Always update last_activity
  const updateData: Record<string, unknown> = {
    ...updates,
    last_activity: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('discovery_sessions')
    .update(updateData)
    .eq('id', sessionId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new SessionNotFoundError(sessionId);
    }
    throw new Error(`Failed to update session: ${error.message}`);
  }

  return data as DiscoverySession;
}

/**
 * Transition session state with validation
 */
export async function transitionState(
  sessionId: string,
  newStatus: SessionStatus,
  trigger: TransitionTrigger,
  metadata?: Record<string, unknown>
): Promise<DiscoverySession> {
  const supabase = await createClient();

  // Get current session
  const session = await getSession(sessionId);
  const currentStatus = session.status as SessionStatus;

  // Validate transition
  if (!isValidTransition(currentStatus, newStatus, trigger)) {
    throw new InvalidTransitionError(currentStatus, newStatus, trigger);
  }

  // Build update data
  const updateData: Record<string, unknown> = {
    status: newStatus,
    last_activity: new Date().toISOString(),
  };

  // Set appropriate timestamp field
  const timestampField = getTimestampFieldForStatus(newStatus);
  if (timestampField) {
    updateData[timestampField] = new Date().toISOString();
  }

  // Clear idle_since if transitioning to ACTIVE
  if (newStatus === SessionStatus.ACTIVE) {
    updateData.idle_since = null;
  }

  // Set the status trigger for the database trigger to pick up
  // (Used by the log_session_status_change trigger function)
  await supabase.rpc('set_config', {
    setting: 'app.status_trigger',
    value: trigger,
    is_local: true,
  }).catch(() => {
    // Ignore if RPC doesn't exist - we'll log manually
  });

  // Update session
  const { data, error } = await supabase
    .from('discovery_sessions')
    .update(updateData)
    .eq('id', sessionId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to transition session state: ${error.message}`);
  }

  // Log to session history (manual fallback if trigger doesn't fire)
  await logSessionHistory(sessionId, {
    previous_status: currentStatus,
    new_status: newStatus,
    trigger,
    metadata: {
      ...metadata,
      duration_in_previous_ms: new Date().getTime() - new Date(session.last_activity).getTime(),
    },
  });

  return data as DiscoverySession;
}

/**
 * Delete a session
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('discovery_sessions')
    .delete()
    .eq('id', sessionId);

  if (error) {
    throw new Error(`Failed to delete session: ${error.message}`);
  }
}

/**
 * Get user's sessions (with optional filters)
 */
export async function getUserSessions(
  userId: string,
  options?: {
    status?: SessionStatus | SessionStatus[];
    mode?: string;
    limit?: number;
    offset?: number;
  }
): Promise<SessionSummary[]> {
  const supabase = await createClient();

  let query = supabase
    .from('discovery_sessions')
    .select(
      'id, status, mode, entry_point, clusters_complete, message_count, created_at, last_activity, buy_box_id, final_profile_id'
    )
    .eq('user_id', userId)
    .order('last_activity', { ascending: false });

  // Apply status filter
  if (options?.status) {
    if (Array.isArray(options.status)) {
      query = query.in('status', options.status);
    } else {
      query = query.eq('status', options.status);
    }
  }

  // Apply mode filter
  if (options?.mode) {
    query = query.eq('mode', options.mode);
  }

  // Apply pagination
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get user sessions: ${error.message}`);
  }

  return (data || []).map((session) => ({
    id: session.id,
    status: session.status as SessionStatus,
    mode: session.mode,
    entry_point: session.entry_point,
    clusters_complete: session.clusters_complete,
    message_count: session.message_count,
    created_at: session.created_at,
    last_activity: session.last_activity,
    has_buy_box: !!session.buy_box_id,
    has_profile: !!session.final_profile_id,
  }));
}

/**
 * Get or create active session for user
 */
export async function getOrCreateActiveSession(
  userId: string,
  entryPoint?: string
): Promise<DiscoverySession> {
  const supabase = await createClient();

  // Try to find existing resumable session
  const { data: existingSessions } = await supabase
    .from('discovery_sessions')
    .select('*')
    .eq('user_id', userId)
    .in('status', [
      SessionStatus.INITIAL,
      SessionStatus.ACTIVE,
      SessionStatus.IDLE,
      SessionStatus.PAUSED,
    ])
    .order('last_activity', { ascending: false })
    .limit(1);

  if (existingSessions && existingSessions.length > 0) {
    const session = existingSessions[0] as DiscoverySession;

    // Resume the session
    if (session.status !== SessionStatus.ACTIVE) {
      return transitionState(
        session.id,
        SessionStatus.ACTIVE,
        TransitionTrigger.USER_RESUME
      );
    }

    // Update last activity
    return updateSession(session.id, {});
  }

  // Create new session
  return createSession({
    user_id: userId,
    entry_point: entryPoint,
  });
}

/**
 * Log to session history
 */
export async function logSessionHistory(
  sessionId: string,
  entry: Omit<SessionHistoryEntry, 'id' | 'session_id' | 'changed_at'>
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from('session_history').insert({
    session_id: sessionId,
    previous_status: entry.previous_status,
    new_status: entry.new_status,
    trigger: entry.trigger,
    metadata: entry.metadata || {},
  });

  if (error) {
    // Log error but don't throw - history logging is not critical
    console.error(`Failed to log session history: ${error.message}`);
  }
}

/**
 * Get session history
 */
export async function getSessionHistory(
  sessionId: string,
  limit = 50
): Promise<SessionHistoryEntry[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('session_history')
    .select('*')
    .eq('session_id', sessionId)
    .order('changed_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to get session history: ${error.message}`);
  }

  return (data || []) as SessionHistoryEntry[];
}
