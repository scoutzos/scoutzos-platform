/**
 * Fallback Response System
 * Provides graceful degradation when AI calls fail
 */

import type { DiscoveryResponse, AnalysisResponse, ComparisonResponse, RecommendationResponse } from './validation';

// Fallback types
export type FallbackType =
  | 'discovery_parse_error'
  | 'analysis_parse_error'
  | 'comparison_parse_error'
  | 'recommendation_parse_error'
  | 'timeout'
  | 'rate_limit'
  | 'off_topic'
  | 'api_error'
  | 'unknown_error';

// Fallback messages for discovery mode
export const DISCOVERY_FALLBACKS: Record<string, DiscoveryResponse> = {
  parse_error: {
    message: "I want to make sure I understand you correctly. Could you tell me more about what you're looking for in an investment property?",
    extracted_data: {},
    ready_for_recommendation: false,
    detected_intent: 'unclear',
    confidence: 30,
    follow_up_questions: [
      "What type of properties are you most interested in?",
      "What's your investment budget range?",
      "Are you looking for cash flow or appreciation?"
    ],
  },
  timeout: {
    message: "Let me try a simpler approach. What's the single most important thing you're looking for in your next investment?",
    extracted_data: {},
    ready_for_recommendation: false,
    detected_intent: 'unclear',
    confidence: 20,
  },
  off_topic: {
    message: "I'm focused on helping you with real estate investing. Let's get back to building your investment criteria. What markets are you considering?",
    extracted_data: {},
    ready_for_recommendation: false,
    detected_intent: 'off_topic',
    confidence: 80,
  },
  rate_limit: {
    message: "I'm processing a lot of requests right now. Let's continue in just a moment. In the meantime, think about what property types interest you most.",
    extracted_data: {},
    ready_for_recommendation: false,
    detected_intent: 'unclear',
    confidence: 50,
  },
  api_error: {
    message: "I encountered a temporary issue. Let's continue our conversation. Could you repeat what you were telling me about your investment goals?",
    extracted_data: {},
    ready_for_recommendation: false,
    detected_intent: 'unclear',
    confidence: 30,
  },
};

// Fallback responses for analysis mode
export const ANALYSIS_FALLBACKS: Record<string, AnalysisResponse> = {
  parse_error: {
    recommendation: 'HOLD',
    confidence: 30,
    summary: 'Unable to complete full analysis due to a processing error. Please review the property details manually or try again.',
    strengths: ['Manual review recommended'],
    risks: ['Analysis incomplete - additional due diligence required'],
    metrics: {},
    next_steps: [
      'Review property listing details manually',
      'Check comparable sales in the area',
      'Verify financial assumptions',
      'Try running the analysis again',
    ],
  },
  timeout: {
    recommendation: 'HOLD',
    confidence: 20,
    summary: 'Analysis timed out. The property may require more detailed review. Please try again or review manually.',
    strengths: [],
    risks: ['Analysis incomplete due to timeout'],
    metrics: {},
    next_steps: [
      'Try running the analysis again',
      'Break down analysis into smaller components',
      'Review key metrics manually',
    ],
  },
  insufficient_data: {
    recommendation: 'HOLD',
    confidence: 25,
    summary: 'Insufficient data available to provide a confident analysis. Key property or market information may be missing.',
    strengths: [],
    risks: ['Missing critical data points for accurate analysis'],
    metrics: {},
    next_steps: [
      'Gather more property details',
      'Verify financial metrics',
      'Research comparable properties',
    ],
  },
  api_error: {
    recommendation: 'HOLD',
    confidence: 30,
    summary: 'Analysis service temporarily unavailable. Please try again shortly.',
    strengths: [],
    risks: ['Analysis could not be completed'],
    metrics: {},
    next_steps: ['Try again in a few moments'],
  },
};

// Fallback responses for comparison mode
export const COMPARISON_FALLBACKS: Record<string, Partial<ComparisonResponse>> = {
  parse_error: {
    comparison_summary: 'Unable to complete deal comparison due to a processing error. Please review the deals individually.',
    deal_analyses: [],
    recommendation: 'Manual comparison recommended. Review each deal\'s metrics individually.',
  },
  insufficient_deals: {
    comparison_summary: 'Not enough deals provided for comparison. Please select at least 2 deals to compare.',
    deal_analyses: [],
    recommendation: 'Select multiple deals to enable comparison.',
  },
};

