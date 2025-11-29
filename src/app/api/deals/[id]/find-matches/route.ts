import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { matchDealToAllBuyBoxes } from '@/lib/services/matching';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: dealId } = await params;

        // Get the deal to find its tenant_id
        const { data: deal, error: dealError } = await supabaseAdmin
            .from('deals')
            .select('tenant_id')
            .eq('id', dealId)
            .single();

        if (dealError || !deal) {
            return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
        }

        const matches = await matchDealToAllBuyBoxes(dealId, deal.tenant_id);
        const matchCount = matches.filter(m => m.is_match).length;

        // Log high-score matches for email alerts
        const highScoreMatches = matches.filter(m => m.match_score >= 80);
        for (const match of highScoreMatches) {
            console.log(`[EMAIL ALERT] Deal ${dealId} matches buy box ${match.buy_box_id} with score ${match.match_score}`);
        }

        return NextResponse.json({
            success: true,
            matches: matchCount,
            results: matches,
        });
    } catch (error: unknown) {
        console.error('Find matches error:', error);
        return NextResponse.json({ error: 'Failed to find matches' }, { status: 500 });
    }
}
