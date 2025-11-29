// ============================================================
// API Utilities - Main Export
// ============================================================

// Response utilities
export {
  success,
  error,
  unauthorized,
  forbidden,
  notFound,
  badRequest,
  rateLimited,
  withApiHandler,
  withApiRequest,
  createRequestContext,
  type RequestContext,
  type ApiResponse,
  type ApiResponseMeta,
  type ApiErrorDetail,
} from './response';

// Error handling
export {
  ApiError,
  ValidationError,
  ErrorCodes,
  ErrorStatusCodes,
  ErrorMessages,
  type ErrorCode,
} from './errors';

// Rate limiting
export {
  withRateLimit,
  withRateLimitedHandler,
  checkRateLimit,
  rateLimitHeaders,
  RATE_LIMITS,
  type RateLimitConfig,
  type RateLimitResult,
} from './rate-limit';

// Validation
export {
  validateBody,
  validateQuery,
  zodToValidationError,
  // Schemas
  uuidSchema,
  paginationSchema,
  startDiscoverySchema,
  respondDiscoverySchema,
  recommendDiscoverySchema,
  finalizeDiscoverySchema,
  analyzeDealSchema,
  compareDealsSchema,
  createBuyBoxSchema,
  updateBuyBoxSchema,
  matchBuyBoxSchema,
  // Types
  type StartDiscoveryInput,
  type RespondDiscoveryInput,
  type RecommendDiscoveryInput,
  type FinalizeDiscoveryInput,
  type AnalyzeDealInput,
  type CompareDealsInput,
  type CreateBuyBoxInput,
  type UpdateBuyBoxInput,
  type MatchBuyBoxInput,
} from './validation';
