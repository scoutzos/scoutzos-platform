import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { analyzeDeal, UnderwritingAssumptions, DEFAULT_ASSUMPTIONS } from '@/lib/services/underwriting';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dealId } = await params;

    const { data: deal, error: dealError } = await supabaseAdmin
      .from('deals')
      .select('*')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    const missingFields: string[] = [];
    if (!deal.list_price || deal.list_price <= 0) {
      missingFields.push('List Price');
    }
    if (!deal.estimated_rent || deal.estimated_rent <= 0) {
      missingFields.push('Estimated Monthly Rent');
    }

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          missingFields,
          message: `Cannot analyze deal. Missing: ${missingFields.join(', ')}`
        },
        { status: 400 }
      );
    }

    // Parse custom assumptions from request body
    let customAssumptions: Partial<UnderwritingAssumptions> = {};
    try {
      const body = await request.json();
      if (body.assumptions) {
        customAssumptions = body.assumptions;
      }
    } catch {
      // No body or invalid JSON, use defaults
    }

    // Use the underwriting service to calculate analysis
    const analysis = analyzeDeal(
      {
        purchasePrice: Number(deal.list_price),
        estimatedRent: Number(deal.estimated_rent),
        propertyTaxes: deal.tax_annual || Number(deal.list_price) * 0.012,
        insurance: deal.insurance_annual || Number(deal.list_price) * 0.005,
        hoa: (deal.hoa_monthly || 0) * 12,
      },
      customAssumptions
    );

    // Save metrics to database
    const metricsData = {
      tenant_id: deal.tenant_id,
      deal_id: dealId,
      purchase_price: analysis.purchasePrice,
      monthly_rent: analysis.estimatedRent,
      annual_expenses: analysis.totalMonthlyExpenses * 12,
      noi: analysis.noi,
      cap_rate: analysis.capRate,
      cash_on_cash: analysis.cashOnCash,
      dscr: analysis.dscr,
      monthly_cash_flow: analysis.monthlyCashFlow,
      annual_cash_flow: analysis.annualCashFlow,
      total_cash_required: analysis.totalCashRequired,
      loan_amount: analysis.loanAmount,
      down_payment: analysis.downPayment,
      monthly_debt_service: analysis.monthlyMortgage,
      assumptions: analysis.assumptions,
      expense_breakdown: analysis.expenses,
      calculated_at: new Date().toISOString(),
    };

    // Use upsert to handle both insert and update cases
    const { error: upsertError } = await supabaseAdmin
      .from('deal_metrics')
      .upsert(metricsData, { onConflict: 'deal_id' });

    if (upsertError) {
      console.error('Error saving metrics:', upsertError);
      // Don't fail the request - we still have the analysis to return
    }

    // Return in the format the frontend expects
    return NextResponse.json({
      success: true,
      analysis,
      calculated_at: metricsData.calculated_at,
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Analysis failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dealId } = await params;

    const { data: metrics, error } = await supabaseAdmin
      .from('deal_metrics')
      .select('*')
      .eq('deal_id', dealId)
      .single();

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
    }

    if (!metrics) {
      return NextResponse.json({ error: 'No analysis found', needsAnalysis: true }, { status: 404 });
    }

    return NextResponse.json({ metrics });
  } catch (error) {
    console.error('Fetch metrics error:', error);
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
  }
}
