import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '@/types/api';
import { handleApiError, NotFoundError } from '@/lib/utils/errors';
import { getAgentById } from '@/lib/agents/loader';
import { executeChatCompletion } from '@/lib/openai/chat';
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
 * Initializes an agent by loading its definition file and executing initialization with LLM
 *
 * Story 3.10: Agent Initialization on Selection
 * - Loads agent definition file from disk (AC-10.1)
 * - Sends complete agent file to LLM with instruction to follow all instructions exactly (AC-10.2)
 * - Uses Epic 2 function calling infrastructure for lazy-loading files (AC-10.3)
 * - Returns LLM's initialization response (greeting, commands, etc.) (AC-10.4, AC-10.5)
 * - Handles errors gracefully (AC-10.8)
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: InitializeRequest = await request.json();

    // Validate agentId
    validateAgentId(body.agentId);

    // Load agent by ID (AC-10.1)
    const agent = await getAgentById(body.agentId);

    if (!agent) {
      throw new NotFoundError(`Agent not found: ${body.agentId}`);
    }

    console.log(`[agent_initialize] Initializing agent: ${agent.id}`);

    // Build initialization prompt (AC-10.2)
    // Send complete agent file content with instruction to follow all instructions exactly
    const initializationPrompt: ChatCompletionMessageParam = {
      role: 'user',
      content: 'You are this agent. Follow all instructions in this file exactly as written. Initialize yourself and provide your greeting and available commands.',
    };

    // Execute chat completion with agent's full content as system message (AC-10.3)
    // This reuses Epic 2 function calling infrastructure - LLM can request files via read_file tool
    const result = await executeChatCompletion(agent, [initializationPrompt]);

    console.log(`[agent_initialize] Agent ${agent.id} initialized successfully`);

    // Return initialization response (AC-10.4, AC-10.5)
    const response: InitializeResponse = {
      greeting: result.content,
    };

    return NextResponse.json<ApiResponse<InitializeResponse>>(
      {
        success: true,
        data: response,
      },
      { status: 200 }
    );
  } catch (error) {
    // Handle errors gracefully (AC-10.8)
    console.error('[agent_initialize] Initialization error:', error);
    return handleApiError(error);
  }
}
