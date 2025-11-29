/**
 * AI Call Wrapper
 * Unified interface for all AI advisor interactions
 */

import { callAIClient, type AIMessage, type AICallResult } from './client';
import {
  getPrompt,
  createMessageBuilder,
  formatConversationHistory,
  formatProfileState,
  formatDealData,
} from './prompts';
import {
  parseDiscoveryResponse,
  parseAnalysisResponse,
  parseComparisonResponse,
  parseRecommendationResponse,
  AIValidationError,
  type DiscoveryResponse,
  type AnalysisResponse,
  type ComparisonResponse,
  type RecommendationResponse,
} from './validation';
import {
  getDiscoveryFallback,
  getAnalysisFallback,
  getComparisonFallback,
  getRecommendationFallback,
  determineFallbackType,
} from './fallbacks';

// Types
export type AIMode = 'discovery' | 'analysis' | 'comparison' | 'recommendation';

export interface DiscoveryContext {
  sessionId: string;
  conversationHistory: Array<{ role: string; content: string; timestamp?: string }>;
  profileState: {
    experience_level?: string;
    investment_goals?: string[];
    risk_tolerance?: string;
    preferred_strategies?: string[];
    target_markets?: string[];
    budget_range?: { min?: number; max?: number };
    timeline?: string;
    [key: string]: unknown;
  };
  currentCluster?: string;
  userMessage: string;
  entryPoint?: string;
}

export interface AnalysisContext {
  deal: {
    id: string;
    address?: string;
    city?: string;
    state?: string;
    list_price?: number;
    property_type?: string;
    beds?: number;
    baths?: number;
    sqft?: number;
    year_built?: number;
    estimated_rent?: number;
    metrics?: {
      cap_rate?: number;
      cash_on_cash?: number;
      monthly_cash_flow?: number;
      dscr?: number;
    };
    [key: string]: unknown;
  };
  investorProfile?: {
    experience_level?: string;
    investment_goals?: string[];
    risk_tolerance?: string;
    preferred_strategies?: string[];
    [key: string]: unknown;
  };
  buyBox?: {
    name?: string;
    property_types?: string[];
    price_range?: { min: number; max: number };
    target_metrics?: {
      min_cap_rate?: number;
      min_cash_on_cash?: number;
    };
    [key: string]: unknown;
  };
}

export interface ComparisonContext {
  deals: Array<AnalysisContext['deal']>;
  investorProfile?: AnalysisContext['investorProfile'];
  comparisonCriteria?: string[];
}

export interface RecommendationContext {
  sessionId: string;
  profileState: DiscoveryContext['profileState'];
  conversationSummary?: string;
}

export interface AICallOptions {
  skipValidation?: boolean;
  skipFallback?: boolean;
  customSystemPrompt?: string;
}

export interface AICallLog {
  mode: AIMode;
  success: boolean;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  error?: string;
  usedFallback: boolean;
  timestamp: Date;
}

// Store recent logs (in production, this would go to a database/logging service)
const recentLogs: AICallLog[] = [];
const MAX_LOGS = 100;

function logAICall(log: AICallLog): void {
  recentLogs.push(log);
  if (recentLogs.length > MAX_LOGS) {
    recentLogs.shift();
  }

  // Console log for development
  const logLevel = log.success ? 'info' : 'warn';
  console[logLevel](
    `[AI ${log.mode}] ${log.success ? 'SUCCESS' : 'FAILED'} | ` +
    `Tokens: ${log.inputTokens}/${log.outputTokens} | ` +
    `Latency: ${log.latencyMs}ms | ` +
    `Fallback: ${log.usedFallback}` +
    (log.error ? ` | Error: ${log.error}` : '')
  );
}

/**
 * Call AI for discovery mode (conversational investor profiling)
 */
