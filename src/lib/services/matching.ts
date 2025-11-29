import { supabaseAdmin } from '@/lib/supabase/admin';

export interface Deal {
    id: string;
    address_line1: string;
    city: string;
    state: string;
    zip: string;
    property_type: string | null;
    beds: number | null;
    baths: number | null;
    sqft: number | null;
    year_built: number | null;
    list_price: number;
    hoa_monthly: number | null;
    estimated_rent: number | null;
}

export interface DealMetrics {
    cap_rate: number | null;
    cash_on_cash: number | null;
    dscr: number | null;
    monthly_cash_flow: number | null;
}

export interface BuyBox {
    id: string;
    investor_id: string;
    user_id: string;
    name: string;
    markets: string[];
    property_types: string[];
    min_price: number | null;
    max_price: number | null;
    min_beds: number | null;
    max_beds: number | null;
    min_baths: number | null;
    max_baths: number | null;
    min_sqft: number | null;
    max_sqft: number | null;
    min_year_built: number | null;
    max_year_built: number | null;
    target_cap_rate: number | null;
    target_cash_on_cash: number | null;
    min_dscr: number | null;
    max_hoa: number | null;
    exclude_hoa: boolean;
    is_active: boolean;
}

export interface MatchReason {
    category: string;
    description: string;
    points: number;
    maxPoints: number;
}

export interface MatchResult {
    buy_box_id: string;
    buy_box_name: string;
    investor_id: string;
    match_score: number;
    match_reasons: MatchReason[];
    is_match: boolean;
    is_strong_match: boolean;
}

const WEIGHTS = { market: 25, price: 25, propertyType: 15, size: 10, financials: 25 };

export function scoreMarketMatch(deal: Deal, buyBox: BuyBox): MatchReason {
    const maxPoints = WEIGHTS.market;
    if (!buyBox.markets || buyBox.markets.length === 0) {
        return { category: 'Market', description: 'No market restrictions', points: maxPoints, maxPoints };
    }
    const dealCity = deal.city.toLowerCase().trim();
    const dealState = deal.state.toLowerCase().trim();
    for (const market of buyBox.markets) {
        const norm = market.toLowerCase().trim();
        if (norm === dealCity || norm === dealState || norm === deal.zip || norm === `${dealCity}, ${dealState}`) {
            return { category: 'Market', description: `Location matches: ${market}`, points: maxPoints, maxPoints };
        }
    }
    return { category: 'Market', description: 'Location not in target markets', points: 0, maxPoints };
}

export function scorePriceMatch(deal: Deal, buyBox: BuyBox): MatchReason {
    const maxPoints = WEIGHTS.price;
    const price = deal.list_price;
    if (!buyBox.min_price && !buyBox.max_price) {
        return { category: 'Price', description: 'No price restrictions', points: maxPoints, maxPoints };
    }
    const minPrice = buyBox.min_price || 0;
    const maxPrice = buyBox.max_price || Infinity;
    if (price >= minPrice && price <= maxPrice) {
        return { category: 'Price', description: `Price $${price.toLocaleString()} within range`, points: maxPoints, maxPoints };
    }
    if (price < minPrice) {
        const pct = ((minPrice - price) / minPrice) * 100;
        if (pct <= 10) return { category: 'Price', description: `Price slightly below minimum`, points: Math.round(maxPoints * 0.5), maxPoints };
    }
    if (price > maxPrice) {
        const pct = ((price - maxPrice) / maxPrice) * 100;
        if (pct <= 10) return { category: 'Price', description: `Price slightly above maximum`, points: Math.round(maxPoints * 0.5), maxPoints };
    }
    return { category: 'Price', description: `Price outside target range`, points: 0, maxPoints };
}

