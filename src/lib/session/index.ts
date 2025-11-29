/**
 * Session Management
 * Main export for session functionality
 */

// State Machine
export {
  SessionStatus,
  TransitionTrigger,
  TimeoutDurations,
  isValidTransition,
  getValidNextStates,
  getValidTriggers,
  isTerminalStatus,
  isResumableStatus,
  getTimestampFieldForStatus,
  calculateTimeoutStatus,
  prepareTransition,
  InvalidTransitionError,
  type TransitionResult,
} from './state-machine';

// Types
export type {
  ConversationMessage,
  PartialProfile,
  UIState,
  ErrorDetails,
  ClientInfo,
  DiscoverySession,
  CreateSessionParams,
  UpdateSessionParams,
  SessionHistoryEntry,
  SessionSummary,
  SaveTrigger,
  AutoSaveRequest,
} from './types';

// CRUD Operations
export {
  createSession,
  getSession,
  getSessionForUser,
  updateSession,
  transitionState,
  deleteSession,
  getUserSessions,
  getOrCreateActiveSession,
  logSessionHistory,
  getSessionHistory,
  SessionNotFoundError,
  SessionAccessDeniedError,
} from './crud';

// Idle Detection
export {
  checkSessionTimeout,
  processIdleSessions,
  processExpiredSessions,
  processArchivedSessions,
  processErrorTimeouts,
  processInitialTimeouts,
  runAllTimeoutChecks,
  getTimeoutInfo,
} from './idle-detection';
