import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin, getTenantIdForUser } from '@/lib/supabase/admin';
import { analyzeDeal, UnderwritingAssumptions, UnderwritingResult } from '@/lib/services/underwriting';
import { generateInsights } from '@/lib/services/ai-insights';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const tenantId = await getTenantIdForUser(user.id);
        if (!tenantId) return NextResponse.json({ error: 'User not associated with a tenant' }, { status: 403 });

        let customAssumptions: Partial<UnderwritingAssumptions> = {};
        try { const body = await request.json(); customAssumptions = body.assumptions || {}; } catch { }

        const { data: deal, error: fetchError } = await supabaseAdmin.from('deals').select('*').eq('id', id).eq('tenant_id', tenantId).single();
        if (fetchError || !deal) return NextResponse.json({ error: 'Deal not found' }, { status: 404 });

        // Check for required fields and return helpful error messages
        const missingFields: string[] = [];
        if (!deal.list_price) missingFields.push('list_price');
        if (!deal.estimated_rent) missingFields.push('estimated_rent (monthly rent estimate)');

        if (missingFields.length > 0) {
            return NextResponse.json({
                error: 'Missing required fields for analysis',
                missingFields,
                message: `This deal is missing: ${missingFields.join(', ')}. Please edit the deal to add these values before running analysis.`,
                deal_id: id
            }, { status: 400 });
        }

        const analysis: UnderwritingResult = analyzeDeal({
            purchasePrice: deal.list_price,
            estimatedRent: deal.estimated_rent,
            propertyTaxes: deal.tax_annual || 0,
            insurance: deal.insurance_annual || 0,
            hoa: deal.hoa_monthly ? deal.hoa_monthly * 12 : 0,
        }, customAssumptions);

        const insights = await generateInsights(deal, analysis);

        await supabaseAdmin.from('deal_metrics').upsert({
            deal_id: id,
            monthly_rent: deal.estimated_rent,
            monthly_expenses: analysis.totalMonthlyExpenses,
            monthly_noi: analysis.noi / 12,
            monthly_cash_flow: analysis.monthlyCashFlow,
            annual_noi: analysis.noi,
            annual_cash_flow: analysis.annualCashFlow,
            cap_rate: analysis.capRate,
            cash_on_cash: analysis.cashOnCash,
            dscr: analysis.dscr,
            total_investment: analysis.totalCashRequired,
            assumptions_json: analysis.assumptions,
            metrics_json: {
                purchasePrice: analysis.purchasePrice,
                downPayment: analysis.downPayment,
                loanAmount: analysis.loanAmount,
                monthlyMortgage: analysis.monthlyMortgage,
                expenses: analysis.expenses,
                insights // Store insights in metrics_json for now so we can retrieve them later
            },
            calculated_at: new Date().toISOString(),
        }, { onConflict: 'deal_id' });

        if (deal.status === 'new') await supabaseAdmin.from('deals').update({ status: 'analyzing' }).eq('id', id);

        return NextResponse.json({ analysis, insights, deal_id: id, calculated_at: new Date().toISOString() });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const tenantId = await getTenantIdForUser(user.id);
        if (!tenantId) return NextResponse.json({ error: 'User not associated with a tenant' }, { status: 403 });

        const { data: deal } = await supabaseAdmin.from('deals').select('id').eq('id', id).eq('tenant_id', tenantId).single();
        if (!deal) return NextResponse.json({ error: 'Deal not found' }, { status: 404 });

        const { data: metrics, error: metricsError } = await supabaseAdmin.from('deal_metrics').select('*').eq('deal_id', id).single();
        if (metricsError?.code === 'PGRST116') return NextResponse.json({ error: 'No analysis found for this deal' }, { status: 404 });

        // Extract insights from metrics_json if available
        const insights = metrics.metrics_json?.insights || null;

        return NextResponse.json({ metrics, insights, deal_id: id });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
