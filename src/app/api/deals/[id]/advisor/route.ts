import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

interface AIInsights {
    summary: string;
    strengths: string[];
    risks: string[];
    recommendation: 'Buy' | 'Hold' | 'Pass';
    generatedAt: string;
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: dealId } = await params;

        // Check if we have cached insights
        const { data: existingInsights } = await supabaseAdmin
            .from('deal_insights')
            .select('*')
            .eq('deal_id', dealId)
            .single();

        if (existingInsights) {
            return NextResponse.json({
                insights: existingInsights.insights,
                cached: true,
            });
        }

        return NextResponse.json({ insights: null, needsGeneration: true });
    } catch (error) {
        console.error('Advisor GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch insights' }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: dealId } = await params;

        // Fetch deal data
        const { data: deal, error: dealError } = await supabaseAdmin
            .from('deals')
            .select('*')
            .eq('id', dealId)
            .single();

        if (dealError || !deal) {
            return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
        }

        // Fetch metrics if available
        const { data: metrics } = await supabaseAdmin
            .from('deal_metrics')
            .select('*')
            .eq('deal_id', dealId)
            .single();

        // Build the prompt
        const prompt = buildPrompt(deal, metrics);

        // Call Claude API
        const message = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            messages: [{ role: 'user', content: prompt }],
        });

        const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
        const insights = parseInsights(responseText);

        // Cache the insights
        try {
            await supabaseAdmin
                .from('deal_insights')
                .upsert({
                    deal_id: dealId,
                    insights: insights,
                    generated_at: new Date().toISOString(),
                }, { onConflict: 'deal_id' });
        } catch {
            // Table might not exist, that's ok - we still return the insights
            console.warn('Could not cache insights - deal_insights table may not exist');
        }

        return NextResponse.json({
            insights,
            cached: false,
        });
    } catch (error) {
        console.error('Advisor POST error:', error);
        return NextResponse.json(
            { error: 'Failed to generate insights', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

function buildPrompt(deal: Record<string, unknown>, metrics: Record<string, unknown> | null): string {
    return `You are a real estate investment advisor. Analyze this property and provide investment insights.

PROPERTY DETAILS:
- Address: ${deal.address_line1}, ${deal.city}, ${deal.state} ${deal.zip}
- List Price: $${Number(deal.list_price).toLocaleString()}
- Property Type: ${deal.property_type || 'Single Family'}
- Beds: ${deal.beds || 'N/A'} | Baths: ${deal.baths || 'N/A'} | Sqft: ${deal.sqft || 'N/A'}
- Year Built: ${deal.year_built || 'N/A'}
- Days on Market: ${deal.days_on_market || 'N/A'}
- Estimated Rent: $${deal.estimated_rent ? Number(deal.estimated_rent).toLocaleString() : 'N/A'}/month

${metrics ? `
FINANCIAL METRICS:
- Cap Rate: ${metrics.cap_rate || 'N/A'}%
- Cash on Cash Return: ${metrics.cash_on_cash || 'N/A'}%
- Monthly Cash Flow: $${metrics.monthly_cash_flow ? Number(metrics.monthly_cash_flow).toLocaleString() : 'N/A'}
- DSCR: ${metrics.dscr || 'N/A'}
- NOI: $${metrics.noi ? Number(metrics.noi).toLocaleString() : 'N/A'}
` : ''}

Provide your analysis in this exact JSON format:
{
    "summary": "A brief 1-2 sentence summary of the investment opportunity",
    "strengths": ["strength 1", "strength 2", "strength 3"],
    "risks": ["risk 1", "risk 2", "risk 3"],
    "recommendation": "Buy" | "Hold" | "Pass"
}

Be specific and actionable. Consider cap rate benchmarks (6-10% is good), cash flow targets ($200+/month), and DSCR minimums (1.25+).`;
}

function parseInsights(responseText: string): AIInsights {
    try {
        // Try to extract JSON from the response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                summary: parsed.summary || 'Unable to generate summary',
                strengths: parsed.strengths || [],
                risks: parsed.risks || [],
                recommendation: parsed.recommendation || 'Hold',
                generatedAt: new Date().toISOString(),
            };
        }
    } catch {
        console.error('Failed to parse AI response:', responseText);
    }

    // Fallback response
    return {
        summary: 'Unable to generate AI insights at this time.',
        strengths: [],
        risks: [],
        recommendation: 'Hold',
        generatedAt: new Date().toISOString(),
    };
}
