import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  success,
  error,
  unauthorized,
  createRequestContext,
  validateBody,
  finalizeDiscoverySchema,
  withRateLimit,
  ApiError,
  ErrorCodes,
} from '@/lib/api';

export async function POST(request: NextRequest) {
  const ctx = createRequestContext();

  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return unauthorized(ctx);
    }

    // Validate request body
    const body = await validateBody(request, finalizeDiscoverySchema);

    // Rate limit check
    const rateLimitResponse = await withRateLimit(request, user.id);
    if (rateLimitResponse) return rateLimitResponse;

    // TODO: Implement finalization logic
    // 1. Fetch session and verify ownership
    // 2. Verify profile_id matches session
    // 3. Mark investor_profile as complete
    // 4. If create_buy_box, create buy box from recommendation
    // 5. Update session status to COMPLETED
    // 6. Return finalized profile and buy box

    // Placeholder response
    const buyBoxId = body.create_buy_box ? crypto.randomUUID() : null;

    return success(
      {
        session: {
          id: body.session_id,
          status: 'COMPLETED',
          completed_at: new Date().toISOString(),
        },
        investor_profile: {
          id: body.profile_id,
          is_complete: true,
          updated_at: new Date().toISOString(),
        },
        buy_box: buyBoxId
          ? {
              id: buyBoxId,
              name: body.buy_box_name || 'My Investment Criteria',
              is_active: true,
              created_at: new Date().toISOString(),
            }
          : null,
        next_steps: [
          {
            action: 'view_matches',
            label: 'View Matching Deals',
            href: buyBoxId ? `/buy-boxes/${buyBoxId}` : '/deals',
          },
          {
            action: 'refine_criteria',
            label: 'Refine Your Criteria',
            href: buyBoxId ? `/buy-boxes/${buyBoxId}/edit` : '/buy-boxes/new',
          },
          {
            action: 'explore_deals',
            label: 'Browse All Deals',
            href: '/deals',
          },
        ],
      },
      ctx
    );
  } catch (err) {
    return error(err, ctx);
  }
}
