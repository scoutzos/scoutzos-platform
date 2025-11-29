/**
 * Discovery Mode Response Schemas and Validation
 */

export interface InvestorProfile {
    motivation: {
        primary_goal: 'wealth_building' | 'monthly_income' | 'tax_advantages' | 'quick_profit' | 'scale_portfolio' | null;
        secondary_goal: string | null;
        why_now: string | null;
    };
    capital: {
        cash_available: number | null;
        reserve_target: number | null;
        partner_access: boolean | null;
    };
    credit_income: {
        credit_score_band: 'below_620' | '620_659' | '660_699' | '700_739' | '740_plus' | 'unknown' | null;
        income_type: 'w2' | 'self_employed' | 'retired' | 'mixed' | null;
        can_cover_vacancy: boolean | null;
    };
    activity: {
        time_available: 'full_time' | 'part_time' | 'minimal' | 'none' | null;
        renovation_comfort: 'manage_myself' | 'hire_gc' | 'no_renovation' | null;
    };
    risk: {
        risk_comfort: 'conservative' | 'moderate' | 'aggressive' | null;
        market_preference: 'a_class' | 'b_class' | 'c_class' | 'emerging' | null;
    };
    geography: {
        location_constraint: 'local_only' | 'regional' | 'national' | null;
        home_market: string | null;
        max_distance_miles: number | null;
    };
    timeline: {
        first_deal_timeline: 'asap' | '3_months' | '6_months' | '1_year' | 'just_learning' | null;
        capital_return_need: '6_months' | '1_year' | '2_years' | '5_plus' | 'no_rush' | null;
    };
}

export interface DiscoveryModeResponse {
    message: string;
    extracted_data: Partial<InvestorProfile>;
    next_question_cluster: 'motivation' | 'capital' | 'credit_income' | 'activity' | 'risk' | 'geography' | 'timeline' | null;
    ready_for_recommendation: boolean;
    detected_intent: 'continue_discovery' | 'wants_recommendation' | 'has_specific_deal' | 'needs_education' | 'off_topic';
    confidence: number;
    suggested_responses?: string[];
    deal_reference?: string;
    education_topic?: string;
}

export function validateDiscoveryResponse(response: any): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!response.message || response.message.length < 10) {
        errors.push('Message must be at least 10 characters');
    }

    if (!response.extracted_data) {
        errors.push('Missing required field: extracted_data');
    }

    if (typeof response.ready_for_recommendation !== 'boolean') {
        errors.push('ready_for_recommendation must be boolean');
    }

    if (!response.detected_intent) {
        errors.push('Missing required field: detected_intent');
    }

    if (typeof response.confidence !== 'number' || response.confidence < 0 || response.confidence > 100) {
        errors.push('Confidence must be a number between 0-100');
    }

    // Validate extracted data types
    if (response.extracted_data) {
        const { capital } = response.extracted_data;
        if (capital?.cash_available && (capital.cash_available < 0 || capital.cash_available > 100000000)) {
            warnings.push(`Capital amount seems unrealistic: ${capital.cash_available}`);
        }
    }

    // Check for premature recommendation
    if (response.ready_for_recommendation && !hasMinimumProfile(response.extracted_data)) {
        warnings.push('Marked ready but profile incomplete');
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}

export function hasMinimumProfile(profile: Partial<InvestorProfile>): boolean {
    // Minimum: motivation + capital + one of (credit/timeline/geography)
    const hasMotivation = !!profile.motivation?.primary_goal;
    const hasCapital = !!profile.capital?.cash_available;
    const hasCredit = !!profile.credit_income?.credit_score_band;
    const hasTimeline = !!profile.timeline?.first_deal_timeline;
    const hasGeography = !!profile.geography?.home_market;

    return hasMotivation && hasCapital && (hasCredit || hasTimeline || hasGeography);
}

export function calculateProfileCompleteness(profile: Partial<InvestorProfile>): {
    completeness: number;
    clustersComplete: number;
    missingClusters: string[];
} {
    const clusters = {
        motivation: !!profile.motivation?.primary_goal,
        capital: !!profile.capital?.cash_available,
        credit_income: !!profile.credit_income?.credit_score_band,
        activity: !!profile.activity?.time_available,
        risk: !!profile.risk?.risk_comfort,
        geography: !!profile.geography?.home_market,
        timeline: !!profile.timeline?.first_deal_timeline
    };

    const clustersComplete = Object.values(clusters).filter(Boolean).length;
    const missingClusters = Object.entries(clusters)
        .filter(([_, complete]) => !complete)
        .map(([cluster]) => cluster);

    return {
        completeness: clustersComplete / 7,
        clustersComplete,
        missingClusters
    };
}

export function getNextPriorityCluster(profile: Partial<InvestorProfile>): string | null {
    // Priority order for asking questions
    const priorityOrder = [
        'motivation',
        'capital',
        'geography',
        'timeline',
        'credit_income',
        'activity',
        'risk'
    ];

    const { missingClusters } = calculateProfileCompleteness(profile);

    for (const cluster of priorityOrder) {
        if (missingClusters.includes(cluster)) {
            return cluster;
        }
    }

    return null;
}
