import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  success,
  error,
  unauthorized,
  createRequestContext,
  validateQuery,
  paginationSchema,
  ApiError,
  ErrorCodes,
} from '@/lib/api';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const matchesQuerySchema = paginationSchema.extend({
  min_score: z.coerce.number().int().min(0).max(100).optional().default(60),
  status: z.enum(['liked', 'passed', 'saved', 'offered', 'all']).optional().default('all'),
  sort_by: z.enum(['match_score', 'created_at', 'list_price']).optional().default('match_score'),
  sort_order: z.enum(['asc', 'desc']).optional().default('desc'),
});

export async function GET(request: NextRequest, { params }: RouteParams) {
  const ctx = createRequestContext();

  try {
    const { id: buyBoxId } = await params;

    // Auth check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return unauthorized(ctx);
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(buyBoxId)) {
      throw new ApiError(ErrorCodes.VALIDATION_ERROR, 'Invalid buy box ID format');
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const query = validateQuery(searchParams, matchesQuerySchema);

    // TODO: Implement matches retrieval logic
    // 1. Fetch buy box and verify ownership
    // 2. Query deal_matches table
    // 3. Join with deals and deal_metrics
    // 4. Apply filters and pagination
    // 5. Return paginated results

    // Placeholder response
    return success(
      {
        matches: [
          {
            id: crypto.randomUUID(),
            deal_id: crypto.randomUUID(),
            match_score: 92,
            user_action: null,
            created_at: new Date().toISOString(),
            deal: {
              address: '456 Oak Lane',
              city: 'Austin',
              state: 'TX',
              list_price: 225000,
              property_type: 'sfr',
              beds: 3,
              baths: 2,
              status: 'new',
            },
          },
          {
            id: crypto.randomUUID(),
            deal_id: crypto.randomUUID(),
            match_score: 85,
            user_action: 'liked',
            swiped_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            deal: {
              address: '789 Elm Street',
              city: 'Round Rock',
              state: 'TX',
              list_price: 245000,
              property_type: 'sfr',
              beds: 4,
              baths: 2,
              status: 'analyzing',
            },
          },
        ],
        pagination: {
          page: query.page,
          limit: query.limit,
          total: 2,
          total_pages: 1,
          has_next: false,
          has_prev: false,
        },
        buy_box: {
          id: buyBoxId,
          name: 'Austin BRRRR',
        },
      },
      ctx
    );
  } catch (err) {
    return error(err, ctx);
  }
}
