import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import OpenAI from 'openai';
import {
  success,
  error,
  unauthorized,
  createRequestContext,
  validateBody,
  respondDiscoverySchema,
  withRateLimit,
  ApiError,
  ErrorCodes,
} from '@/lib/api';
import { DISCOVERY_SYSTEM_PROMPT } from '@/lib/prompts/discovery/system';
import {
  validateDiscoveryResponse,
  calculateProfileCompleteness,
  hasMinimumProfile,
  type DiscoveryModeResponse,
  type InvestorProfile,
} from '@/lib/prompts/discovery/schemas';
import { SessionStateManager, type DiscoverySession } from '@/lib/services/discovery-session';

// Initialize OpenAI if available
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Fallback responses when AI is unavailable or fails
const FALLBACK_RESPONSES: Record<string, DiscoveryModeResponse> = {
  motivation: {
    message: "I want to make sure I understand your goals correctly. What's driving you to invest in real estate - building long-term wealth, generating monthly income, tax benefits, or quick profit from flips?",
    extracted_data: {},
    next_question_cluster: 'motivation',
    ready_for_recommendation: false,
    detected_intent: 'continue_discovery',
    confidence: 50,
    suggested_responses: [
      'I want passive monthly income',
      'Build long-term wealth',
      'Make quick profit from flips',
      'Tax benefits',
    ],
  },
  capital: {
    message: "Now let's talk about your available capital. How much cash do you have available to invest - including down payment, closing costs, and reserves?",
    extracted_data: {},
    next_question_cluster: 'capital',
    ready_for_recommendation: false,
    detected_intent: 'continue_discovery',
    confidence: 50,
    suggested_responses: [
      'Under $50,000',
      '$50,000 - $100,000',
      '$100,000 - $250,000',
      'More than $250,000',
    ],
  },
  geography: {
    message: "Where are you looking to invest? Would you prefer to stay local, or are you open to other markets if the returns are better?",
    extracted_data: {},
    next_question_cluster: 'geography',
    ready_for_recommendation: false,
    detected_intent: 'continue_discovery',
    confidence: 50,
    suggested_responses: [
      'I want to stay local',
      'Open to other markets',
      'Anywhere with good returns',
    ],
  },
  timeline: {
    message: "How soon are you looking to make your first purchase - ready to move now, within a few months, or still in learning mode?",
    extracted_data: {},
    next_question_cluster: 'timeline',
    ready_for_recommendation: false,
    detected_intent: 'continue_discovery',
    confidence: 50,
    suggested_responses: [
      'Ready to move now',
      'Within 3 months',
      'Within 6 months',
      'Just learning for now',
    ],
  },
  credit_income: {
    message: "To understand your financing options, where does your credit score roughly fall?",
    extracted_data: {},
    next_question_cluster: 'credit_income',
    ready_for_recommendation: false,
    detected_intent: 'continue_discovery',
    confidence: 50,
    suggested_responses: [
      'Below 660',
      '660-700',
      '700-740',
      'Above 740',
    ],
  },
  activity: {
    message: "How much time can you dedicate to this investment - are you doing this full-time, part-time, or looking for something passive?",
    extracted_data: {},
    next_question_cluster: 'activity',
    ready_for_recommendation: false,
    detected_intent: 'continue_discovery',
    confidence: 50,
    suggested_responses: [
      'Full-time focus',
      'Part-time alongside my job',
      'Minimal time - want passive',
    ],
  },
  risk: {
    message: "When it comes to risk, would you prefer a safer investment with steady returns, or are you open to higher-risk opportunities with bigger upside?",
    extracted_data: {},
    next_question_cluster: 'risk',
    ready_for_recommendation: false,
    detected_intent: 'continue_discovery',
    confidence: 50,
    suggested_responses: [
      'Conservative - stable and predictable',
      'Moderate - balanced approach',
      'Aggressive - higher risk for higher returns',
    ],
  },
  parse_error: {
    message: "I want to make sure I understand you correctly. Could you tell me more about what you're looking for in an investment property?",
    extracted_data: {},
    next_question_cluster: null,
    ready_for_recommendation: false,
    detected_intent: 'continue_discovery',
    confidence: 30,
    suggested_responses: [
      'I want to build wealth',
      'I want monthly income',
      'I want to flip properties',
    ],
  },
  education_credit: {
    message: "No problem - credit scores can be confusing! Your credit score (300-850) affects what loans you qualify for. Above 740 gets the best rates, 700+ is good, and below 660 limits options but doesn't mean you can't invest. Would you say your credit is excellent, good, fair, or needs some work?",
    extracted_data: {},
    next_question_cluster: 'credit_income',
    ready_for_recommendation: false,
    detected_intent: 'needs_education',
    confidence: 60,
    suggested_responses: [
      'Excellent (740+)',
      'Good (700-739)',
      'Fair (660-699)',
      'Needs work (below 660)',
    ],
    education_topic: 'credit_score',
  },
  education_brrrr: {
    message: "BRRRR stands for Buy, Rehab, Rent, Refinance, Repeat. You buy a fixer-upper, renovate it, rent it out, then refinance to pull your cash back out and use it to buy another property. It's a way to recycle your capital into multiple properties. Does that strategy sound interesting to you?",
    extracted_data: {},
    next_question_cluster: 'motivation',
    ready_for_recommendation: false,
    detected_intent: 'needs_education',
    confidence: 60,
    suggested_responses: [
      'Yes, I want to build a portfolio',
      "No, I'd prefer something simpler",
      'Tell me more about other strategies',
    ],
    education_topic: 'brrrr',
  },
  education_reserves: {
    message: "Reserves are money you keep liquid for emergencies - repairs, vacancies, unexpected costs. Most lenders want to see 3-6 months of payments in reserve. After your down payment and closing costs, how much would you want to keep available for surprises?",
    extracted_data: {},
    next_question_cluster: 'capital',
    ready_for_recommendation: false,
    detected_intent: 'needs_education',
    confidence: 60,
    suggested_responses: [
      'Around $10,000',
      '$10,000 - $25,000',
      '$25,000 or more',
      "I'm not sure yet",
    ],
    education_topic: 'reserves',
  },
};

