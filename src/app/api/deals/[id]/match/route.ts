import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin, getTenantIdForUser } from '@/lib/supabase/admin';
import { matchDealToAllBuyBoxes, getMatchesForDeal } from '@/lib/services/matching';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const tenantId = await getTenantIdForUser(user.id);
        if (!tenantId) return NextResponse.json({ error: 'User not associated with a tenant' }, { status: 403 });

        const matches = await matchDealToAllBuyBoxes(id, tenantId);

        // Create notifications for strong matches
        const strongMatches = matches.filter(m => m.is_strong_match);
        if (strongMatches.length > 0) {
            const { data: deal } = await supabaseAdmin.from('deals').select('address_line1').eq('id', id).single();
            const dealAddress = deal?.address_line1 || 'Unknown Property';

            for (const match of strongMatches) {
                await supabaseAdmin.from('notifications').insert({
                    user_id: user.id, // In a real app, this might be the investor's user_id
                    type: 'match',
                    title: 'New Strong Match Found!',
                    message: `Deal at ${dealAddress} matches buy box "${match.buy_box_name}" with a score of ${match.match_score}%`,
                    data: { deal_id: id, buy_box_id: match.buy_box_id }
                });
            }
        }

        return NextResponse.json({ deal_id: id, matches, total_matches: matches.length, strong_matches: matches.filter(m => m.is_strong_match).length, matched_at: new Date().toISOString() });
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
    }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const matches = await getMatchesForDeal(id);
        return NextResponse.json({ deal_id: id, matches, total_matches: matches.length });
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
    }
}
