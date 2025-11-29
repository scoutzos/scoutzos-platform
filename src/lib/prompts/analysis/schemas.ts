/**
 * JSON Schema definitions for Analysis Mode responses
 */

export interface AnalysisModeResponse {
    recommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'PASS';
    confidence: number; // 0-100
    summary: string;
    strengths: string[];
    risks: string[];
    metrics: {
        monthly_cash_flow: number;
        annual_cash_flow: number;
        cap_rate: number;
        cash_on_cash: number;
        dscr: number;
        total_investment: number;
        monthly_rent: number;
        monthly_expenses: number;
        monthly_mortgage: number;
    };
    assumptions: {
        vacancy_rate: number;
        maintenance_rate: number;
        management_rate: number;
        insurance_annual: number;
        taxes_annual: number;
        down_payment_percent: number;
        interest_rate: number;
        loan_term_years: number;
    };
    next_steps: string[];
    deal_fit: {
        matches_buy_box: boolean;
        fit_score: number; // 0-100
        fit_notes: string;
    };
    warnings: string[];
}

export function validateAnalysisResponse(response: any): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!response.recommendation) errors.push('Missing required field: recommendation');
    if (!['STRONG_BUY', 'BUY', 'HOLD', 'PASS'].includes(response.recommendation)) {
        errors.push(`Invalid recommendation: ${response.recommendation}`);
    }

    if (typeof response.confidence !== 'number' || response.confidence < 0 || response.confidence > 100) {
        errors.push('Confidence must be a number between 0-100');
    }

    if (!response.summary || response.summary.length < 50) {
        errors.push('Summary must be at least 50 characters');
    }

    if (!Array.isArray(response.strengths) || response.strengths.length === 0) {
        errors.push('Must provide at least one strength');
    }

    if (!Array.isArray(response.risks) || response.risks.length === 0) {
        errors.push('Must provide at least one risk');
    }

    if (!response.metrics) {
        errors.push('Missing required field: metrics');
    } else {
        // Sanity checks on metrics
        if (response.metrics.cap_rate > 20) {
            warnings.push(`Cap rate seems unrealistic: ${response.metrics.cap_rate}%`);
        }
        if (response.metrics.cash_on_cash > 50) {
            warnings.push(`Cash-on-cash seems unrealistic: ${response.metrics.cash_on_cash}%`);
        }
        if (response.metrics.monthly_cash_flow > response.metrics.monthly_rent) {
            errors.push('Cash flow cannot exceed rent');
        }
    }

    if (!Array.isArray(response.next_steps) || response.next_steps.length === 0) {
        errors.push('Must provide at least one next step');
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}

export function calculateConfidence(
    dataCompleteness: number, // 0-1
    dataQuality: number, // 0-1
    dealClarity: number // 0-1
): number {
    // Weight: 40% completeness, 30% quality, 30% clarity
    const rawScore = (dataCompleteness * 0.4) + (dataQuality * 0.3) + (dealClarity * 0.3);
    return Math.round(rawScore * 100);
}

export interface ScenarioResponse {
    scenario_name: string;
    base_case: {
        monthly_cash_flow: number;
        cash_on_cash: number;
        cap_rate: number;
    };
    scenario_case: {
        monthly_cash_flow: number;
        cash_on_cash: number;
        cap_rate: number;
    };
    delta: {
        monthly_cash_flow: number;
        cash_on_cash: number;
        cap_rate: number;
    };
    analysis: string;
}

export function validateScenarioResponse(response: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!response.scenario_name) errors.push('Missing scenario_name');
    if (!response.base_case) errors.push('Missing base_case');
    if (!response.scenario_case) errors.push('Missing scenario_case');
    if (!response.delta) errors.push('Missing delta');
    if (!response.analysis) errors.push('Missing analysis');

    return {
        valid: errors.length === 0,
        errors
    };
}
