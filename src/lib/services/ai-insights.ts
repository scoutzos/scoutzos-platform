import { UnderwritingResult } from './underwriting';

export interface AIInsights {
    pros: string[];
    cons: string[];
    thesis: string;
}

export function generateInsights(analysis: UnderwritingResult): AIInsights {
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
