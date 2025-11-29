/**
 * Session State Machine
 * Manages session lifecycle and valid state transitions
 */

// Session status types
export const SessionStatus = {
  INITIAL: 'INITIAL',
  ACTIVE: 'ACTIVE',
  IDLE: 'IDLE',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
  EXPIRED: 'EXPIRED',
  ARCHIVED: 'ARCHIVED',
  ERROR: 'ERROR',
} as const;

export type SessionStatus = (typeof SessionStatus)[keyof typeof SessionStatus];

// Transition triggers
export const TransitionTrigger = {
  // User actions
  USER_MESSAGE: 'user_message',
  USER_PAUSE: 'user_pause',
  USER_RESUME: 'user_resume',
  USER_CLOSE: 'user_close',
  USER_ARCHIVE: 'user_archive',

  // System events
  FIRST_RESPONSE: 'first_response',
  PROFILE_COMPLETE: 'profile_complete',

  // Timeout events
  IDLE_TIMEOUT: 'idle_timeout',
  INITIAL_TIMEOUT: 'initial_timeout',
  SESSION_TIMEOUT: 'session_timeout',
  ARCHIVE_TIMEOUT: 'archive_timeout',
  ERROR_TIMEOUT: 'error_timeout',

  // Error/Recovery
  SYSTEM_ERROR: 'system_error',
  ERROR_RECOVERY: 'error_recovery',

  // Auto-save triggers
  AUTO_SAVE: 'auto_save',
  PERIODIC_SAVE: 'periodic_save',
} as const;

export type TransitionTrigger = (typeof TransitionTrigger)[keyof typeof TransitionTrigger];

// Timeout durations (in milliseconds)
export const TimeoutDurations = {
  INITIAL_TIMEOUT: 30 * 1000, // 30 seconds
  IDLE_TIMEOUT: 15 * 60 * 1000, // 15 minutes
  SESSION_EXPIRY: 12 * 60 * 60 * 1000, // 12 hours
  ARCHIVE_AFTER_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7 days
  ERROR_RECOVERY_WINDOW: 60 * 60 * 1000, // 1 hour
} as const;

// Valid state transitions map
// Key: current state, Value: object of allowed transitions with their triggers
const VALID_TRANSITIONS: Record<SessionStatus, Partial<Record<SessionStatus, TransitionTrigger[]>>> = {
  [SessionStatus.INITIAL]: {
    [SessionStatus.ACTIVE]: [TransitionTrigger.FIRST_RESPONSE, TransitionTrigger.USER_MESSAGE],
    [SessionStatus.EXPIRED]: [TransitionTrigger.INITIAL_TIMEOUT],
  },

  [SessionStatus.ACTIVE]: {
    [SessionStatus.ACTIVE]: [TransitionTrigger.USER_MESSAGE, TransitionTrigger.AUTO_SAVE], // Self-transition to reset idle timer
    [SessionStatus.IDLE]: [TransitionTrigger.IDLE_TIMEOUT],
    [SessionStatus.PAUSED]: [TransitionTrigger.USER_PAUSE, TransitionTrigger.USER_CLOSE],
    [SessionStatus.COMPLETED]: [TransitionTrigger.PROFILE_COMPLETE],
    [SessionStatus.ERROR]: [TransitionTrigger.SYSTEM_ERROR],
  },

  [SessionStatus.IDLE]: {
    [SessionStatus.ACTIVE]: [TransitionTrigger.USER_RESUME, TransitionTrigger.USER_MESSAGE],
    [SessionStatus.EXPIRED]: [TransitionTrigger.SESSION_TIMEOUT],
  },

  [SessionStatus.PAUSED]: {
    [SessionStatus.ACTIVE]: [TransitionTrigger.USER_RESUME, TransitionTrigger.USER_MESSAGE],
    [SessionStatus.EXPIRED]: [TransitionTrigger.SESSION_TIMEOUT],
  },

  [SessionStatus.COMPLETED]: {
    // Terminal state - no transitions out
    [SessionStatus.ARCHIVED]: [TransitionTrigger.USER_ARCHIVE],
  },

  [SessionStatus.EXPIRED]: {
    [SessionStatus.ACTIVE]: [TransitionTrigger.USER_RESUME, TransitionTrigger.USER_MESSAGE], // Resume within 7 days
    [SessionStatus.ARCHIVED]: [TransitionTrigger.ARCHIVE_TIMEOUT],
  },

  [SessionStatus.ARCHIVED]: {
    // Terminal state - no transitions out
  },

  [SessionStatus.ERROR]: {
    [SessionStatus.ACTIVE]: [TransitionTrigger.ERROR_RECOVERY],
    [SessionStatus.EXPIRED]: [TransitionTrigger.ERROR_TIMEOUT],
  },
};

// Error class for invalid transitions
export class InvalidTransitionError extends Error {
  public readonly fromStatus: SessionStatus;
  public readonly toStatus: SessionStatus;
  public readonly trigger: TransitionTrigger;

