/**
 * AI Integration Layer
 * Main export for all AI advisor functionality
 */

// Client
export {
  callAIClient,
  getDefaultConfig,
  type AIProvider,
  type AIMessage,
  type AIClientConfig,
  type AICallResult,
} from './client';

// Prompts
export {
  loadPromptTemplate,
  getPrompt,
  interpolateTemplate,
  extractVariables,
  createMessageBuilder,
  formatConversationHistory,
  formatProfileState,
  formatDealData,
  clearTemplateCache,
  type PromptContext,
  type PromptTemplate,
  type MessageBuilder,
} from './prompts';

// Validation
export {
  parseDiscoveryResponse,
  parseAnalysisResponse,
  parseComparisonResponse,
  parseRecommendationResponse,
  extractJSON,
  hasRequiredFields,
  AIValidationError,
  discoveryResponseSchema,
  analysisResponseSchema,
  comparisonResponseSchema,
  recommendationResponseSchema,
  type DiscoveryResponse,
  type AnalysisResponse,
  type ComparisonResponse,
  type RecommendationResponse,
} from './validation';

// Fallbacks
export {
  getDiscoveryFallback,
  getAnalysisFallback,
  getComparisonFallback,
  getRecommendationFallback,
  determineFallbackType,
  isOffTopic,
  DISCOVERY_FALLBACKS,
  ANALYSIS_FALLBACKS,
  COMPARISON_FALLBACKS,
  RECOMMENDATION_FALLBACKS,
  type FallbackType,
} from './fallbacks';

// Advisor (main wrapper)
export {
  callAI,
  callDiscoveryAI,
  callAnalysisAI,
  callComparisonAI,
  callRecommendationAI,
  getRecentLogs,
  getAIStats,
  type AIMode,
  type DiscoveryContext,
  type AnalysisContext,
  type ComparisonContext,
  type RecommendationContext,
  type AICallOptions,
  type AICallLog,
} from './advisor';
