import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { matchDealToAllBuyBoxes } from '@/lib/services/matching';

const TENANT_ID = 'a0000000-0000-0000-0000-000000000001';

interface CSVDeal {
    address_line1: string;
    city: string;
    state: string;
    zip: string;
    list_price: number;
    beds?: number | null;
    baths?: number | null;
    sqft?: number | null;
    year_built?: number | null;
    estimated_rent?: number | null;
}

export async function POST(request: NextRequest) {
    try {
        const { deals } = await request.json() as { deals: CSVDeal[] };

        if (!deals || !Array.isArray(deals) || deals.length === 0) {
            return NextResponse.json({ error: 'No deals provided' }, { status: 400 });
        }

        // Validate deals
        const validDeals = deals.filter(deal =>
            deal.address_line1 &&
            deal.city &&
            deal.state &&
            deal.zip &&
            deal.list_price > 0
        );

        if (validDeals.length === 0) {
            return NextResponse.json({ error: 'No valid deals found in CSV' }, { status: 400 });
        }

        // Prepare deals for insertion
        const dealsToInsert = validDeals.map(deal => ({
            tenant_id: TENANT_ID,
            source: 'csv_import',
            address_line1: deal.address_line1,
            city: deal.city,
            state: deal.state,
            zip: deal.zip,
            list_price: deal.list_price,
            beds: deal.beds || null,
            baths: deal.baths || null,
            sqft: deal.sqft || null,
            year_built: deal.year_built || null,
            estimated_rent: deal.estimated_rent || null,
            status: 'new',
            photos: [],
            created_at: new Date().toISOString(),
        }));

        // Insert all deals
        const { data: insertedDeals, error: insertError } = await supabaseAdmin
            .from('deals')
            .insert(dealsToInsert)
            .select('id');

        if (insertError) {
            console.error('Insert error:', insertError);
            return NextResponse.json({ error: 'Failed to insert deals' }, { status: 500 });
        }

        // Run matching for each deal
        let matchedCount = 0;
        for (const deal of insertedDeals || []) {
            try {
                const matches = await matchDealToAllBuyBoxes(deal.id, TENANT_ID);
                if (matches.some(m => m.is_match)) {
                    matchedCount++;
                }

                // Log high-score matches for email alerts
                const highScoreMatches = matches.filter(m => m.match_score >= 80);
                for (const match of highScoreMatches) {
                    console.log(`[EMAIL ALERT] Deal ${deal.id} matches buy box ${match.buy_box_id} with score ${match.match_score}`);
                }
            } catch (matchError) {
                console.error(`Matching error for deal ${deal.id}:`, matchError);
                // Continue with other deals
            }
        }

        return NextResponse.json({
            imported: insertedDeals?.length || 0,
            matched: matchedCount,
        });
    } catch (error: unknown) {
        console.error('CSV import error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