export async function callDiscoveryAI(
  context: DiscoveryContext,
  options: AICallOptions = {}
): Promise<{ response: DiscoveryResponse; raw?: AICallResult }> {
  const startTime = Date.now();
  let aiResult: AICallResult | undefined;
  let usedFallback = false;

  try {
    // Load and interpolate system prompt
    const systemPrompt = options.customSystemPrompt || await getPrompt('discovery_system', {
      cluster: context.currentCluster || 'general',
      entry_point: context.entryPoint || 'sidebar',
    });

    // Build context injection
    const contextInjection = `
<current_session>
Session ID: ${context.sessionId}
Entry Point: ${context.entryPoint || 'sidebar'}
Current Cluster: ${context.currentCluster || 'Not set'}
</current_session>

<investor_profile_state>
${formatProfileState(context.profileState)}
</investor_profile_state>

<conversation_history>
${formatConversationHistory(context.conversationHistory)}
</conversation_history>
`.trim();

    // Build messages
    const messages = createMessageBuilder()
      .system(systemPrompt)
      .developer(contextInjection)
      .user(context.userMessage)
      .build() as AIMessage[];

    // Make AI call
    aiResult = await callAIClient(messages);

    // Parse and validate response
    const response = options.skipValidation
      ? JSON.parse(aiResult.content)
      : parseDiscoveryResponse(aiResult.content);

    logAICall({
      mode: 'discovery',
      success: true,
      inputTokens: aiResult.usage.inputTokens,
      outputTokens: aiResult.usage.outputTokens,
      latencyMs: aiResult.latencyMs,
      usedFallback: false,
      timestamp: new Date(),
    });

    return { response, raw: aiResult };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logAICall({
      mode: 'discovery',
      success: false,
      inputTokens: aiResult?.usage.inputTokens || 0,
      outputTokens: aiResult?.usage.outputTokens || 0,
      latencyMs: Date.now() - startTime,
      error: errorMessage,
      usedFallback: !options.skipFallback,
      timestamp: new Date(),
    });

    if (options.skipFallback) {
      throw error;
    }

    // Return fallback response
    usedFallback = true;
    const fallbackType = error instanceof AIValidationError
      ? 'discovery_parse_error'
      : determineFallbackType(error as Error);

    return {
      response: getDiscoveryFallback(fallbackType),
      raw: aiResult,
    };
  }
}

/**
 * Call AI for deal analysis mode
 */
export async function callAnalysisAI(
  context: AnalysisContext,
  options: AICallOptions = {}
): Promise<{ response: AnalysisResponse; raw?: AICallResult }> {
  const startTime = Date.now();
  let aiResult: AICallResult | undefined;

  try {
    // Load system prompt
    const systemPrompt = options.customSystemPrompt || await getPrompt('analysis_system');

    // Build context injection
    const dealData = formatDealData(context.deal);
    const profileData = context.investorProfile
      ? formatProfileState(context.investorProfile)
      : 'No investor profile available';

    const contextInjection = `
<deal_to_analyze>
Deal ID: ${context.deal.id}
${dealData}
</deal_to_analyze>

<investor_profile>
${profileData}
</investor_profile>

${context.buyBox ? `
<buy_box_criteria>
Name: ${context.buyBox.name || 'Unnamed'}
Property Types: ${context.buyBox.property_types?.join(', ') || 'Any'}
Price Range: $${context.buyBox.price_range?.min?.toLocaleString() || 0} - $${context.buyBox.price_range?.max?.toLocaleString() || 'No limit'}
${context.buyBox.target_metrics ? `
Target Metrics:
  Min Cap Rate: ${context.buyBox.target_metrics.min_cap_rate || 'N/A'}%
  Min Cash-on-Cash: ${context.buyBox.target_metrics.min_cash_on_cash || 'N/A'}%
` : ''}
</buy_box_criteria>
` : ''}
`.trim();

    // Build messages
    const messages = createMessageBuilder()
      .system(systemPrompt)
      .developer(contextInjection)
      .user('Analyze this deal and provide your recommendation.')
      .build() as AIMessage[];

    // Make AI call
    aiResult = await callAIClient(messages);

    // Parse and validate response
    const response = options.skipValidation
      ? JSON.parse(aiResult.content)
      : parseAnalysisResponse(aiResult.content);

    logAICall({
      mode: 'analysis',
      success: true,
      inputTokens: aiResult.usage.inputTokens,
      outputTokens: aiResult.usage.outputTokens,
      latencyMs: aiResult.latencyMs,
      usedFallback: false,
      timestamp: new Date(),
    });

    return { response, raw: aiResult };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logAICall({
      mode: 'analysis',
      success: false,
      inputTokens: aiResult?.usage.inputTokens || 0,
      outputTokens: aiResult?.usage.outputTokens || 0,
      latencyMs: Date.now() - startTime,
      error: errorMessage,
      usedFallback: !options.skipFallback,
      timestamp: new Date(),
    });

    if (options.skipFallback) {
      throw error;
    }

    const fallbackType = error instanceof AIValidationError
      ? 'analysis_parse_error'
      : determineFallbackType(error as Error);

    return {
      response: getAnalysisFallback(fallbackType, { dealAddress: context.deal.address }),
      raw: aiResult,
    };
  }
}

