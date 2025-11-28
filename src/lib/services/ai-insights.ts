import { UnderwritingResult } from './underwriting';
import { Deal } from '@/types/deals';
import OpenAI from 'openai';

export interface AIInsights {
    pros: string[];
    cons: string[];
    thesis: string;
}

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    dangerouslyAllowBrowser: true // Note: In a real app, we should only call this server-side
});

export async function generateInsights(deal: Deal, analysis: UnderwritingResult): Promise<AIInsights> {
    try {
        if (!process.env.OPENAI_API_KEY) {
            console.warn('OPENAI_API_KEY not found, falling back to rule-based insights');
            return generateRuleBasedInsights(analysis);
        }

        const prompt = `
        Analyze this real estate deal and provide an investment thesis, pros, and cons.
        
        Property Details:
        Address: ${deal.address_line1}, ${deal.city}, ${deal.state}
        List Price: $${deal.list_price}
        Estimated Rent: $${deal.estimated_rent || 'N/A'}
        Property Type: ${deal.property_type || 'N/A'}
        Year Built: ${deal.year_built || 'N/A'}
        
        Underwriting Analysis:
        Cap Rate: ${(analysis.capRate * 100).toFixed(2)}%
        Cash on Cash Return: ${(analysis.cashOnCash * 100).toFixed(2)}%
        Monthly Cash Flow: $${analysis.monthlyCashFlow.toFixed(2)}
        DSCR: ${analysis.dscr.toFixed(2)}
        Total Investment: $${analysis.totalCashRequired.toFixed(2)}
        
        Provide the output in the following JSON format:
        {
            "pros": ["pro1", "pro2", "pro3", "pro4"],
            "cons": ["con1", "con2", "con3", "con4"],
            "thesis": "A 2-3 sentence investment thesis summarizing the opportunity."
        }
        
        Focus on the financial metrics and how they compare to typical market standards (e.g. Cap Rate > 6% is good, DSCR > 1.25 is safe).
        `;

        const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content: "You are an expert real estate investment analyst." }, { role: "user", content: prompt }],
            model: "gpt-4o",
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0].message.content;
        if (content) {
            return JSON.parse(content) as AIInsights;
        }

        throw new Error('No content in OpenAI response');

    } catch (error) {
        console.error('Error generating AI insights:', error);
        return generateRuleBasedInsights(analysis);
    }
}

function generateRuleBasedInsights(analysis: UnderwritingResult): AIInsights {
    const pros: string[] = [];
    const cons: string[] = [];

    // Analyze Cap Rate
    if (analysis.capRate >= 0.08) {
        pros.push(`Strong Cap Rate of ${(analysis.capRate * 100).toFixed(1)}%, indicating good initial yield.`);
    } else if (analysis.capRate < 0.05) {
        cons.push(`Low Cap Rate of ${(analysis.capRate * 100).toFixed(1)}% suggests a premium price or low rents.`);
    }

    // Analyze Cash on Cash
    if (analysis.cashOnCash >= 0.12) {
        pros.push(`Excellent Cash-on-Cash return of ${(analysis.cashOnCash * 100).toFixed(1)}%.`);
    } else if (analysis.cashOnCash < 0.05) {
        cons.push(`Cash-on-Cash return is low at ${(analysis.cashOnCash * 100).toFixed(1)}%.`);
    }

    // Analyze Cash Flow
    if (analysis.monthlyCashFlow > 500) {
        pros.push(`Healthy monthly cash flow of $${analysis.monthlyCashFlow.toFixed(0)}.`);
    } else if (analysis.monthlyCashFlow < 100) {
        cons.push(`Monthly cash flow is thin ($${analysis.monthlyCashFlow.toFixed(0)}), leaving little room for error.`);
    }

    // Analyze DSCR
    if (analysis.dscr >= 1.25) {
        pros.push(`DSCR of ${analysis.dscr} is safe and should satisfy lenders.`);
    } else if (analysis.dscr < 1.1) {
        cons.push(`DSCR of ${analysis.dscr} is risky and may be difficult to finance.`);
    }

    // Generate Thesis
    let thesis = '';
    if (pros.length > cons.length) {
        thesis = 'This property presents a solid investment opportunity with strong fundamentals. The returns exceed typical market benchmarks, making it a candidate for immediate acquisition.';
    } else if (cons.length > pros.length) {
        thesis = 'This property has significant challenges. The current pricing does not support a strong investment case without value-add potential or price negotiation.';
    } else {
        thesis = 'This property is a balanced opportunity. It meets some criteria but falls short on others. Further due diligence is required to validate assumptions.';
    }

    return { pros, cons, thesis };
}
