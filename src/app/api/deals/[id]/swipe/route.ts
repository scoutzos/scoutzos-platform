import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin, getTenantIdForUser } from '@/lib/supabase/admin';
import { matchDealToAllBuyBoxes } from '@/lib/services/matching';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: dealId } = await params;
        const { action } = await request.json(); // 'save' or 'pass'

        if (!action || !['save', 'pass'].includes(action)) {
            return NextResponse.json({ error: 'Invalid action. Must be "save" or "pass"' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const tenantId = await getTenantIdForUser(user.id);
        if (!tenantId) {
            return NextResponse.json({ error: 'User not associated with a tenant' }, { status: 403 });
        }

        const newStatus = action === 'save' ? 'saved' : 'passed';

        // Update deal status
        const { data: deal, error } = await supabaseAdmin
            .from('deals')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('id', dealId)
            .eq('tenant_id', tenantId)
            .select()
            .single();

        if (error) {
            return NextResponse.json(
                { error: error.code === 'PGRST116' ? 'Deal not found' : 'Failed to update deal' },
                { status: error.code === 'PGRST116' ? 404 : 500 }
            );
        }

        let matchCount = 0;
        let topScore = 0;

        // If saved, run matching and create notification
        if (action === 'save') {
            try {
                const matches = await matchDealToAllBuyBoxes(dealId, tenantId);

                if (matches && matches.length > 0) {
                    const topMatch = matches[0]; // Already sorted by score
                    matchCount = matches.length;
                    topScore = topMatch.match_score;

                    // Create notification for match
                    await supabaseAdmin.from('notifications').insert({
                        user_id: user.id,
                        tenant_id: tenantId,
                        type: 'match',
                        title: 'New Match Found',
                        message: `${deal.address_line1} matches a buy box with score ${topMatch.match_score}%`,
                        data: {
                            deal_id: dealId,
                            match_count: matches.length,
                            top_score: topMatch.match_score,
                            buy_box_id: topMatch.buy_box_id,
                            buy_box_name: topMatch.buy_box_name,
                        },
                        is_read: false,
                        created_at: new Date().toISOString(),
                    });
                }
            } catch (matchError) {
                // Log but don't fail the swipe if matching fails
                console.error('Matching error (non-fatal):', matchError);
            }
        }

        return NextResponse.json({
            success: true,
            status: newStatus,
            match_count: matchCount,
            top_score: topScore,
        });
    } catch (error: unknown) {
        console.error('Swipe error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
