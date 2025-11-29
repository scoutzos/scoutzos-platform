/**
 * Prompt Template System
 * Loads and interpolates prompt templates with context variables
 */

import { promises as fs } from 'fs';
import path from 'path';

// Types
export interface PromptContext {
  [key: string]: string | number | boolean | object | null | undefined;
}

export interface PromptTemplate {
  name: string;
  content: string;
  variables: string[];
}

// Cache for loaded templates
const templateCache = new Map<string, string>();

// Prompt directory path
const PROMPTS_DIR = path.join(process.cwd(), 'prompts');

/**
 * Load a prompt template from the /prompts directory
 */
export async function loadPromptTemplate(templateName: string): Promise<string> {
  // Check cache first
  if (templateCache.has(templateName)) {
    return templateCache.get(templateName)!;
  }

  // Try different extensions
  const extensions = ['.txt', '.md', ''];
  let template: string | null = null;

  for (const ext of extensions) {
    try {
      const filePath = path.join(PROMPTS_DIR, `${templateName}${ext}`);
      template = await fs.readFile(filePath, 'utf-8');
      break;
    } catch {
      // Try next extension
    }
  }

  if (!template) {
    throw new Error(`Prompt template not found: ${templateName}`);
  }

  // Cache the template
  templateCache.set(templateName, template);
  return template;
}

/**
 * Extract variable names from a template ({{variable}} format)
 */
export function extractVariables(template: string): string[] {
  const regex = /\{\{(\w+)\}\}/g;
  const variables: string[] = [];
  let match;

  while ((match = regex.exec(template)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }

  return variables;
}

/**
 * Interpolate variables into a template
 */
export function interpolateTemplate(
  template: string,
  context: PromptContext
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    const value = context[varName];

    if (value === undefined || value === null) {
      // Return empty string for missing values
      return '';
    }

    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }

    return String(value);
  });
}

/**
 * Load and interpolate a prompt template
 */
export async function getPrompt(
  templateName: string,
  context: PromptContext = {}
): Promise<string> {
  const template = await loadPromptTemplate(templateName);
  return interpolateTemplate(template, context);
}

/**
 * Build a messages array for AI calls
 */
export interface MessageBuilder {
  system(content: string): MessageBuilder;
  developer(content: string): MessageBuilder;
  user(content: string): MessageBuilder;
  assistant(content: string): MessageBuilder;
  build(): Array<{ role: string; content: string }>;
}

export function createMessageBuilder(): MessageBuilder {
  const messages: Array<{ role: string; content: string }> = [];

  return {
    system(content: string) {
      messages.push({ role: 'system', content });
      return this;
    },
    developer(content: string) {
      // Developer messages are injected as system context
      // For Claude, we append to system message; for OpenAI, we use developer role
      messages.push({ role: 'system', content: `[Context]\n${content}` });
      return this;
    },
    user(content: string) {
      messages.push({ role: 'user', content });
      return this;
    },
    assistant(content: string) {
      messages.push({ role: 'assistant', content });
      return this;
    },
    build() {
      return messages;
    },
  };
}

/**
 * Format conversation history for injection into prompts
 */
export function formatConversationHistory(
  history: Array<{ role: string; content: string; timestamp?: string }>
): string {
  if (!history || history.length === 0) {
    return 'No previous conversation.';
  }

  return history
    .map((msg, index) => {
      const role = msg.role === 'user' ? 'User' : 'Assistant';
      return `[${index + 1}] ${role}: ${msg.content}`;
    })
    .join('\n\n');
}

/**
 * Format investor profile state for injection
 */
export function formatProfileState(profile: {
  experience_level?: string;
  investment_goals?: string[];
  risk_tolerance?: string;
  preferred_strategies?: string[];
  target_markets?: string[];
  budget_range?: { min?: number; max?: number };
  timeline?: string;
  [key: string]: unknown;
}): string {
  const sections: string[] = [];

  if (profile.experience_level) {
    sections.push(`Experience Level: ${profile.experience_level}`);
  }

  if (profile.investment_goals?.length) {
    sections.push(`Investment Goals: ${profile.investment_goals.join(', ')}`);
  }

  if (profile.risk_tolerance) {
    sections.push(`Risk Tolerance: ${profile.risk_tolerance}`);
  }

  if (profile.preferred_strategies?.length) {
    sections.push(`Preferred Strategies: ${profile.preferred_strategies.join(', ')}`);
  }

  if (profile.target_markets?.length) {
    sections.push(`Target Markets: ${profile.target_markets.join(', ')}`);
  }

  if (profile.budget_range) {
    const min = profile.budget_range.min
      ? `$${profile.budget_range.min.toLocaleString()}`
      : 'Not specified';
    const max = profile.budget_range.max
      ? `$${profile.budget_range.max.toLocaleString()}`
      : 'Not specified';
    sections.push(`Budget Range: ${min} - ${max}`);
  }

  if (profile.timeline) {
    sections.push(`Investment Timeline: ${profile.timeline}`);
  }

  return sections.length > 0 ? sections.join('\n') : 'No profile information collected yet.';
}

/**
 * Format deal data for analysis prompts
 */
export function formatDealData(deal: {
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
}): string {
  const sections: string[] = [];

  // Property info
  if (deal.address) {
    sections.push(`Address: ${deal.address}, ${deal.city || ''}, ${deal.state || ''}`);
  }

  if (deal.list_price) {
    sections.push(`List Price: $${deal.list_price.toLocaleString()}`);
  }

  if (deal.property_type) {
    sections.push(`Property Type: ${deal.property_type.toUpperCase()}`);
  }

  // Physical characteristics
  const physicalInfo: string[] = [];
  if (deal.beds) physicalInfo.push(`${deal.beds} beds`);
  if (deal.baths) physicalInfo.push(`${deal.baths} baths`);
  if (deal.sqft) physicalInfo.push(`${deal.sqft.toLocaleString()} sqft`);
  if (deal.year_built) physicalInfo.push(`built ${deal.year_built}`);
  if (physicalInfo.length) {
    sections.push(`Property: ${physicalInfo.join(', ')}`);
  }

  // Financial metrics
  if (deal.estimated_rent) {
    sections.push(`Estimated Rent: $${deal.estimated_rent.toLocaleString()}/month`);
  }

  if (deal.metrics) {
    const metrics: string[] = [];
    if (deal.metrics.cap_rate) metrics.push(`Cap Rate: ${deal.metrics.cap_rate}%`);
    if (deal.metrics.cash_on_cash) metrics.push(`Cash-on-Cash: ${deal.metrics.cash_on_cash}%`);
    if (deal.metrics.monthly_cash_flow) {
      metrics.push(`Monthly Cash Flow: $${deal.metrics.monthly_cash_flow.toLocaleString()}`);
    }
    if (deal.metrics.dscr) metrics.push(`DSCR: ${deal.metrics.dscr}`);
    if (metrics.length) {
      sections.push(`Financial Metrics:\n  ${metrics.join('\n  ')}`);
    }
  }

  return sections.join('\n');
}

// Clear template cache (useful for development)
export function clearTemplateCache(): void {
  templateCache.clear();
}