/**
 * Call AI for deal comparison mode
 */
export async function callComparisonAI(
  context: ComparisonContext,
  options: AICallOptions = {}
): Promise<{ response: ComparisonResponse; raw?: AICallResult }> {
  const startTime = Date.now();
  let aiResult: AICallResult | undefined;

  try {
    // Load system prompt
    const systemPrompt = options.customSystemPrompt || await getPrompt('analysis_system');

    // Build deals context
    const dealsContext = context.deals
      .map((deal, index) => `
<deal_${index + 1}>
Deal ID: ${deal.id}
${formatDealData(deal)}
</deal_${index + 1}>
`)
      .join('\n');

    const contextInjection = `
<comparison_request>
Number of deals to compare: ${context.deals.length}
${context.comparisonCriteria?.length ? `Focus areas: ${context.comparisonCriteria.join(', ')}` : ''}
</comparison_request>

${dealsContext}

${context.investorProfile ? `
<investor_profile>
${formatProfileState(context.investorProfile)}
</investor_profile>
` : ''}
`.trim();

    // Build messages
    const messages = createMessageBuilder()
      .system(systemPrompt)
      .developer(contextInjection)
      .user('Compare these deals and recommend the best option for this investor.')
      .build() as AIMessage[];

    // Make AI call
    aiResult = await callAIClient(messages);

    // Parse and validate response
    const response = options.skipValidation
      ? JSON.parse(aiResult.content)
      : parseComparisonResponse(aiResult.content);

    logAICall({
      mode: 'comparison',
      success: true,
      inputTokens: aiResult.usage.inputTokens,
      outputTokens: aiResult.usage.outputTokens,
      latencyMs: aiResult.latencyMs,
      usedFallback: false,
      timestamp: new Date(),
    });

    return { response, raw: aiResult };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logAICall({
      mode: 'comparison',
      success: false,
      inputTokens: aiResult?.usage.inputTokens || 0,
      outputTokens: aiResult?.usage.outputTokens || 0,
      latencyMs: Date.now() - startTime,
      error: errorMessage,
      usedFallback: !options.skipFallback,
      timestamp: new Date(),
    });

    if (options.skipFallback) {
      throw error;
    }

    const dealIds = context.deals.map((d) => d.id);
    return {
      response: getComparisonFallback(determineFallbackType(error as Error), dealIds),
      raw: aiResult,
    };
  }
}

/**
 * Call AI for strategy recommendation mode
 */
