/**
 * Idle Detection & Timeout Management
 * Server-side functions for session timeout handling
 */

import { createClient } from '@/lib/supabase/server';
import {
  SessionStatus,
  TransitionTrigger,
  TimeoutDurations,
  calculateTimeoutStatus,
} from './state-machine';
import { transitionState, logSessionHistory } from './crud';
import type { DiscoverySession } from './types';

/**
 * Check a single session for timeout transitions
 */
export async function checkSessionTimeout(session: DiscoverySession): Promise<{
  transitioned: boolean;
  newStatus?: SessionStatus;
  trigger?: TransitionTrigger;
}> {
  const timeoutResult = calculateTimeoutStatus(
    session.status as SessionStatus,
    new Date(session.last_activity),
    new Date(session.created_at)
  );

  if (!timeoutResult) {
    return { transitioned: false };
  }

  try {
    await transitionState(session.id, timeoutResult.newStatus, timeoutResult.trigger, {
      reason: 'timeout_check',
      last_activity: session.last_activity,
    });

    return {
      transitioned: true,
      newStatus: timeoutResult.newStatus,
      trigger: timeoutResult.trigger,
    };
  } catch (error) {
    console.error(`Failed to transition session ${session.id}:`, error);
    return { transitioned: false };
  }
}

/**
 * Process idle sessions (ACTIVE → IDLE after 15 min)
 */
export async function processIdleSessions(): Promise<{
  processed: number;
  transitioned: number;
}> {
  const supabase = await createClient();

  const idleThreshold = new Date(Date.now() - TimeoutDurations.IDLE_TIMEOUT).toISOString();

  // Find ACTIVE sessions that should be IDLE
  const { data: sessions, error } = await supabase
    .from('discovery_sessions')
    .select('id, user_id, status, last_activity, created_at')
    .eq('status', SessionStatus.ACTIVE)
    .lt('last_activity', idleThreshold);

  if (error) {
    throw new Error(`Failed to query idle sessions: ${error.message}`);
  }

  let transitioned = 0;

  for (const session of sessions || []) {
    try {
      await transitionState(
        session.id,
        SessionStatus.IDLE,
        TransitionTrigger.IDLE_TIMEOUT,
        { reason: 'cron_idle_check' }
      );
      transitioned++;
    } catch (err) {
      console.error(`Failed to mark session ${session.id} as idle:`, err);
    }
  }

  return {
    processed: sessions?.length || 0,
    transitioned,
  };
}

/**
 * Process expired sessions (IDLE/PAUSED → EXPIRED after 12 hours)
 */
export async function processExpiredSessions(): Promise<{
  processed: number;
  transitioned: number;
}> {
  const supabase = await createClient();

  const expiryThreshold = new Date(Date.now() - TimeoutDurations.SESSION_EXPIRY).toISOString();

  // Find IDLE/PAUSED sessions that should be EXPIRED
  const { data: sessions, error } = await supabase
    .from('discovery_sessions')
    .select('id, user_id, status, last_activity, created_at')
    .in('status', [SessionStatus.IDLE, SessionStatus.PAUSED])
    .lt('last_activity', expiryThreshold);

  if (error) {
    throw new Error(`Failed to query expired sessions: ${error.message}`);
  }

  let transitioned = 0;

  for (const session of sessions || []) {
    try {
      await transitionState(
        session.id,
        SessionStatus.EXPIRED,
        TransitionTrigger.SESSION_TIMEOUT,
        { reason: 'cron_expiry_check' }
      );
      transitioned++;
    } catch (err) {
      console.error(`Failed to expire session ${session.id}:`, err);
    }
  }

  return {
    processed: sessions?.length || 0,
    transitioned,
  };
}

/**
 * Process archived sessions (EXPIRED → ARCHIVED after 7 days)
 */
export async function processArchivedSessions(): Promise<{
  processed: number;
  transitioned: number;
}> {
  const supabase = await createClient();

  const archiveThreshold = new Date(
    Date.now() - TimeoutDurations.ARCHIVE_AFTER_EXPIRY
  ).toISOString();

  // Find EXPIRED sessions that should be ARCHIVED
  const { data: sessions, error } = await supabase
    .from('discovery_sessions')
    .select('id, user_id, status, last_activity, expired_at')
    .eq('status', SessionStatus.EXPIRED)
    .lt('expired_at', archiveThreshold);

  if (error) {
    throw new Error(`Failed to query archive sessions: ${error.message}`);
  }

  let transitioned = 0;

  for (const session of sessions || []) {
    try {
      await transitionState(
        session.id,
        SessionStatus.ARCHIVED,
        TransitionTrigger.ARCHIVE_TIMEOUT,
        { reason: 'cron_archive_check' }
      );
      transitioned++;
    } catch (err) {
      console.error(`Failed to archive session ${session.id}:`, err);
    }
  }

  return {
    processed: sessions?.length || 0,
    transitioned,
  };
}

