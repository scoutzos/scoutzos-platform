import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export interface MatchResult {
    deal_id: string;
    score: number; // 0-100
    reasons: string[];
    deal_data: any;
}

export async function findMatchingDeals(buyBox: any, limit: number = 3): Promise<MatchResult[]> {
    // In a real scenario, we would use a sophisticated search query or vector search.
    // For now, we'll fetch recent deals and score them in memory or use basic SQL filters.

    // 1. Build base query
    let query = supabaseAdmin.from('deals').select('*').eq('status', 'active');

    // Apply hard filters if possible (e.g., price range)
    if (buyBox.price_range) {
        query = query.gte('list_price', buyBox.price_range[0]);
        query = query.lte('list_price', buyBox.price_range[1]);
    }

    // Execute query
    const { data: deals, error } = await query.limit(50);

    if (error || !deals) {
        console.error('Error fetching deals for matching:', error);
        return [];
    }

    // 2. Score deals
    const scoredDeals = deals.map(deal => {
        let score = 0;
        const reasons: string[] = [];

        // Price Score (30%)
        if (deal.list_price >= buyBox.price_range[0] && deal.list_price <= buyBox.price_range[1]) {
            score += 30;
            reasons.push('Price within range');
        }

        // Property Type Score (20%)
        // Mapping might be needed, assuming simple string match for now
        if (buyBox.property_types && buyBox.property_types.some((t: string) => deal.property_type.toLowerCase().includes(t.replace('_', ' ')))) {
            score += 20;
            reasons.push('Property type match');
        }

        // Location Score (20%) - Very basic check
        if (buyBox.markets && buyBox.markets.some((m: string) => deal.city.toLowerCase().includes(m.split(',')[0].toLowerCase().trim()))) {
            score += 20;
            reasons.push('Location match');
        }

        // Metric Score (30%) - Check Cap Rate or Cash Flow if available
        // This assumes we have these metrics calculated on the deal record or we calculate them on the fly.
        // For simplicity, let's check if the deal has *any* positive cash flow potential (mock logic)
        // In reality, we'd use the `deal.cap_rate` if stored.

        // Let's assume we want at least some return
        score += 10; // Base points for being an active deal

        return {
            deal_id: deal.id,
            score,
            reasons,
            deal_data: deal
        };
    });

    // 3. Sort and return top N
    return scoredDeals
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
}