  constructor(fromStatus: SessionStatus, toStatus: SessionStatus, trigger: TransitionTrigger) {
    super(
      `Invalid state transition: ${fromStatus} → ${toStatus} (trigger: ${trigger})`
    );
    this.name = 'InvalidTransitionError';
    this.fromStatus = fromStatus;
    this.toStatus = toStatus;
    this.trigger = trigger;
  }
}

/**
 * Check if a state transition is valid
 */
export function isValidTransition(
  fromStatus: SessionStatus,
  toStatus: SessionStatus,
  trigger: TransitionTrigger
): boolean {
  const allowedTransitions = VALID_TRANSITIONS[fromStatus];
  if (!allowedTransitions) return false;

  const allowedTriggers = allowedTransitions[toStatus];
  if (!allowedTriggers) return false;

  return allowedTriggers.includes(trigger);
}

/**
 * Get all valid next states from current state
 */
export function getValidNextStates(currentStatus: SessionStatus): SessionStatus[] {
  const transitions = VALID_TRANSITIONS[currentStatus];
  return Object.keys(transitions || {}) as SessionStatus[];
}

/**
 * Get valid triggers for a specific transition
 */
export function getValidTriggers(
  fromStatus: SessionStatus,
  toStatus: SessionStatus
): TransitionTrigger[] {
  return VALID_TRANSITIONS[fromStatus]?.[toStatus] || [];
}

/**
 * Determine if a status is terminal (no further transitions)
 */
export function isTerminalStatus(status: SessionStatus): boolean {
  return [SessionStatus.ARCHIVED].includes(status);
}

/**
 * Determine if a status is resumable
 */
export function isResumableStatus(status: SessionStatus): boolean {
  return [
    SessionStatus.INITIAL,
    SessionStatus.ACTIVE,
    SessionStatus.IDLE,
    SessionStatus.PAUSED,
    SessionStatus.EXPIRED,
    SessionStatus.ERROR,
  ].includes(status);
}

/**
 * Get timestamp field to update based on new status
 */
export function getTimestampFieldForStatus(status: SessionStatus): string | null {
  const statusToField: Partial<Record<SessionStatus, string>> = {
    [SessionStatus.ACTIVE]: 'started_at',
    [SessionStatus.IDLE]: 'idle_since',
    [SessionStatus.PAUSED]: 'paused_at',
    [SessionStatus.COMPLETED]: 'completed_at',
    [SessionStatus.EXPIRED]: 'expired_at',
    [SessionStatus.ARCHIVED]: 'archived_at',
    [SessionStatus.ERROR]: 'error_at',
  };
  return statusToField[status] || null;
}

/**
 * Calculate what status a session should transition to based on time elapsed
 */
export function calculateTimeoutStatus(
  currentStatus: SessionStatus,
  lastActivity: Date,
  createdAt: Date
): { newStatus: SessionStatus; trigger: TransitionTrigger } | null {
  const now = new Date();
  const timeSinceActivity = now.getTime() - lastActivity.getTime();
  const timeSinceCreation = now.getTime() - createdAt.getTime();

  switch (currentStatus) {
    case SessionStatus.INITIAL:
      if (timeSinceCreation > TimeoutDurations.INITIAL_TIMEOUT) {
        return { newStatus: SessionStatus.EXPIRED, trigger: TransitionTrigger.INITIAL_TIMEOUT };
      }
      break;

    case SessionStatus.ACTIVE:
      if (timeSinceActivity > TimeoutDurations.IDLE_TIMEOUT) {
        return { newStatus: SessionStatus.IDLE, trigger: TransitionTrigger.IDLE_TIMEOUT };
      }
      break;

    case SessionStatus.IDLE:
    case SessionStatus.PAUSED:
      if (timeSinceActivity > TimeoutDurations.SESSION_EXPIRY) {
        return { newStatus: SessionStatus.EXPIRED, trigger: TransitionTrigger.SESSION_TIMEOUT };
      }
      break;

    case SessionStatus.EXPIRED:
      if (timeSinceActivity > TimeoutDurations.ARCHIVE_AFTER_EXPIRY) {
        return { newStatus: SessionStatus.ARCHIVED, trigger: TransitionTrigger.ARCHIVE_TIMEOUT };
      }
      break;

    case SessionStatus.ERROR:
      if (timeSinceActivity > TimeoutDurations.ERROR_RECOVERY_WINDOW) {
        return { newStatus: SessionStatus.EXPIRED, trigger: TransitionTrigger.ERROR_TIMEOUT };
      }
      break;
  }

  return null;
}

/**
 * Validate and prepare a state transition
 */
export interface TransitionResult {
  isValid: boolean;
  fromStatus: SessionStatus;
  toStatus: SessionStatus;
  trigger: TransitionTrigger;
  timestampField: string | null;
  error?: InvalidTransitionError;
}

export function prepareTransition(
  fromStatus: SessionStatus,
  toStatus: SessionStatus,
  trigger: TransitionTrigger
): TransitionResult {
  const isValid = isValidTransition(fromStatus, toStatus, trigger);

  return {
    isValid,
    fromStatus,
    toStatus,
    trigger,
    timestampField: isValid ? getTimestampFieldForStatus(toStatus) : null,
    error: isValid ? undefined : new InvalidTransitionError(fromStatus, toStatus, trigger),
  };
}