export async function callRecommendationAI(
  context: RecommendationContext,
  options: AICallOptions = {}
): Promise<{ response: RecommendationResponse; raw?: AICallResult }> {
  const startTime = Date.now();
  let aiResult: AICallResult | undefined;

  try {
    // Load system prompt
    const systemPrompt = options.customSystemPrompt || await getPrompt('recommendation');

    // Build context injection
    const contextInjection = `
<session_info>
Session ID: ${context.sessionId}
</session_info>

<investor_profile>
${formatProfileState(context.profileState)}
</investor_profile>

${context.conversationSummary ? `
<conversation_summary>
${context.conversationSummary}
</conversation_summary>
` : ''}
`.trim();

    // Build messages
    const messages = createMessageBuilder()
      .system(systemPrompt)
      .developer(contextInjection)
      .user('Based on this investor profile, recommend an investment strategy and generate buy box criteria.')
      .build() as AIMessage[];

    // Make AI call
    aiResult = await callAIClient(messages);

    // Parse and validate response
    const response = options.skipValidation
      ? JSON.parse(aiResult.content)
      : parseRecommendationResponse(aiResult.content);

    logAICall({
      mode: 'recommendation',
      success: true,
      inputTokens: aiResult.usage.inputTokens,
      outputTokens: aiResult.usage.outputTokens,
      latencyMs: aiResult.latencyMs,
      usedFallback: false,
      timestamp: new Date(),
    });

    return { response, raw: aiResult };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logAICall({
      mode: 'recommendation',
      success: false,
      inputTokens: aiResult?.usage.inputTokens || 0,
      outputTokens: aiResult?.usage.outputTokens || 0,
      latencyMs: Date.now() - startTime,
      error: errorMessage,
      usedFallback: !options.skipFallback,
      timestamp: new Date(),
    });

    if (options.skipFallback) {
      throw error;
    }

    return {
      response: getRecommendationFallback(determineFallbackType(error as Error)),
      raw: aiResult,
    };
  }
}

/**
 * Unified AI call function
 */
export async function callAI<T extends AIMode>(
  mode: T,
  context: T extends 'discovery'
    ? DiscoveryContext
    : T extends 'analysis'
    ? AnalysisContext
    : T extends 'comparison'
    ? ComparisonContext
    : RecommendationContext,
  options: AICallOptions = {}
): Promise<{
  response: T extends 'discovery'
    ? DiscoveryResponse
    : T extends 'analysis'
    ? AnalysisResponse
    : T extends 'comparison'
    ? ComparisonResponse
    : RecommendationResponse;
  raw?: AICallResult;
}> {
  switch (mode) {
    case 'discovery':
      return callDiscoveryAI(context as DiscoveryContext, options) as any;
    case 'analysis':
      return callAnalysisAI(context as AnalysisContext, options) as any;
    case 'comparison':
      return callComparisonAI(context as ComparisonContext, options) as any;
    case 'recommendation':
      return callRecommendationAI(context as RecommendationContext, options) as any;
    default:
      throw new Error(`Unknown AI mode: ${mode}`);
  }
}

/**
 * Get recent AI call logs
 */
export function getRecentLogs(limit = 10): AICallLog[] {
  return recentLogs.slice(-limit);
}

/**
 * Get AI call statistics
 */
export function getAIStats(): {
  totalCalls: number;
  successRate: number;
  averageLatency: number;
  fallbackRate: number;
  byMode: Record<AIMode, { calls: number; successRate: number }>;
} {
  if (recentLogs.length === 0) {
    return {
      totalCalls: 0,
      successRate: 0,
      averageLatency: 0,
      fallbackRate: 0,
      byMode: {
        discovery: { calls: 0, successRate: 0 },
        analysis: { calls: 0, successRate: 0 },
        comparison: { calls: 0, successRate: 0 },
        recommendation: { calls: 0, successRate: 0 },
      },
    };
  }

  const successfulCalls = recentLogs.filter((l) => l.success).length;
  const fallbackCalls = recentLogs.filter((l) => l.usedFallback).length;
  const totalLatency = recentLogs.reduce((sum, l) => sum + l.latencyMs, 0);

  const byMode: Record<AIMode, { calls: number; successRate: number }> = {
    discovery: { calls: 0, successRate: 0 },
    analysis: { calls: 0, successRate: 0 },
    comparison: { calls: 0, successRate: 0 },
    recommendation: { calls: 0, successRate: 0 },
  };

  const modes: AIMode[] = ['discovery', 'analysis', 'comparison', 'recommendation'];
  for (const mode of modes) {
    const modeLogs = recentLogs.filter((l) => l.mode === mode);
    byMode[mode] = {
      calls: modeLogs.length,
      successRate: modeLogs.length > 0
        ? (modeLogs.filter((l) => l.success).length / modeLogs.length) * 100
        : 0,
    };
  }

  return {
    totalCalls: recentLogs.length,
    successRate: (successfulCalls / recentLogs.length) * 100,
    averageLatency: totalLatency / recentLogs.length,
    fallbackRate: (fallbackCalls / recentLogs.length) * 100,
    byMode,
  };
}
