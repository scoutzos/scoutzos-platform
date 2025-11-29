import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import OpenAI from 'openai';
import { ANALYSIS_SYSTEM_PROMPT, ANALYSIS_DISCLAIMERS } from '@/lib/prompts/analysis/system';
import { validateAnalysisResponse, calculateConfidence, type AnalysisModeResponse } from '@/lib/prompts/analysis/schemas';

// Initialize OpenAI if API key is available
const openai = process.env.OPENAI_API_KEY
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

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

        // Check if OpenAI is configured
        if (!openai) {
            return NextResponse.json(
                { error: 'AI insights unavailable - OPENAI_API_KEY not configured' },
                { status: 503 }
            );
        }

        // Build the context message
        const contextMessage = buildContextMessage(deal, metrics);

        // Call OpenAI API with comprehensive prompt
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            max_tokens: 2000,
            temperature: 0.7,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: ANALYSIS_SYSTEM_PROMPT },
                { role: 'user', content: contextMessage }
            ],
        });

        const responseText = completion.choices[0]?.message?.content || '';

        // Parse and validate response
        let analysisResponse: AnalysisModeResponse;
        try {
            analysisResponse = JSON.parse(responseText);
        } catch (parseError) {
            console.error('Failed to parse AI response:', parseError);
            return NextResponse.json(
                { error: 'AI returned invalid response format' },
                { status: 500 }
            );
        }

        // Validate response
        const validation = validateAnalysisResponse(analysisResponse);
        if (!validation.valid) {
            console.error('AI response validation failed:', validation.errors);

            // Try one more time with explicit instructions
            const retryCompletion = await openai.chat.completions.create({
                model: 'gpt-4o',
                max_tokens: 2000,
                temperature: 0.5,
                response_format: { type: 'json_object' },
                messages: [
                    { role: 'system', content: ANALYSIS_SYSTEM_PROMPT },
                    { role: 'user', content: contextMessage },
                    { role: 'assistant', content: responseText },
                    { role: 'user', content: `Your previous response had validation errors: ${validation.errors.join(', ')}. Please provide a corrected response in the exact JSON format specified.` }
                ],
            });

            const retryText = retryCompletion.choices[0]?.message?.content || '';
            try {
                analysisResponse = JSON.parse(retryText);
                const retryValidation = validateAnalysisResponse(analysisResponse);
                if (!retryValidation.valid) {
                    throw new Error('Retry validation failed');
                }
            } catch {
                return NextResponse.json(
                    { error: 'AI failed to generate valid analysis after retry' },
                    { status: 500 }
                );
            }
        }

        // Log warnings if any
        if (validation.warnings.length > 0) {
            console.warn('[AI Analysis] Warnings:', validation.warnings);
        }

        // Convert to legacy format for compatibility
        const insights: AIInsights = {
            summary: analysisResponse.summary,
            strengths: analysisResponse.strengths,
            risks: analysisResponse.risks,
            recommendation: mapRecommendation(analysisResponse.recommendation),
            generatedAt: new Date().toISOString(),
        };

        // Cache the insights
        try {
            await supabaseAdmin
                .from('deal_insights')
                .upsert({
                    deal_id: dealId,
                    insights: insights,
                    full_analysis: analysisResponse, // Store full response for future use
                    confidence: analysisResponse.confidence,
                    generated_at: new Date().toISOString(),
                }, { onConflict: 'deal_id' });
        } catch (cacheError) {
            console.warn('Could not cache insights:', cacheError);
        }

        // Track performance for learning
        try {
            await supabaseAdmin
                .from('ai_performance_tracking')
                .insert({
                    deal_id: dealId,
                    recommendation: analysisResponse.recommendation,
                    confidence: analysisResponse.confidence,
                    model: 'gpt-4o',
                    prompt_version: '1.0',
                    generated_at: new Date().toISOString(),
                });
        } catch {
            // Performance tracking is optional
        }

        return NextResponse.json({
            insights,
            fullAnalysis: analysisResponse,
            validation: {
                warnings: validation.warnings
            },
            cached: false,
        });
    } catch (error) {
        console.error('Advisor POST error:', error);

        // Check for quota exceeded error
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        if (errorMessage.includes('quota') || errorMessage.includes('429')) {
            return NextResponse.json(
                { error: 'OpenAI quota exceeded - check your billing at platform.openai.com' },
                { status: 429 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to generate insights', details: errorMessage },
            { status: 500 }
        );
    }
}

function buildContextMessage(deal: Record<string, unknown>, metrics: Record<string, unknown> | null): string {
    // Calculate data completeness for confidence scoring
    const hasRent = !!deal.estimated_rent;
    const hasTaxes = !!deal.tax_annual;
    const hasInsurance = !!deal.insurance_annual;
    const hasMetrics = !!metrics;

    const dataCompleteness = [hasRent, hasTaxes, hasInsurance, hasMetrics].filter(Boolean).length / 4;

    return `<context>
DEAL DATA:
{
  "address": "${deal.address_line1}, ${deal.city}, ${deal.state} ${deal.zip}",
  "list_price": ${deal.list_price},
  "property_type": "${deal.property_type || 'Single Family'}",
  "beds": ${deal.beds || 'null'},
  "baths": ${deal.baths || 'null'},
  "sqft": ${deal.sqft || 'null'},
  "year_built": ${deal.year_built || 'null'},
  "days_on_market": ${deal.days_on_market || 'null'},
  "estimated_rent": ${deal.estimated_rent || 'null'},
  "zillow_rent_estimate": ${deal.zillow_rent_estimate || 'null'},
  "rentcast_rent_estimate": ${deal.rentcast_rent_estimate || 'null'},
  "property_taxes": ${deal.tax_annual || 'null'},
  "insurance_estimate": ${deal.insurance_annual || 'null'},
  "hoa": ${deal.hoa_monthly || 'null'}
}

${metrics ? `FINANCIAL METRICS:
{
  "cap_rate": ${metrics.cap_rate},
  "cash_on_cash": ${metrics.cash_on_cash},
  "monthly_cash_flow": ${metrics.monthly_cash_flow},
  "annual_cash_flow": ${metrics.annual_cash_flow},
  "dscr": ${metrics.dscr},
  "noi": ${metrics.noi},
  "total_investment": ${metrics.total_cash_required}
}` : 'FINANCIAL METRICS: Not yet calculated'}

DATA QUALITY:
- Completeness: ${Math.round(dataCompleteness * 100)}%
- Rent estimate source: ${deal.zillow_rent_estimate && deal.rentcast_rent_estimate ? 'Multiple sources' : deal.estimated_rent ? 'Single source' : 'Estimated'}

ANALYSIS INSTRUCTIONS:
1. Calculate all metrics if not provided
2. Compare deal to typical market standards
3. Provide recommendation appropriate to data quality
4. Be conservative—if data is missing, use pessimistic estimates
5. Flag any data that seems unrealistic or requires verification
6. Include specific next steps for due diligence
</context>

Analyze this deal and provide your recommendation in the required JSON format.`;
}

function mapRecommendation(rec: string): 'Buy' | 'Hold' | 'Pass' {
    if (rec === 'STRONG_BUY' || rec === 'BUY') return 'Buy';
    if (rec === 'PASS') return 'Pass';
    return 'Hold';
}
