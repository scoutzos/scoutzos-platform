/**
 * Question patterns for each discovery cluster
 * Based on ScoutzOS AI Advisor Specification
 */

export const QUESTION_PATTERNS = {
    motivation: {
        initial: "What's your main goal for investing in real estate right now—building long-term wealth, generating monthly income, tax advantages, or making profit from flips?",
        after_capital: "You mentioned having ${amount} to invest. What do you want that money to do for you—generate income, grow over time, or fund a flip for quick profit?",
        for_beginners: "What got you interested in real estate investing? Understanding your 'why' helps me point you in the right direction.",
        binary: "Which matters more right now: getting paid every month, or growing your money faster even if it takes longer to see returns?",
        clarification: "When you say 'build wealth,' are you thinking about properties that appreciate over time, or creating equity quickly through improvements?"
    },

    capital: {
        direct: "How much capital do you have available for your first investment—including down payment, closing costs, and any money for repairs or reserves?",
        soft: "Roughly how much have you set aside for this? We can work with ranges if you're not sure of the exact number.",
        after_goal: "To figure out what's realistic for {goal}, I need to know your starting point. How much cash do you have available to deploy?",
        range_based: "Are we talking under $25K, $25-50K, $50-100K, or more than $100K?",
        reserve_followup: "Of that ${amount}, how much do you want to keep in reserve as a safety net? Most investors keep 3-6 months of expenses liquid."
    },

    credit_income: {
        credit_direct: "What's your approximate credit score? This determines what financing options are available to you.",
        credit_range: "Do you know roughly where your credit falls—under 660, 660-700, 700-740, or above 740?",
        credit_qualitative: "Would you say your credit is generally in good shape, or have there been some challenges recently?",
        income_support: "If this property sat vacant for a few months during repairs or tenant turnover, could your regular income comfortably cover the payments?",
        income_scenario: "Imagine worst case: the property needs 3 months of work and another 2 months to find a tenant. Could you handle 5 months of payments from your other income without stress?"
    },

    activity: {
        time_available: "How much time can you dedicate to this investment—are you doing this full-time, part-time, or is this purely passive alongside your day job?",
        renovation_comfort: "Are you comfortable managing a renovation—coordinating contractors, making decisions, handling problems—or would you prefer something that doesn't need work?",
        simplified: "Do you want to be actively involved in improvements and decisions, or would you rather have someone else handle all of that?",
        experience_check: "Have you managed any renovations or construction projects before, even on your own home?"
    },

    risk: {
        binary: "Would you prefer a safer project with smaller but predictable returns, or a higher-risk project that could make significantly more if it goes well?",
        market_based: "When you think about the neighborhood, would you rather invest in an established, stable area with moderate returns, or an up-and-coming area where prices are lower but there's more uncertainty?",
        loss_tolerance: "What's the most you'd be comfortable losing on a single deal if things went sideways—$5K, $15K, $30K, or more?",
        after_geography: "In {market}, would you target established neighborhoods or emerging areas where prices are lower but tenants might be less predictable?"
    },

    geography: {
        open: "Where are you looking to invest—close to where you live, or are you open to other markets if the returns are better?",
        confirm_market: "You mentioned {city}—do you want to stay within the metro area, or are you open to surrounding suburbs and counties too?",
        distance: "How far from home are you willing to go for a property—30 minutes, an hour, or doesn't matter as long as the numbers work?",
        local_vs_national: "Do you want to be able to drive to your property, or would you consider investing anywhere in the country if you had the right team on the ground?"
    },

    timeline: {
        first_deal: "How soon are you looking to make your first purchase—ready to move now, within 3-6 months, or still in learning mode?",
        readiness: "If we found the right deal this week, would you be ready to move on it, or do you need more time to prepare?",
        capital_return: "How soon do you need to see your money come back—within 6 months, a year, or are you fine with it being tied up longer for a bigger payoff?",
        strategy_confirmation_flip: "With a flip, your money comes back when you sell—usually 6-10 months. Does that timeline work for your situation?",
        strategy_confirmation_hold: "If you're holding long-term, your cash stays in the property as equity. Is that okay, or do you want a strategy where you can pull your capital back out?"
    }
};

export function getQuestionForCluster(
    cluster: string,
    context: {
        profile: any;
        previousAnswer?: string;
        entryPoint?: string;
    }
): string {
    const patterns = QUESTION_PATTERNS[cluster as keyof typeof QUESTION_PATTERNS];
    if (!patterns) return '';

    // Type-safe pattern selection
    if (cluster === 'motivation') {
        const motivationPatterns = patterns as typeof QUESTION_PATTERNS.motivation;
        if (context.profile?.capital?.cash_available) {
            return motivationPatterns.after_capital.replace('${amount}', context.profile.capital.cash_available.toLocaleString());
        }
        if (context.entryPoint === 'beginner') {
            return motivationPatterns.for_beginners;
        }
        return motivationPatterns.initial;
    }

    if (cluster === 'capital') {
        const capitalPatterns = patterns as typeof QUESTION_PATTERNS.capital;
        if (context.profile?.motivation?.primary_goal) {
            return capitalPatterns.after_goal.replace('{goal}', context.profile.motivation.primary_goal);
        }
        return capitalPatterns.direct;
    }

    // Default to first pattern
    return Object.values(patterns)[0] as string;
}
