import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  success,
  error,
  unauthorized,
  notFound,
  createRequestContext,
  validateBody,
  matchBuyBoxSchema,
  withRateLimit,
  ApiError,
  ErrorCodes,
} from '@/lib/api';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
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

    // Rate limit check (per buy box)
    const rateLimitResponse = await withRateLimit(request, user.id, buyBoxId);
    if (rateLimitResponse) return rateLimitResponse;

    // Validate request body
    const body = await validateBody(request, matchBuyBoxSchema);

    // TODO: Implement matching logic
    // 1. Fetch buy box and verify ownership
    // 2. Call get_matching_deals SQL function
    // 3. Format and return results

    // Placeholder response with sample matches
    return success(
      {
        buy_box: {
          id: buyBoxId,
          name: 'Austin BRRRR',
          strategy: 'brrrr',
        },
        matches: [
          {
            deal_id: crypto.randomUUID(),
            match_score: 92,
            price_score: 95,
            financial_score: 88,
            location_score: 100,
            property_score: 85,
            deal: {
              address: '456 Oak Lane',
              city: 'Austin',
              state: 'TX',
              list_price: 225000,
              property_type: 'sfr',
              beds: 3,
              baths: 2,
              sqft: 1400,
              days_on_market: 15,
              metrics: body.include_metrics
                ? {
                    cap_rate: 7.2,
                    cash_on_cash: 9.5,
                    monthly_cash_flow: 520,
                    all_in_to_arv: 0.72,
                  }
                : undefined,
            },
          },
          {
            deal_id: crypto.randomUUID(),
            match_score: 85,
            price_score: 88,
            financial_score: 82,
            location_score: 90,
            property_score: 80,
            deal: {
              address: '789 Elm Street',
              city: 'Round Rock',
              state: 'TX',
              list_price: 245000,
              property_type: 'sfr',
              beds: 4,
              baths: 2,
              sqft: 1650,
              days_on_market: 8,
              metrics: body.include_metrics
                ? {
                    cap_rate: 6.8,
                    cash_on_cash: 8.2,
                    monthly_cash_flow: 420,
                    all_in_to_arv: 0.78,
                  }
                : undefined,
            },
          },
        ],
        summary: {
          total_matches: 2,
          avg_match_score: 88.5,
          top_markets: ['Austin', 'Round Rock'],
          filters_applied: {
            min_score: body.min_score,
            limit: body.limit,
          },
        },
      },
      ctx
    );
  } catch (err) {
    return error(err, ctx);
  }
}