export function scoreTypeMatch(deal: Deal, buyBox: BuyBox): MatchReason {
    const maxPoints = WEIGHTS.propertyType;
    if (!buyBox.property_types || buyBox.property_types.length === 0) {
        return { category: 'Property Type', description: 'No property type restrictions', points: maxPoints, maxPoints };
    }
    if (!deal.property_type) {
        return { category: 'Property Type', description: 'Property type unknown', points: Math.round(maxPoints * 0.5), maxPoints };
    }
    const matches = buyBox.property_types.some(t => t.toLowerCase() === deal.property_type!.toLowerCase());
    if (matches) return { category: 'Property Type', description: `${deal.property_type} matches criteria`, points: maxPoints, maxPoints };
    return { category: 'Property Type', description: `${deal.property_type} not in target types`, points: 0, maxPoints };
}

export function scoreSizeMatch(deal: Deal, buyBox: BuyBox): MatchReason {
    const maxPoints = WEIGHTS.size;
    let points = 0;
    const reasons: string[] = [];
    if (deal.beds !== null) {
        const inRange = (!buyBox.min_beds || deal.beds >= buyBox.min_beds) && (!buyBox.max_beds || deal.beds <= buyBox.max_beds);
        if (inRange) { points += maxPoints * 0.4; reasons.push(`${deal.beds} beds`); }
    } else if (!buyBox.min_beds && !buyBox.max_beds) points += maxPoints * 0.4;
    if (deal.baths !== null) {
        const inRange = (!buyBox.min_baths || deal.baths >= buyBox.min_baths) && (!buyBox.max_baths || deal.baths <= buyBox.max_baths);
        if (inRange) { points += maxPoints * 0.3; reasons.push(`${deal.baths} baths`); }
    } else if (!buyBox.min_baths && !buyBox.max_baths) points += maxPoints * 0.3;
    if (deal.sqft !== null) {
        const inRange = (!buyBox.min_sqft || deal.sqft >= buyBox.min_sqft) && (!buyBox.max_sqft || deal.sqft <= buyBox.max_sqft);
        if (inRange) { points += maxPoints * 0.3; reasons.push(`${deal.sqft.toLocaleString()} sqft`); }
    } else if (!buyBox.min_sqft && !buyBox.max_sqft) points += maxPoints * 0.3;
    return { category: 'Size', description: reasons.length > 0 ? `Size matches: ${reasons.join(', ')}` : 'Size criteria not met', points: Math.round(points), maxPoints };
}

export function scoreFinancialsMatch(deal: Deal, metrics: DealMetrics | null, buyBox: BuyBox): MatchReason {
    const maxPoints = WEIGHTS.financials;
    if (!metrics) return { category: 'Financials', description: 'Financial metrics not yet calculated', points: 0, maxPoints };
    let points = 0;
    const reasons: string[] = [];
    if (metrics.cap_rate !== null && buyBox.target_cap_rate) {
        if (metrics.cap_rate >= buyBox.target_cap_rate) { points += maxPoints * 0.35; reasons.push(`Cap rate ${metrics.cap_rate}%`); }
        else if (metrics.cap_rate >= buyBox.target_cap_rate * 0.9) { points += maxPoints * 0.2; reasons.push(`Cap rate ${metrics.cap_rate}% (near target)`); }
    } else if (!buyBox.target_cap_rate) points += maxPoints * 0.35;
    if (metrics.cash_on_cash !== null && buyBox.target_cash_on_cash) {
        if (metrics.cash_on_cash >= buyBox.target_cash_on_cash) { points += maxPoints * 0.35; reasons.push(`CoC ${metrics.cash_on_cash}%`); }
        else if (metrics.cash_on_cash >= buyBox.target_cash_on_cash * 0.9) { points += maxPoints * 0.2; reasons.push(`CoC ${metrics.cash_on_cash}% (near target)`); }
    } else if (!buyBox.target_cash_on_cash) points += maxPoints * 0.35;
    if (metrics.dscr !== null && buyBox.min_dscr) {
        if (metrics.dscr >= buyBox.min_dscr) { points += maxPoints * 0.3; reasons.push(`DSCR ${metrics.dscr}`); }
    } else if (!buyBox.min_dscr) points += maxPoints * 0.3;
    if (buyBox.exclude_hoa && deal.hoa_monthly && deal.hoa_monthly > 0) { points = Math.max(0, points - maxPoints * 0.2); reasons.push('Has HOA (penalty)'); }
    return { category: 'Financials', description: reasons.length > 0 ? reasons.join(', ') : 'Financial criteria not met', points: Math.round(points), maxPoints };
}