// Fallback responses for recommendation mode
export const RECOMMENDATION_FALLBACKS: Record<string, Partial<RecommendationResponse>> = {
  parse_error: {
    strategy_name: 'Custom Strategy',
    strategy_description: 'Unable to generate a specific recommendation. Please provide more details about your investment preferences.',
    reasoning: 'Additional information needed to provide a tailored recommendation.',
    confidence: 25,
  },
  insufficient_profile: {
    strategy_name: 'Getting Started',
    strategy_description: 'We need more information about your investment goals to provide a personalized recommendation.',
    reasoning: 'Your investor profile is incomplete. Please answer a few more questions.',
    confidence: 20,
  },
};

/**
 * Get appropriate fallback response for discovery mode
 */
export function getDiscoveryFallback(
  type: FallbackType,
  context?: { lastQuestion?: string }
): DiscoveryResponse {
  const fallbackKey = type.replace('discovery_', '').replace('_error', '');
  const fallback = DISCOVERY_FALLBACKS[fallbackKey] || DISCOVERY_FALLBACKS.api_error;

  // Customize message if we have context
  if (context?.lastQuestion && type === 'timeout') {
    return {
      ...fallback,
      message: `Let me simplify that. ${context.lastQuestion}`,
    };
  }

  return fallback;
}

/**
 * Get appropriate fallback response for analysis mode
 */
export function getAnalysisFallback(
  type: FallbackType,
  context?: { dealAddress?: string }
): AnalysisResponse {
  const fallbackKey = type.replace('analysis_', '').replace('_error', '');
  const fallback = ANALYSIS_FALLBACKS[fallbackKey] || ANALYSIS_FALLBACKS.api_error;

  // Add deal context if available
  if (context?.dealAddress) {
    return {
      ...fallback,
      summary: `${fallback.summary} (Property: ${context.dealAddress})`,
    };
  }

  return fallback;
}

/**
 * Get appropriate fallback response for comparison mode
 */
export function getComparisonFallback(
  type: FallbackType,
  dealIds: string[]
): ComparisonResponse {
  const fallbackKey = type.replace('comparison_', '').replace('_error', '');
  const baseFallback = COMPARISON_FALLBACKS[fallbackKey] || COMPARISON_FALLBACKS.parse_error;

  return {
    winner: {
      deal_id: dealIds[0] || '',
      reason: 'Manual comparison recommended',
    },
    comparison_summary: baseFallback.comparison_summary || 'Comparison unavailable',
    deal_analyses: dealIds.map((id) => ({
      deal_id: id,
      score: 50,
      pros: ['Manual review needed'],
      cons: ['Automated analysis unavailable'],
    })),
    recommendation: baseFallback.recommendation || 'Please compare deals manually',
  };
}

/**
 * Get appropriate fallback response for recommendation mode
 */
export function getRecommendationFallback(type: FallbackType): RecommendationResponse {
  const fallbackKey = type.replace('recommendation_', '').replace('_error', '');
  const baseFallback = RECOMMENDATION_FALLBACKS[fallbackKey] || RECOMMENDATION_FALLBACKS.parse_error;

  return {
    strategy_name: baseFallback.strategy_name || 'Custom Strategy',
    strategy_description: baseFallback.strategy_description || 'Please provide more details.',
    buy_box: {
      name: 'Default Criteria',
      property_types: ['sfr', 'multifamily'],
      price_range: { min: 100000, max: 500000 },
      markets: [],
    },
    reasoning: baseFallback.reasoning || 'Unable to generate detailed recommendation.',
    confidence: baseFallback.confidence || 25,
  };
}

/**
 * Determine fallback type from error
 */
export function determineFallbackType(error: Error): FallbackType {
  const message = error.message.toLowerCase();

  if (message.includes('timeout') || message.includes('timed out')) {
    return 'timeout';
  }

  if (message.includes('rate limit') || message.includes('too many requests')) {
    return 'rate_limit';
  }

  if (message.includes('validation') || message.includes('parse') || message.includes('json')) {
    return 'discovery_parse_error'; // Will be replaced based on mode
  }

  if (message.includes('off-topic') || message.includes('off topic')) {
    return 'off_topic';
  }

  if (message.includes('api') || message.includes('service')) {
    return 'api_error';
  }

  return 'unknown_error';
}

/**
 * Check if a response indicates off-topic conversation
 */
export function isOffTopic(content: string): boolean {
  const offTopicIndicators = [
    'not related to real estate',
    'outside my expertise',
    'cannot help with',
    "let's focus on",
    'back to investing',
  ];

  const lowerContent = content.toLowerCase();
  return offTopicIndicators.some((indicator) => lowerContent.includes(indicator));
}
