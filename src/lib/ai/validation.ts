/**
 * Response Validation
 * Parses and validates AI responses against expected schemas
 */

import { z } from 'zod';

// Discovery Response Schema
export const discoveryResponseSchema = z.object({
  message: z.string().min(1, 'Response message is required'),
  extracted_data: z.object({
    experience_level: z.enum(['beginner', 'intermediate', 'advanced']).nullable().optional(),
    investment_goals: z.array(z.string()).nullable().optional(),
    risk_tolerance: z.enum(['conservative', 'moderate', 'aggressive']).nullable().optional(),
    preferred_strategies: z.array(z.string()).nullable().optional(),
    target_markets: z.array(z.string()).nullable().optional(),
    budget_range: z.object({
      min: z.number().nullable().optional(),
      max: z.number().nullable().optional(),
    }).nullable().optional(),
    property_types: z.array(z.string()).nullable().optional(),
    timeline: z.string().nullable().optional(),
    financing_preference: z.string().nullable().optional(),
  }).default({}),
  ready_for_recommendation: z.boolean().default(false),
  detected_intent: z.enum([
    'answering_question',
    'asking_question',
    'changing_topic',
    'expressing_uncertainty',
    'ready_to_proceed',
    'off_topic',
    'unclear',
  ]).default('unclear'),
  confidence: z.number().min(0).max(100).default(50),
  follow_up_questions: z.array(z.string()).optional(),
  clusters_to_explore: z.array(z.string()).optional(),
});

export type DiscoveryResponse = z.infer<typeof discoveryResponseSchema>;

// Analysis Response Schema
export const analysisResponseSchema = z.object({
  recommendation: z.enum(['STRONG_BUY', 'BUY', 'HOLD', 'PASS', 'STRONG_PASS']),
  confidence: z.number().min(0).max(100),
  summary: z.string().min(1, 'Summary is required'),
  strengths: z.array(z.string()).min(0),
  risks: z.array(z.string()).min(0),
  metrics: z.object({
    location_score: z.number().min(0).max(100).optional(),
    financial_score: z.number().min(0).max(100).optional(),
    property_score: z.number().min(0).max(100).optional(),
    overall_score: z.number().min(0).max(100).optional(),
  }).default({}),
  next_steps: z.array(z.string()).min(0),
  detailed_analysis: z.object({
    location: z.string().optional(),
    financials: z.string().optional(),
    property_condition: z.string().optional(),
    market_outlook: z.string().optional(),
  }).optional(),
});

export type AnalysisResponse = z.infer<typeof analysisResponseSchema>;

// Comparison Response Schema
export const comparisonResponseSchema = z.object({
  winner: z.object({
    deal_id: z.string().uuid(),
    reason: z.string(),
  }),
  comparison_summary: z.string(),
  deal_analyses: z.array(z.object({
    deal_id: z.string().uuid(),
    score: z.number().min(0).max(100),
    pros: z.array(z.string()),
    cons: z.array(z.string()),
    best_for: z.string().optional(),
  })),
  recommendation: z.string(),
});

export type ComparisonResponse = z.infer<typeof comparisonResponseSchema>;

// Recommendation Response Schema
export const recommendationResponseSchema = z.object({
  strategy_name: z.string(),
  strategy_description: z.string(),
  buy_box: z.object({
    name: z.string(),
    property_types: z.array(z.string()),
    price_range: z.object({
      min: z.number(),
      max: z.number(),
    }),
    markets: z.array(z.string()),
    target_metrics: z.object({
      min_cap_rate: z.number().optional(),
      min_cash_on_cash: z.number().optional(),
      min_dscr: z.number().optional(),
    }).optional(),
    additional_criteria: z.record(z.unknown()).optional(),
  }),
  reasoning: z.string(),
  alternative_strategies: z.array(z.object({
    name: z.string(),
    description: z.string(),
    why_not_primary: z.string(),
  })).optional(),
  confidence: z.number().min(0).max(100),
});

export type RecommendationResponse = z.infer<typeof recommendationResponseSchema>;

// Validation error class
export class AIValidationError extends Error {
  public readonly errors: z.ZodError;
  public readonly rawResponse: string;

  constructor(errors: z.ZodError, rawResponse: string) {
    super(`AI response validation failed: ${errors.message}`);
    this.name = 'AIValidationError';
    this.errors = errors;
    this.rawResponse = rawResponse;
  }
}

/**
 * Extract JSON from AI response (handles markdown code blocks)
 */
export function extractJSON(content: string): string {
  // Try to find JSON in code blocks first
  const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  // Try to find raw JSON object
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }

  // Return as-is if no JSON found
  return content;
}

/**
 * Parse and validate discovery response
 */
export function parseDiscoveryResponse(content: string): DiscoveryResponse {
  try {
    const jsonStr = extractJSON(content);
    const parsed = JSON.parse(jsonStr);
    return discoveryResponseSchema.parse(parsed);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AIValidationError(error, content);
    }
    if (error instanceof SyntaxError) {
      throw new AIValidationError(
        new z.ZodError([{
          code: 'custom',
          path: [],
          message: `Invalid JSON: ${error.message}`,
        }]),
        content
      );
    }
    throw error;
  }
}

/**
 * Parse and validate analysis response
 */
export function parseAnalysisResponse(content: string): AnalysisResponse {
  try {
    const jsonStr = extractJSON(content);
    const parsed = JSON.parse(jsonStr);
    return analysisResponseSchema.parse(parsed);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AIValidationError(error, content);
    }
    if (error instanceof SyntaxError) {
      throw new AIValidationError(
        new z.ZodError([{
          code: 'custom',
          path: [],
          message: `Invalid JSON: ${error.message}`,
        }]),
        content
      );
    }
    throw error;
  }
}

/**
 * Parse and validate comparison response
 */
export function parseComparisonResponse(content: string): ComparisonResponse {
  try {
    const jsonStr = extractJSON(content);
    const parsed = JSON.parse(jsonStr);
    return comparisonResponseSchema.parse(parsed);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AIValidationError(error, content);
    }
    if (error instanceof SyntaxError) {
      throw new AIValidationError(
        new z.ZodError([{
          code: 'custom',
          path: [],
          message: `Invalid JSON: ${error.message}`,
        }]),
        content
      );
    }
    throw error;
  }
}

/**
 * Parse and validate recommendation response
 */
export function parseRecommendationResponse(content: string): RecommendationResponse {
  try {
    const jsonStr = extractJSON(content);
    const parsed = JSON.parse(jsonStr);
    return recommendationResponseSchema.parse(parsed);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AIValidationError(error, content);
    }
    if (error instanceof SyntaxError) {
      throw new AIValidationError(
        new z.ZodError([{
          code: 'custom',
          path: [],
          message: `Invalid JSON: ${error.message}`,
        }]),
        content
      );
    }
    throw error;
  }
}

/**
 * Validate response has minimum required fields (less strict validation)
 */
export function hasRequiredFields(
  content: string,
  requiredFields: string[]
): boolean {
  try {
    const jsonStr = extractJSON(content);
    const parsed = JSON.parse(jsonStr);
    return requiredFields.every((field) => field in parsed);
  } catch {
    return false;
  }
}
