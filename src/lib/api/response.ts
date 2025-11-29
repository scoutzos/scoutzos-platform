// ============================================================
// API Response Wrapper
// ============================================================

import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { ApiError, ErrorCodes, ErrorStatusCodes, ValidationError } from './errors';

// Response types
export interface ApiResponseMeta {
  request_id: string;
  timestamp: string;
  duration_ms?: number;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, unknown>;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  meta: ApiResponseMeta;
  errors: ApiErrorDetail[] | null;
}

// Create a request context for tracking timing
export interface RequestContext {
  requestId: string;
  startTime: number;
}

export function createRequestContext(): RequestContext {
  return {
    requestId: uuidv4(),
    startTime: Date.now(),
  };
}

// Build meta object
function buildMeta(ctx: RequestContext): ApiResponseMeta {
  return {
    request_id: ctx.requestId,
    timestamp: new Date().toISOString(),
    duration_ms: Date.now() - ctx.startTime,
  };
}

// Success response
export function success<T>(
  data: T,
  ctx: RequestContext,
  status: number = 200
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: buildMeta(ctx),
    errors: null,
  };

  return NextResponse.json(response, { status });
}

// Error response
export function error(
  err: ApiError | Error | unknown,
  ctx: RequestContext
): NextResponse<ApiResponse<null>> {
  let errors: ApiErrorDetail[];
  let status: number;

  if (err instanceof ValidationError) {
    errors = err.fieldErrors.map((fe) => ({
      code: fe.code || ErrorCodes.VALIDATION_ERROR,
      message: fe.message,
      field: fe.field,
    }));
    status = 400;
  } else if (err instanceof ApiError) {
    errors = [
      {
        code: err.code,
        message: err.message,
        field: err.field,
        details: err.details,
      },
    ];
    status = err.statusCode;
  } else if (err instanceof Error) {
    // Generic error - don't expose internal details in production
    const isDev = process.env.NODE_ENV === 'development';
    errors = [
      {
        code: ErrorCodes.INTERNAL_ERROR,
        message: isDev ? err.message : 'An unexpected error occurred',
        details: isDev ? { stack: err.stack } : undefined,
      },
    ];
    status = 500;
  } else {
    errors = [
      {
        code: ErrorCodes.INTERNAL_ERROR,
        message: 'An unexpected error occurred',
      },
    ];
    status = 500;
  }

  const response: ApiResponse<null> = {
    success: false,
    data: null,
    meta: buildMeta(ctx),
    errors,
  };

  return NextResponse.json(response, { status });
}

// Convenience error creators
export function unauthorized(ctx: RequestContext, message?: string) {
  return error(new ApiError(ErrorCodes.UNAUTHORIZED, message), ctx);
}

export function forbidden(ctx: RequestContext, message?: string) {
  return error(new ApiError(ErrorCodes.FORBIDDEN, message), ctx);
}

export function notFound(ctx: RequestContext, message?: string) {
  return error(new ApiError(ErrorCodes.NOT_FOUND, message), ctx);
}

export function badRequest(
  ctx: RequestContext,
  message: string,
  field?: string
) {
  return error(
    new ApiError(ErrorCodes.VALIDATION_ERROR, message, { field }),
    ctx
  );
}

export function rateLimited(
  ctx: RequestContext,
  retryAfter: number,
  headers?: Record<string, string>
) {
  const response: ApiResponse<null> = {
    success: false,
    data: null,
    meta: buildMeta(ctx),
    errors: [
      {
        code: ErrorCodes.RATE_LIMITED,
        message: `Too many requests. Please try again in ${retryAfter} seconds.`,
        details: { retry_after: retryAfter },
      },
    ],
  };

  return NextResponse.json(response, {
    status: 429,
    headers: {
      'Retry-After': String(retryAfter),
      ...headers,
    },
  });
}

// Handler wrapper that automatically handles errors
export function withApiHandler<T>(
  handler: (ctx: RequestContext) => Promise<NextResponse<ApiResponse<T>>>
) {
  return async (): Promise<NextResponse<ApiResponse<T | null>>> => {
    const ctx = createRequestContext();
    try {
      return await handler(ctx);
    } catch (err) {
      console.error(`[${ctx.requestId}] API Error:`, err);
      return error(err, ctx);
    }
  };
}

// Handler wrapper with request parameter
export function withApiRequest<T>(
  handler: (
    request: Request,
    ctx: RequestContext
  ) => Promise<NextResponse<ApiResponse<T>>>
) {
  return async (request: Request): Promise<NextResponse<ApiResponse<T | null>>> => {
    const ctx = createRequestContext();
    try {
      return await handler(request, ctx);
    } catch (err) {
      console.error(`[${ctx.requestId}] API Error:`, err);
      return error(err, ctx);
    }
  };
}
