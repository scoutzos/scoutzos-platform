import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import OpenAI from 'openai';
import { ANALYSIS_SYSTEM_PROMPT, ANALYSIS_DISCLAIMERS } from '@/lib/prompts/analysis/system';
import { validateAnalysisResponse, calculateConfidence, validateBody, analyzeDealSchema, withRateLimit, } from '@/lib/api';
import { getMarketData } from '@/lib/services/market-data';

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
            ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
            : null;

        export async function POST(
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

"property_type": "${deal.property_type || 'Single Family'}",
    "beds": ${ deal.beds || 'null' },
"baths": ${ deal.baths || 'null' },
"sqft": ${ deal.sqft || 'null' },
"year_built": ${ deal.year_built || 'null' },
"days_on_market": ${ deal.days_on_market || 'null' },
"estimated_rent": ${ deal.estimated_rent || 'null' },
"zillow_rent_estimate": ${ deal.zillow_rent_estimate || 'null' },
"rentcast_rent_estimate": ${ deal.rentcast_rent_estimate || 'null' },
"property_taxes": ${ deal.tax_annual || 'null' },
"insurance_estimate": ${ deal.insurance_annual || 'null' },
"hoa": ${ deal.hoa_monthly || 'null' }
}

${
    metrics ? `FINANCIAL METRICS:
{
  "cap_rate": ${metrics.cap_rate},
  "cash_on_cash": ${metrics.cash_on_cash},
  "monthly_cash_flow": ${metrics.monthly_cash_flow},
  "annual_cash_flow": ${metrics.annual_cash_flow},
  "dscr": ${metrics.dscr},
  "noi": ${metrics.noi},
  "total_investment": ${metrics.total_cash_required}
}` : 'FINANCIAL METRICS: Not yet calculated'
}

DATA QUALITY:
- Completeness: ${ Math.round(dataCompleteness * 100) }%
    - Rent estimate source: ${ deal.zillow_rent_estimate && deal.rentcast_rent_estimate ? 'Multiple sources' : deal.estimated_rent ? 'Single source' : 'Estimated' }

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
