import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

const TENANT_ID = 'a0000000-0000-0000-0000-000000000001';

// Default underwriting assumptions
const DEFAULT_ASSUMPTIONS = {
    down_payment_percent: 25,
    interest_rate: 7.5,
    loan_term_years: 30,
    closing_cost_percent: 3,
    vacancy_rate: 8,
    management_fee_percent: 10,
    maintenance_percent: 5,
    capex_percent: 5,
};

// Validate required fields for analysis
function validateDealForAnalysis(deal: any): { valid: boolean; missingFields: string[] } {
    const missingFields: string[] = [];

    if (!deal.list_price || deal.list_price <= 0) {
        missingFields.push('Purchase Price');
    }
    if (!deal.estimated_rent || deal.estimated_rent <= 0) {
        missingFields.push('Estimated Monthly Rent');
    }

    return {
        valid: missingFields.length === 0,
        missingFields
    };
}

function calculateMetrics(deal: {
    list_price: number;
    estimated_rent?: number | null;
    tax_annual?: number | null;
    insurance_annual?: number | null;
    hoa_monthly?: number | null;
}) {
    const price = deal.list_price;
    const monthlyRent = deal.estimated_rent || 0;
    const annualRent = monthlyRent * 12;

    // Expenses
    const annualTax = deal.tax_annual || price * 0.012;
    const annualInsurance = deal.insurance_annual || price * 0.005;
    const annualHOA = (deal.hoa_monthly || 0) * 12;
    const vacancyLoss = annualRent * (DEFAULT_ASSUMPTIONS.vacancy_rate / 100);
    const managementFee = annualRent * (DEFAULT_ASSUMPTIONS.management_fee_percent / 100);
    const maintenance = annualRent * (DEFAULT_ASSUMPTIONS.maintenance_percent / 100);
    const capex = annualRent * (DEFAULT_ASSUMPTIONS.capex_percent / 100);

    const totalExpenses = annualTax + annualInsurance + annualHOA + vacancyLoss + managementFee + maintenance + capex;
    const noi = annualRent - totalExpenses;

    // Loan calculations
    const downPayment = price * (DEFAULT_ASSUMPTIONS.down_payment_percent / 100);
    const loanAmount = price - downPayment;
    const closingCosts = price * (DEFAULT_ASSUMPTIONS.closing_cost_percent / 100);
    const totalCashRequired = downPayment + closingCosts;

    const monthlyRate = DEFAULT_ASSUMPTIONS.interest_rate / 100 / 12;
    const numPayments = DEFAULT_ASSUMPTIONS.loan_term_years * 12;
    const monthlyMortgage = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
    const annualDebtService = monthlyMortgage * 12;

    const annualCashFlow = noi - annualDebtService;
    const monthlyCashFlow = annualCashFlow / 12;

    // Key metrics
    const capRate = price > 0 ? (noi / price) * 100 : 0;
    const cashOnCash = totalCashRequired > 0 ? (annualCashFlow / totalCashRequired) * 100 : 0;
    const dscr = annualDebtService > 0 ? noi / annualDebtService : 0;

    return {
        // Metrics that match database schema
        cap_rate: Math.round(capRate * 100) / 100,
        cash_on_cash: Math.round(cashOnCash * 100) / 100,
        dscr: Math.round(dscr * 100) / 100,
        monthly_cash_flow: Math.round(monthlyCashFlow),
        annual_noi: Math.round(noi),
        annual_cash_flow: Math.round(annualCashFlow),
        total_investment: Math.round(totalCashRequired),
        monthly_expenses: Math.round(totalExpenses / 12),
        monthly_noi: Math.round(noi / 12),
        monthly_rent: Math.round(monthlyRent),

        // Store additional metrics in JSON
        metrics_json: {
            grm: Math.round((price / annualRent) * 10) / 10,
            down_payment: Math.round(downPayment),
            loan_amount: Math.round(loanAmount),
            monthly_mortgage: Math.round(monthlyMortgage),
        },
        assumptions_json: DEFAULT_ASSUMPTIONS,
    };
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: dealId } = await params;

        // Fetch the deal
        const { data: deal, error: dealError } = await supabaseAdmin
            .from('deals')
            .select('*')
            .eq('id', dealId)
            .eq('tenant_id', TENANT_ID)
            .single();

        if (dealError || !deal) {
            return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
        }

        // Validate required fields
        const validation = validateDealForAnalysis(deal);
        if (!validation.valid) {
            return NextResponse.json({
                error: 'Cannot analyze deal',
                message: 'This deal is missing required information for financial analysis.',
                missingFields: validation.missingFields
            }, { status: 400 });
        }

        // Calculate metrics
        const metrics = calculateMetrics(deal);

        // Upsert deal_metrics
        const { error: metricsError } = await supabaseAdmin
            .from('deal_metrics')
            .upsert({
                deal_id: dealId,
                ...metrics,
                calculated_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }, { onConflict: 'deal_id' });

        if (metricsError) {
            console.error('Metrics upsert error:', metricsError);
            return NextResponse.json({
                error: 'Failed to save metrics',
                message: 'An error occurred while saving the analysis results.'
            }, { status: 500 });
        }

        // Update deal status to saved
        await supabaseAdmin
            .from('deals')
            .update({ status: 'saved', updated_at: new Date().toISOString() })
            .eq('id', dealId);

        return NextResponse.json({
            success: true,
            metrics,
        });
    } catch (error: unknown) {
        console.error('Analyze error:', error);
        return NextResponse.json({
            error: 'Failed to analyze deal',
            message: 'An unexpected error occurred. Please try again.'
        }, { status: 500 });
    }
}
