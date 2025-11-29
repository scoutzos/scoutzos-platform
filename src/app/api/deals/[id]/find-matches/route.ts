import { NextRequest, NextResponse } from 'next/server';
import { matchDealToAllBuyBoxes } from '@/lib/services/matching';

const TENANT_ID = 'a0000000-0000-0000-0000-000000000001';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: dealId } = await params;

        const matches = await matchDealToAllBuyBoxes(dealId, TENANT_ID);
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