export async function POST(request: NextRequest) {
  const ctx = createRequestContext();

  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return unauthorized(ctx);
    }

    // Validate request body
    const body = await validateBody(request, respondDiscoverySchema);

    // Rate limit check (using session_id as additional key for per-session limiting)
    const rateLimitResponse = await withRateLimit(request, user.id, body.session_id);
    if (rateLimitResponse) return rateLimitResponse;

    // Fetch session from database
    const { data: sessionData, error: sessionError } = await supabaseAdmin
      .from('discovery_sessions')
      .select('*')
      .eq('id', body.session_id)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !sessionData) {
      throw new ApiError(ErrorCodes.NOT_FOUND, 'Session not found');
    }

    // Check session status
    if (sessionData.status === 'COMPLETED') {
      throw new ApiError(ErrorCodes.SESSION_COMPLETED, 'This session has already been completed');
    }

    if (sessionData.status === 'EXPIRED' || sessionData.status === 'ARCHIVED') {
      throw new ApiError(ErrorCodes.SESSION_EXPIRED, 'This session has expired. Please start a new session.');
    }

    // Initialize session state manager
    const session: DiscoverySession = {
      id: sessionData.id,
      user_id: sessionData.user_id,
      status: sessionData.status,
      mode: sessionData.mode || 'discovery',
      entry_point: sessionData.entry_point || 'cold_start',
      conversation_history: sessionData.conversation_history || [],
      partial_profile: sessionData.partial_profile || {},
      clusters_complete: sessionData.clusters_complete || 0,
      ready_for_recommendation: sessionData.ready_for_recommendation || false,
      message_count: sessionData.message_count || 0,
      created_at: sessionData.created_at,
      last_activity: sessionData.last_activity,
      last_asked_cluster: sessionData.last_asked_cluster,
      education_given: sessionData.education_given || [],
    };

    const stateManager = new SessionStateManager(session);

    // Detect uncertainty before adding to history (for education tracking)
    const uncertainty = stateManager.detectUncertainty(body.message);

    // Add user message to history with metadata
    stateManager.addMessage('user', body.message, {
      intent: uncertainty.isUncertain ? 'needs_education' : 'continue_discovery',
    });

    // Build AI context with user message for compound/uncertainty detection
    const developerMessage = stateManager.buildDeveloperMessage(body.message);
    const conversationHistory = stateManager.formatHistoryForAI(10);

    let aiResponse: DiscoveryModeResponse;
    let educationProvided: string | null = null;

    if (openai) {
      try {
        // Build messages array for OpenAI
        const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
          { role: 'system', content: DISCOVERY_SYSTEM_PROMPT },
          { role: 'system', content: developerMessage }, // Developer context
        ];

        // Add conversation history
        for (const msg of conversationHistory) {
          if (msg.role === 'user' || msg.role === 'assistant') {
            messages.push({ role: msg.role, content: msg.content });
          }
        }

        // Make AI call
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          max_tokens: 800,
          temperature: 0.7,
          response_format: { type: 'json_object' },
          messages,
        });

        const rawResponse = completion.choices[0]?.message?.content || '{}';

        try {
          aiResponse = JSON.parse(rawResponse);

          // Validate response
          const validation = validateDiscoveryResponse(aiResponse);
          if (!validation.valid) {
            console.warn('AI response validation warnings:', validation.warnings);
            console.error('AI response validation errors:', validation.errors);

            // Use fallback if invalid
            const nextCluster = stateManager.getNextCluster();
            aiResponse = FALLBACK_RESPONSES[nextCluster || 'parse_error'];
          }
        } catch (parseError) {
          console.error('Failed to parse AI response:', parseError);
          const nextCluster = stateManager.getNextCluster();
          aiResponse = FALLBACK_RESPONSES[nextCluster || 'parse_error'];
        }
      } catch (aiError) {
        console.error('OpenAI call failed:', aiError);
        const nextCluster = stateManager.getNextCluster();
        aiResponse = FALLBACK_RESPONSES[nextCluster || 'parse_error'];
      }
    } else {
      // No OpenAI available - use fallback
      const nextCluster = stateManager.getNextCluster();
      aiResponse = FALLBACK_RESPONSES[nextCluster || 'motivation'];
    }

    // Update profile with extracted data
    if (aiResponse.extracted_data && Object.keys(aiResponse.extracted_data).length > 0) {
      stateManager.updateProfile(aiResponse.extracted_data as Partial<InvestorProfile>);
    }

    // Track which cluster was asked about
    if (aiResponse.next_question_cluster) {
      stateManager.setLastAskedCluster(aiResponse.next_question_cluster);
    }

    // Track education provided
    if (aiResponse.detected_intent === 'needs_education' && aiResponse.education_topic) {
      stateManager.recordEducationGiven(aiResponse.education_topic);
      educationProvided = aiResponse.education_topic;
    } else if (uncertainty.isUncertain && uncertainty.educationTopic) {
      // If AI didn't explicitly track education, but we detected uncertainty
      stateManager.recordEducationGiven(uncertainty.educationTopic);
      educationProvided = uncertainty.educationTopic;
    }

    // Add AI response to history with metadata
    stateManager.addMessage('assistant', aiResponse.message, {
      cluster_asked: aiResponse.next_question_cluster || undefined,
      intent: aiResponse.detected_intent,
    });

    // Check if ready for recommendation
    const isReady = stateManager.checkReadiness();
    const updatedSession = stateManager.getSession();

    // Update session status
    let newStatus = updatedSession.status;
    if (newStatus === 'INITIAL') {
      newStatus = 'IN_PROGRESS';
    }
    if (isReady || aiResponse.ready_for_recommendation) {
      newStatus = 'READY_FOR_RECOMMENDATION';
    }

    // Calculate progress
    const { completeness, clustersComplete, missingClusters } = calculateProfileCompleteness(
      updatedSession.partial_profile
    );

    // Save session to database
    const { error: updateError } = await supabaseAdmin
      .from('discovery_sessions')
      .update({
        status: newStatus,
        conversation_history: updatedSession.conversation_history,
        partial_profile: updatedSession.partial_profile,
        clusters_complete: clustersComplete,
        ready_for_recommendation: isReady || aiResponse.ready_for_recommendation,
        message_count: updatedSession.message_count,
        last_activity: new Date().toISOString(),
        ui_state: body.ui_state || {},
        last_asked_cluster: aiResponse.next_question_cluster || null,
        education_given: updatedSession.education_given || [],
      })
      .eq('id', body.session_id);

    if (updateError) {
      console.error('Failed to update session:', updateError);
      // Continue anyway - we have the data in memory
    }

    // Analyze for compound answer info (for frontend feedback)
    const compoundAnalysis = stateManager.analyzeCompoundAnswer(body.message);

    // Build response
    return success(
      {
        session: {
          id: updatedSession.id,
          status: newStatus,
          message_count: updatedSession.message_count,
          clusters_complete: clustersComplete,
          ready_for_recommendation: isReady || aiResponse.ready_for_recommendation,
          last_activity: new Date().toISOString(),
        },
        response: {
          message: aiResponse.message,
          extracted_data: aiResponse.extracted_data || {},
          suggested_responses: aiResponse.suggested_responses || null,
          detected_intent: aiResponse.detected_intent,
          confidence: aiResponse.confidence,
          next_question_cluster: aiResponse.next_question_cluster,
        },
        profile_state: {
          clusters_complete: clustersComplete,
          total_clusters: 7,
          percentage: Math.round(completeness * 100),
          missing_clusters: missingClusters,
          has_minimum: hasMinimumProfile(updatedSession.partial_profile),
        },
        // Include mode switch info if detected
        mode_switch: aiResponse.detected_intent === 'has_specific_deal'
          ? {
              new_mode: 'analysis',
              deal_reference: aiResponse.deal_reference,
            }
          : null,
        // Include education info if provided
        education: educationProvided
          ? {
              topic: educationProvided,
              provided: true,
            }
          : null,
        // Include compound answer info
        compound_answer: compoundAnalysis.hasMultipleTopics
          ? {
              detected: true,
              topics: compoundAnalysis.detectedTopics,
            }
          : null,
      },
      ctx
    );
  } catch (err) {
    return error(err, ctx);
  }
}
