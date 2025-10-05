import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '@/types/api';
import { handleApiError, NotFoundError } from '@/lib/utils/errors';
import { getAgentById } from '@/lib/agents/loader';
import { processCriticalActions } from '@/lib/agents/criticalActions';
import { executeAgent } from '@/lib/agents/agenticLoop';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import {
  validateAgentId,
} from '@/lib/utils/validation';

/**
 * Request body for agent initialization
 * Story 4.6: Now requires bundlePath for bundle-based agent loading
 */
interface InitializeRequest {
  agentId: string;
  bundlePath?: string; // Optional for backward compatibility
  filePath?: string;   // Optional for backward compatibility
}

/**
 * Response data for successful initialization
 */
interface InitializeResponse {
  greeting: string;
}

/**
 * POST /api/agent/initialize
 * Initializes an agent using critical actions processor and agentic execution loop
 *
 * Story 4.7: Re-implement Agent Initialization with Critical Actions
 * - Loads agent definition file from bundle (AC-4.7.1)
 * - Parses and executes <critical-actions> section (AC-4.7.2)
 * - Loads bundle config.yaml if specified in critical actions (AC-4.7.3)
 * - Executes file loads via agentic loop if agent requests files during initialization (AC-4.7.4)
 * - Returns agent greeting message after initialization completes (AC-4.7.5)
 * - Handles initialization errors gracefully (AC-4.7.7)
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: InitializeRequest = await request.json();

    // Validate agentId
    validateAgentId(body.agentId);

    // AC-4.7.1: Load agent from bundle using bundlePath
    const agent = await getAgentById(body.agentId);

    if (!agent) {
      throw new NotFoundError(`Agent not found: ${body.agentId}`);
    }

    console.log(`[agent_initialize] Initializing agent: ${agent.id} from bundle: ${body.bundlePath || agent.path}`);

    // Determine bundle root path
    // Use bundlePath from request if provided, otherwise use agent.path
    const bundleRoot = body.bundlePath || agent.path;

    // AC-4.7.2, AC-4.7.3: Process critical actions to get initialized context
    // This loads config.yaml if specified and injects system messages
    const criticalContext = await processCriticalActions(agent, bundleRoot);

    console.log(`[agent_initialize] Critical actions processed: ${criticalContext.messages.length} messages, config ${criticalContext.config ? 'loaded' : 'not loaded'}`);

    // AC-4.7.4, AC-4.7.5: Execute agent initialization via agentic loop
    // Build initialization prompt for agent greeting
    const initializationPrompt = 'You are this agent. Follow all instructions in this file exactly as written. Initialize yourself and provide your greeting and available commands.';

    // Call executeAgent which will:
    // 1. Build system prompt with agent content
    // 2. Inject critical context messages
    // 3. Execute agentic loop (allowing file loads if needed)
    // 4. Return greeting message
    // Pass bundleRoot to ensure critical actions can resolve bundle-relative paths
    const result = await executeAgent(agent.id, initializationPrompt, [], bundleRoot);

    console.log(`[agent_initialize] Agent ${agent.id} initialized successfully in ${result.iterations} iterations`);

    // AC-4.7.5: Return greeting message from initialization
    const response: InitializeResponse = {
      greeting: result.response,
    };

    return NextResponse.json<ApiResponse<InitializeResponse>>(
      {
        success: true,
        data: response,
      },
      { status: 200 }
    );
  } catch (error) {
    // AC-4.7.7: Handle initialization errors gracefully
    console.error('[agent_initialize] Initialization error:', error);
    return handleApiError(error);
  }
}
