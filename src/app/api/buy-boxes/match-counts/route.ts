import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

const TENANT_ID = 'a0000000-0000-0000-0000-000000000001';

export async function GET() {
    try {
        // Get match counts grouped by buy_box_id
        const { data, error } = await supabaseAdmin
            .from('deal_matches')
            .select('buy_box_id')
            .gte('match_score', 50); // Only count actual matches (score >= 50)

        if (error) {
            console.error('Error fetching match counts:', error);
            return NextResponse.json({ error: 'Failed to fetch match counts' }, { status: 500 });
        }

        // Count by buy_box_id
        const counts: Record<string, number> = {};
        (data || []).forEach((row: { buy_box_id: string }) => {
            counts[row.buy_box_id] = (counts[row.buy_box_id] || 0) + 1;
        });

        // Convert to array format
        const result = Object.entries(counts).map(([buy_box_id, count]) => ({
            buy_box_id,
            count,
        }));

        return NextResponse.json(result);
    } catch (error: unknown) {
        console.error('Match counts error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