export function scoreDealForBuyBox(deal: Deal, metrics: DealMetrics | null, buyBox: BuyBox): MatchResult {
    const reasons: MatchReason[] = [
        scoreMarketMatch(deal, buyBox),
        scorePriceMatch(deal, buyBox),
        scoreTypeMatch(deal, buyBox),
        scoreSizeMatch(deal, buyBox),
        scoreFinancialsMatch(deal, metrics, buyBox),
    ];
    const totalPoints = reasons.reduce((sum, r) => sum + r.points, 0);
    const maxPoints = reasons.reduce((sum, r) => sum + r.maxPoints, 0);
    const matchScore = Math.round((totalPoints / maxPoints) * 100);
    return { buy_box_id: buyBox.id, buy_box_name: buyBox.name, investor_id: buyBox.investor_id, match_score: matchScore, match_reasons: reasons, is_match: matchScore >= 50, is_strong_match: matchScore >= 75 };
}

export async function matchDealToAllBuyBoxes(dealId: string, tenantId: string): Promise<MatchResult[]> {
    const { data: deal, error: dealError } = await supabaseAdmin.from('deals').select('*').eq('id', dealId).single();
    if (dealError || !deal) throw new Error(`Deal not found: ${dealId}`);
    const { data: metricsRow } = await supabaseAdmin.from('deal_metrics').select('*').eq('deal_id', dealId).single();
    const metrics: DealMetrics | null = metricsRow ? { cap_rate: metricsRow.cap_rate, cash_on_cash: metricsRow.cash_on_cash, dscr: metricsRow.dscr, monthly_cash_flow: metricsRow.monthly_cash_flow } : null;
    const { data: buyBoxes, error: buyBoxError } = await supabaseAdmin.from('buy_boxes').select('*').eq('tenant_id', tenantId).eq('is_active', true);
    if (buyBoxError) throw new Error(`Failed to fetch buy boxes: ${buyBoxError.message}`);
    if (!buyBoxes || buyBoxes.length === 0) return [];
    const results: MatchResult[] = [];
    for (const buyBox of buyBoxes) {
        const result = scoreDealForBuyBox(deal as Deal, metrics, buyBox as BuyBox);
        results.push(result);
        await supabaseAdmin.from('deal_matches').upsert({ deal_id: dealId, buy_box_id: buyBox.id, user_id: buyBox.user_id, match_score: result.match_score, match_reasons: result.match_reasons }, { onConflict: 'deal_id,user_id' });

        // Trigger email alert for high-score matches (>= 80%)
        if (result.match_score >= 80) {
            console.log(`[EMAIL ALERT] Deal ${dealId} matches buy box ${buyBox.id} (${buyBox.name}) with score ${result.match_score}%`);
            // Optionally call the email API endpoint
            // await fetch('/api/alerts/send-match-email', { method: 'POST', body: JSON.stringify({ deal_id: dealId, buy_box_id: buyBox.id, match_score: result.match_score }) });
        }
    }
    results.sort((a, b) => b.match_score - a.match_score);
    return results;
}

export async function getMatchesForDeal(dealId: string): Promise<MatchResult[]> {
    const { data: matches, error } = await supabaseAdmin.from('deal_matches').select('*, buy_box:buy_boxes(id, name, investor_id)').eq('deal_id', dealId).order('match_score', { ascending: false });
    if (error) throw new Error(`Failed to fetch matches: ${error.message}`);
    return (matches || []).map(m => ({ buy_box_id: m.buy_box_id, buy_box_name: m.buy_box?.name || 'Unknown', investor_id: m.buy_box?.investor_id || m.user_id, match_score: m.match_score, match_reasons: m.match_reasons || [], is_match: m.match_score >= 50, is_strong_match: m.match_score >= 75 }));
}
