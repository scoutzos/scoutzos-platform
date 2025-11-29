// ============================================================
// Rate Limiting Middleware
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createRequestContext, rateLimited, ApiResponse } from './response';

// In-memory store for rate limiting (use Redis in production)
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Rate limit configurations per endpoint
export interface RateLimitConfig {
  limit: number;
  windowMs: number; // milliseconds
  keyPrefix?: string;
}

// Endpoint-specific rate limits
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Discovery endpoints
  '/api/discovery/start': {
    limit: 10,
    windowMs: 60 * 60 * 1000, // 10 per hour
    keyPrefix: 'discovery-start',
  },
  '/api/discovery/respond': {
    limit: 60,
    windowMs: 60 * 1000, // 60 per minute
    keyPrefix: 'discovery-respond',
  },
  '/api/discovery/recommend': {
    limit: 10,
    windowMs: 60 * 60 * 1000, // 10 per hour
    keyPrefix: 'discovery-recommend',
  },
  '/api/discovery/finalize': {
    limit: 10,
    windowMs: 60 * 60 * 1000, // 10 per hour
    keyPrefix: 'discovery-finalize',
  },

  // Advisor endpoints
  '/api/advisor/analyze': {
    limit: 50,
    windowMs: 60 * 60 * 1000, // 50 per hour
    keyPrefix: 'advisor-analyze',
  },
  '/api/advisor/compare': {
    limit: 30,
    windowMs: 60 * 60 * 1000, // 30 per hour
    keyPrefix: 'advisor-compare',
  },

  // Buy box matching
  '/api/buy-boxes/match': {
    limit: 30,
    windowMs: 60 * 60 * 1000, // 30 per hour per buy box
    keyPrefix: 'buybox-match',
  },

  // Default for unspecified endpoints
  default: {
    limit: 100,
    windowMs: 60 * 1000, // 100 per minute
    keyPrefix: 'default',
  },
};

// Get rate limit config for a path
function getRateLimitConfig(path: string): RateLimitConfig {
  // Check exact match first
  if (RATE_LIMITS[path]) {
    return RATE_LIMITS[path];
  }

  // Check pattern matches (e.g., /api/buy-boxes/*/match)
  if (path.match(/^\/api\/buy-boxes\/[^/]+\/match$/)) {
    return RATE_LIMITS['/api/buy-boxes/match'];
  }

  if (path.match(/^\/api\/discovery\/session\/[^/]+\/resume$/)) {
    return RATE_LIMITS['/api/discovery/respond'];
  }

  return RATE_LIMITS.default;
}

// Build rate limit key
function buildKey(
  prefix: string,
  userId: string,
  additionalKey?: string
): string {
  const parts = [prefix, userId];
  if (additionalKey) {
    parts.push(additionalKey);
  }
  return parts.join(':');
}

// Clean up expired entries periodically
let lastCleanup = Date.now();
function cleanupExpiredEntries() {
  const now = Date.now();
  // Only clean up every 5 minutes
  if (now - lastCleanup < 5 * 60 * 1000) return;

  lastCleanup = now;
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}

// Check rate limit and return result
export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

export function checkRateLimit(
  config: RateLimitConfig,
  userId: string,
  additionalKey?: string
): RateLimitResult {
  cleanupExpiredEntries();

  const key = buildKey(config.keyPrefix || 'default', userId, additionalKey);
  const now = Date.now();

  let entry = rateLimitStore.get(key);

  // If no entry or expired, create new one
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 0,
      resetAt: now + config.windowMs,
    };
  }

  // Check if over limit
  if (entry.count >= config.limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return {
      allowed: false,
      limit: config.limit,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfter,
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);

  return {
    allowed: true,
    limit: config.limit,
    remaining: config.limit - entry.count,
    resetAt: entry.resetAt,
  };
}

// Rate limit headers
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.floor(result.resetAt / 1000)),
  };
}

// Middleware function to apply rate limiting
export async function withRateLimit(
  request: NextRequest,
  userId: string,
  additionalKey?: string
): Promise<NextResponse<ApiResponse<null>> | null> {
  const path = new URL(request.url).pathname;
  const config = getRateLimitConfig(path);
  const result = checkRateLimit(config, userId, additionalKey);

  if (!result.allowed) {
    const ctx = createRequestContext();
    return rateLimited(ctx, result.retryAfter || 60, rateLimitHeaders(result));
  }

  return null; // Allowed to proceed
}

// HOC for rate-limited handlers
export function withRateLimitedHandler<T>(
  handler: (
    request: NextRequest,
    userId: string
  ) => Promise<NextResponse<ApiResponse<T>>>,
  getUserId: (request: NextRequest) => Promise<string | null>
) {
  return async (request: NextRequest): Promise<NextResponse<ApiResponse<T | null>>> => {
    const userId = await getUserId(request);

    if (!userId) {
      const ctx = createRequestContext();
      return NextResponse.json(
        {
          success: false,
          data: null,
          meta: {
            request_id: ctx.requestId,
            timestamp: new Date().toISOString(),
          },
          errors: [{ code: 'UNAUTHORIZED', message: 'Authentication required' }],
        },
        { status: 401 }
      );
    }

    const rateLimitResponse = await withRateLimit(request, userId);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    return handler(request, userId);
  };
}