/**
 * Process error timeout sessions (ERROR → EXPIRED after 1 hour)
 */
export async function processErrorTimeouts(): Promise<{
  processed: number;
  transitioned: number;
}> {
  const supabase = await createClient();

  const errorTimeout = new Date(
    Date.now() - TimeoutDurations.ERROR_RECOVERY_WINDOW
  ).toISOString();

  // Find ERROR sessions that should be EXPIRED
  const { data: sessions, error } = await supabase
    .from('discovery_sessions')
    .select('id, user_id, status, last_activity, error_at')
    .eq('status', SessionStatus.ERROR)
    .lt('error_at', errorTimeout);

  if (error) {
    throw new Error(`Failed to query error sessions: ${error.message}`);
  }

  let transitioned = 0;

  for (const session of sessions || []) {
    try {
      await transitionState(
        session.id,
        SessionStatus.EXPIRED,
        TransitionTrigger.ERROR_TIMEOUT,
        { reason: 'cron_error_timeout' }
      );
      transitioned++;
    } catch (err) {
      console.error(`Failed to expire error session ${session.id}:`, err);
    }
  }

  return {
    processed: sessions?.length || 0,
    transitioned,
  };
}

/**
 * Process initial timeout sessions (INITIAL → EXPIRED after 30 seconds)
 */
export async function processInitialTimeouts(): Promise<{
  processed: number;
  transitioned: number;
}> {
  const supabase = await createClient();

  const initialTimeout = new Date(
    Date.now() - TimeoutDurations.INITIAL_TIMEOUT
  ).toISOString();

  // Find INITIAL sessions that should be EXPIRED
  const { data: sessions, error } = await supabase
    .from('discovery_sessions')
    .select('id, user_id, status, last_activity, created_at')
    .eq('status', SessionStatus.INITIAL)
    .lt('created_at', initialTimeout);

  if (error) {
    throw new Error(`Failed to query initial timeout sessions: ${error.message}`);
  }

  let transitioned = 0;

  for (const session of sessions || []) {
    try {
      await transitionState(
        session.id,
        SessionStatus.EXPIRED,
        TransitionTrigger.INITIAL_TIMEOUT,
        { reason: 'cron_initial_timeout' }
      );
      transitioned++;
    } catch (err) {
      console.error(`Failed to expire initial session ${session.id}:`, err);
    }
  }

  return {
    processed: sessions?.length || 0,
    transitioned,
  };
}

/**
 * Run all timeout checks (for cron job)
 */
export async function runAllTimeoutChecks(): Promise<{
  initial: { processed: number; transitioned: number };
  idle: { processed: number; transitioned: number };
  expired: { processed: number; transitioned: number };
  archived: { processed: number; transitioned: number };
  error: { processed: number; transitioned: number };
  totalTransitioned: number;
}> {
  const [initial, idle, expired, archived, error] = await Promise.all([
    processInitialTimeouts(),
    processIdleSessions(),
    processExpiredSessions(),
    processArchivedSessions(),
    processErrorTimeouts(),
  ]);

  return {
    initial,
    idle,
    expired,
    archived,
    error,
    totalTransitioned:
      initial.transitioned +
      idle.transitioned +
      expired.transitioned +
      archived.transitioned +
      error.transitioned,
  };
}

/**
 * Get session timeout info for client
 */
export function getTimeoutInfo(session: DiscoverySession): {
  idleIn: number | null;
  expiresIn: number | null;
  status: SessionStatus;
} {
  const now = Date.now();
  const lastActivity = new Date(session.last_activity).getTime();
  const status = session.status as SessionStatus;

  let idleIn: number | null = null;
  let expiresIn: number | null = null;

  switch (status) {
    case SessionStatus.ACTIVE:
      idleIn = Math.max(0, TimeoutDurations.IDLE_TIMEOUT - (now - lastActivity));
      break;

    case SessionStatus.IDLE:
    case SessionStatus.PAUSED:
      expiresIn = Math.max(0, TimeoutDurations.SESSION_EXPIRY - (now - lastActivity));
      break;

    case SessionStatus.EXPIRED:
      const expiredAt = session.expired_at ? new Date(session.expired_at).getTime() : lastActivity;
      expiresIn = Math.max(0, TimeoutDurations.ARCHIVE_AFTER_EXPIRY - (now - expiredAt));
      break;
  }

  return { idleIn, expiresIn, status };
}
