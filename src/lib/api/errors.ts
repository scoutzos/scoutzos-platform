// ============================================================
// API Error Codes and Types
// ============================================================

export const ErrorCodes = {
  // 400 - Bad Request
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_FIELD: 'MISSING_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  INVALID_STATE: 'INVALID_STATE',

  // 401 - Unauthorized
  UNAUTHORIZED: 'UNAUTHORIZED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',

  // 403 - Forbidden
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',

  // 404 - Not Found
  NOT_FOUND: 'NOT_FOUND',
  SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
  DEAL_NOT_FOUND: 'DEAL_NOT_FOUND',
  BUY_BOX_NOT_FOUND: 'BUY_BOX_NOT_FOUND',
  PROFILE_NOT_FOUND: 'PROFILE_NOT_FOUND',

  // 409 - Conflict
  CONFLICT: 'CONFLICT',
  SESSION_ALREADY_EXISTS: 'SESSION_ALREADY_EXISTS',

  // 410 - Gone
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  SESSION_COMPLETED: 'SESSION_COMPLETED',

  // 429 - Rate Limited
  RATE_LIMITED: 'RATE_LIMITED',

  // 500 - Internal Server Error
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  AI_ERROR: 'AI_ERROR',
  AI_UNAVAILABLE: 'AI_UNAVAILABLE',
  DATABASE_ERROR: 'DATABASE_ERROR',

  // 504 - Gateway Timeout
  TIMEOUT: 'TIMEOUT',
  AI_TIMEOUT: 'AI_TIMEOUT',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

// HTTP status codes for each error
export const ErrorStatusCodes: Record<ErrorCode, number> = {
  // 400
  [ErrorCodes.VALIDATION_ERROR]: 400,
  [ErrorCodes.MISSING_FIELD]: 400,
  [ErrorCodes.INVALID_FORMAT]: 400,
  [ErrorCodes.INVALID_STATE]: 400,

  // 401
  [ErrorCodes.UNAUTHORIZED]: 401,
  [ErrorCodes.TOKEN_EXPIRED]: 401,
  [ErrorCodes.INVALID_TOKEN]: 401,

  // 403
  [ErrorCodes.FORBIDDEN]: 403,
  [ErrorCodes.INSUFFICIENT_PERMISSIONS]: 403,

  // 404
  [ErrorCodes.NOT_FOUND]: 404,
  [ErrorCodes.SESSION_NOT_FOUND]: 404,
  [ErrorCodes.DEAL_NOT_FOUND]: 404,
  [ErrorCodes.BUY_BOX_NOT_FOUND]: 404,
  [ErrorCodes.PROFILE_NOT_FOUND]: 404,

  // 409
  [ErrorCodes.CONFLICT]: 409,
  [ErrorCodes.SESSION_ALREADY_EXISTS]: 409,

  // 410
  [ErrorCodes.SESSION_EXPIRED]: 410,
  [ErrorCodes.SESSION_COMPLETED]: 410,

  // 429
  [ErrorCodes.RATE_LIMITED]: 429,

  // 500
  [ErrorCodes.INTERNAL_ERROR]: 500,
  [ErrorCodes.AI_ERROR]: 500,
  [ErrorCodes.AI_UNAVAILABLE]: 500,
  [ErrorCodes.DATABASE_ERROR]: 500,

  // 504
  [ErrorCodes.TIMEOUT]: 504,
  [ErrorCodes.AI_TIMEOUT]: 504,
};

// Default messages for each error code
export const ErrorMessages: Record<ErrorCode, string> = {
  [ErrorCodes.VALIDATION_ERROR]: 'The request contains invalid data',
  [ErrorCodes.MISSING_FIELD]: 'A required field is missing',
  [ErrorCodes.INVALID_FORMAT]: 'The data format is invalid',
  [ErrorCodes.INVALID_STATE]: 'The resource is in an invalid state for this operation',

  [ErrorCodes.UNAUTHORIZED]: 'Authentication is required',
  [ErrorCodes.TOKEN_EXPIRED]: 'Your session has expired, please sign in again',
  [ErrorCodes.INVALID_TOKEN]: 'Invalid authentication token',

  [ErrorCodes.FORBIDDEN]: 'You do not have permission to perform this action',
  [ErrorCodes.INSUFFICIENT_PERMISSIONS]: 'Insufficient permissions for this resource',

  [ErrorCodes.NOT_FOUND]: 'The requested resource was not found',
  [ErrorCodes.SESSION_NOT_FOUND]: 'Discovery session not found',
  [ErrorCodes.DEAL_NOT_FOUND]: 'Deal not found',
  [ErrorCodes.BUY_BOX_NOT_FOUND]: 'Buy box not found',
  [ErrorCodes.PROFILE_NOT_FOUND]: 'Investor profile not found',

  [ErrorCodes.CONFLICT]: 'The request conflicts with the current state',
  [ErrorCodes.SESSION_ALREADY_EXISTS]: 'An active session already exists',

  [ErrorCodes.SESSION_EXPIRED]: 'This session has expired',
  [ErrorCodes.SESSION_COMPLETED]: 'This session has already been completed',

  [ErrorCodes.RATE_LIMITED]: 'Too many requests, please try again later',

  [ErrorCodes.INTERNAL_ERROR]: 'An unexpected error occurred',
  [ErrorCodes.AI_ERROR]: 'AI service error',
  [ErrorCodes.AI_UNAVAILABLE]: 'AI service is temporarily unavailable',
  [ErrorCodes.DATABASE_ERROR]: 'Database error',

  [ErrorCodes.TIMEOUT]: 'The request timed out',
  [ErrorCodes.AI_TIMEOUT]: 'AI response timed out',
};

// API Error class
export class ApiError extends Error {
  code: ErrorCode;
  statusCode: number;
  field?: string;
  details?: Record<string, unknown>;

  constructor(
    code: ErrorCode,
    message?: string,
    options?: {
      field?: string;
      details?: Record<string, unknown>;
    }
  ) {
    super(message || ErrorMessages[code]);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = ErrorStatusCodes[code];
    this.field = options?.field;
    this.details = options?.details;
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      field: this.field,
      details: this.details,
    };
  }
}

// Validation error with multiple field errors
export class ValidationError extends ApiError {
  fieldErrors: Array<{ field: string; message: string; code?: string }>;

  constructor(fieldErrors: Array<{ field: string; message: string; code?: string }>) {
    super(ErrorCodes.VALIDATION_ERROR, 'Validation failed');
    this.fieldErrors = fieldErrors;
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      errors: this.fieldErrors,
    };
  }
}
