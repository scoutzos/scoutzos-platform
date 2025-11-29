// ============================================================
// Validation Middleware
// ============================================================

import { z, ZodError, ZodSchema } from 'zod';
import { ValidationError } from './errors';

// Convert Zod errors to our ValidationError format
export function zodToValidationError(error: ZodError): ValidationError {
  const fieldErrors = error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
  }));
  return new ValidationError(fieldErrors);
}

// Validate request body against a schema
export async function validateBody<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<T> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new ValidationError([
      {
        field: 'body',
        message: 'Invalid JSON in request body',
        code: 'invalid_type',
      },
    ]);
  }

  try {
    return schema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      throw zodToValidationError(error);
    }
    throw error;
  }
}

// Validate query parameters
export function validateQuery<T>(
  searchParams: URLSearchParams,
  schema: ZodSchema<T>
): T {
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  try {
    return schema.parse(params);
  } catch (error) {
    if (error instanceof ZodError) {
      throw zodToValidationError(error);
    }
    throw error;
  }
}

// ============================================================
// Common Validation Schemas
// ============================================================

// UUID validation
export const uuidSchema = z.string().uuid('Invalid UUID format');

// Pagination
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Discovery Session Schemas
export const startDiscoverySchema = z.object({
  entry_point: z
    .enum(['sidebar', 'deal_card', 'buy_box_edit', 'onboarding'])
    .optional()
    .default('sidebar'),
  initial_context: z
    .object({
      deal_id: z.string().uuid().optional(),
      buy_box_id: z.string().uuid().optional(),
    })
    .optional(),
});

export const respondDiscoverySchema = z.object({
  session_id: z.string().uuid('Invalid session ID'),
  message: z.string().min(1, 'Message cannot be empty').max(2000, 'Message too long'),
  ui_state: z
    .object({
      scroll_position: z.number().optional(),
      input_draft: z.string().optional(),
    })
    .optional(),
});

export const recommendDiscoverySchema = z.object({
  session_id: z.string().uuid('Invalid session ID'),
  force_recommendation: z.boolean().optional().default(false),
});

export const finalizeDiscoverySchema = z.object({
  session_id: z.string().uuid('Invalid session ID'),
  profile_id: z.string().uuid('Invalid profile ID'),
  create_buy_box: z.boolean().optional().default(true),
  buy_box_name: z.string().min(1).max(100).optional(),
});

// Advisor Schemas
export const analyzeDealSchema = z.object({
  deal_id: z.string().uuid('Invalid deal ID'),
  investor_profile_id: z.string().uuid().optional(),
  assumptions: z
    .object({
      vacancy_rate: z.number().min(0).max(1).optional(),
      maintenance_rate: z.number().min(0).max(1).optional(),
      capex_rate: z.number().min(0).max(1).optional(),
      management_rate: z.number().min(0).max(1).optional(),
      down_payment_pct: z.number().min(0).max(1).optional(),
      interest_rate: z.number().min(0).max(1).optional(),
      loan_term_years: z.number().int().min(1).max(40).optional(),
    })
    .optional(),
  include_comps: z.boolean().optional().default(true),
  include_ai_summary: z.boolean().optional().default(true),
});

export const compareDealsSchema = z.object({
  deal_ids: z
    .array(z.string().uuid())
    .min(2, 'At least 2 deals required for comparison')
    .max(5, 'Maximum 5 deals can be compared'),
  investor_profile_id: z.string().uuid().optional(),
  criteria: z
    .array(
      z.enum([
        'price',
        'cash_flow',
        'cap_rate',
        'cash_on_cash',
        'location',
        'condition',
        'appreciation',
      ])
    )
    .optional(),
});

// Buy Box Schemas
export const createBuyBoxSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  markets: z.array(z.string()).min(1, 'At least one market is required'),
  property_types: z.array(z.string()).optional(),
  min_price: z.number().positive().optional(),
  max_price: z.number().positive().optional(),
  min_beds: z.number().int().min(0).optional(),
  max_beds: z.number().int().min(0).optional(),
  min_baths: z.number().min(0).optional(),
  max_baths: z.number().min(0).optional(),
  min_sqft: z.number().int().positive().optional(),
  max_sqft: z.number().int().positive().optional(),
  min_year_built: z.number().int().min(1800).optional(),
  max_year_built: z.number().int().max(2100).optional(),
  strategy: z
    .enum([
      'buy_hold',
      'brrrr',
      'flip',
      'wholesale',
      'str',
      'mtr',
      'house_hack',
      'subject_to',
      'seller_finance',
    ])
    .optional(),
  target_cap_rate: z.number().min(0).max(100).optional(),
  target_cash_on_cash: z.number().min(0).max(100).optional(),
  min_dscr: z.number().min(0).max(10).optional(),
  is_active: z.boolean().optional().default(true),
});

export const updateBuyBoxSchema = createBuyBoxSchema.partial();

export const matchBuyBoxSchema = z.object({
  min_score: z.number().int().min(0).max(100).optional().default(60),
  limit: z.number().int().min(1).max(100).optional().default(50),
  include_metrics: z.boolean().optional().default(true),
});

// Type exports
export type StartDiscoveryInput = z.infer<typeof startDiscoverySchema>;
export type RespondDiscoveryInput = z.infer<typeof respondDiscoverySchema>;
export type RecommendDiscoveryInput = z.infer<typeof recommendDiscoverySchema>;
export type FinalizeDiscoveryInput = z.infer<typeof finalizeDiscoverySchema>;
export type AnalyzeDealInput = z.infer<typeof analyzeDealSchema>;
export type CompareDealsInput = z.infer<typeof compareDealsSchema>;
export type CreateBuyBoxInput = z.infer<typeof createBuyBoxSchema>;
export type UpdateBuyBoxInput = z.infer<typeof updateBuyBoxSchema>;
export type MatchBuyBoxInput = z.infer<typeof matchBuyBoxSchema>;
