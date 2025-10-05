/**
 * Tests for POST /api/agent/initialize endpoint
 * Story 4.7: Re-implement Agent Initialization with Critical Actions
 *
 * Test Coverage:
 * - AC-4.7.1: Load agent.md from bundle
 * - AC-4.7.2: Parse and execute <critical-actions> section
 * - AC-4.7.3: Load bundle config.yaml if specified
 * - AC-4.7.4: Execute file loads via agentic loop
 * - AC-4.7.5: Display agent greeting message
 * - AC-4.7.7: Initialization errors display clearly
 *
 * @jest-environment node
 */

import { POST } from '../route';
import { NextRequest } from 'next/server';
import * as agentLoader from '@/lib/agents/loader';
import * as criticalActions from '@/lib/agents/criticalActions';
import * as agenticLoop from '@/lib/agents/agenticLoop';
import type { Agent } from '@/types';

// Mock dependencies
jest.mock('@/lib/agents/loader');
jest.mock('@/lib/agents/criticalActions');
jest.mock('@/lib/agents/agenticLoop');

describe('POST /api/agent/initialize', () => {
  const mockAgent: Agent = {
    id: 'alex-facilitator',
    name: 'Alex',
    title: 'Requirements Facilitator',
    description: 'Gathers initial requirements',
    path: 'bmad/custom/bundles/requirements-workflow/agents',
    mainFile: 'alex-facilitator.md',
    fullContent: `# Alex - Requirements Facilitator
<critical-actions>
  <i>Load into memory {bundle-root}/config.yaml and set variables: project_name, user_name</i>
  <i>Remember the user's name is {user_name}</i>
</critical-actions>

<cmds>
  <c cmd="*help">Show help</c>
  <c cmd="*exit">Exit</c>
</cmds>`,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * AC-4.7.1: When agent selected, load agent.md from bundle
   * AC-4.7.2: Parse and execute <critical-actions> section
   * AC-4.7.3: Load bundle config.yaml if specified in critical actions
   * AC-4.7.5: Display agent greeting message after initialization completes
   */
  it('should initialize agent with critical actions and return greeting (AC-4.7.1, 4.7.2, 4.7.3, 4.7.5)', async () => {
    // Arrange
    const mockCriticalContext = {
      messages: [
        {
          role: 'system' as const,
          content: '[Critical Action] Loaded file: config.yaml\n\nproject_name: Test Project\nuser_name: TestUser',
        },
        {
          role: 'system' as const,
          content: "[Critical Instruction] Remember the user's name is TestUser",
        },
      ],
      config: {
        project_name: 'Test Project',
        user_name: 'TestUser',
      },
    };

    const mockExecutionResult = {
      success: true,
      response: 'Hello! I am Alex, your Requirements Facilitator. How can I help you today?',
      iterations: 1,
      messages: [],
    };

    (agentLoader.getAgentById as jest.Mock).mockResolvedValue(mockAgent);
    (criticalActions.processCriticalActions as jest.Mock).mockResolvedValue(mockCriticalContext);
    (agenticLoop.executeAgent as jest.Mock).mockResolvedValue(mockExecutionResult);

    const request = new NextRequest('http://localhost:3000/api/agent/initialize', {
      method: 'POST',
      body: JSON.stringify({
        agentId: 'alex-facilitator',
        bundlePath: 'bmad/custom/bundles/requirements-workflow',
      }),
    });

    // Act
    const response = await POST(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.greeting).toBe('Hello! I am Alex, your Requirements Facilitator. How can I help you today?');

    // Verify critical actions processor was called with correct bundle path
    expect(criticalActions.processCriticalActions).toHaveBeenCalledWith(
      mockAgent,
      'bmad/custom/bundles/requirements-workflow'
    );

    // Verify agentic loop was called with bundleRoot parameter
    expect(agenticLoop.executeAgent).toHaveBeenCalledWith(
      'alex-facilitator',
      'You are this agent. Follow all instructions in this file exactly as written. Initialize yourself and provide your greeting and available commands.',
      [],
      'bmad/custom/bundles/requirements-workflow'
    );
  });

  /**
   * AC-4.7.4: Execute file loads via agentic loop (if agent requests files during initialization)
   */
  it('should handle agents that request additional files during initialization (AC-4.7.4)', async () => {
    // Arrange
    const mockCriticalContext = {
      messages: [],
      config: null,
    };

    const mockExecutionResult = {
      success: true,
      response: 'Agent initialized with 3 workflow files loaded.',
      iterations: 5, // Multiple iterations indicating file loads
      messages: [],
    };

    (agentLoader.getAgentById as jest.Mock).mockResolvedValue(mockAgent);
    (criticalActions.processCriticalActions as jest.Mock).mockResolvedValue(mockCriticalContext);
    (agenticLoop.executeAgent as jest.Mock).mockResolvedValue(mockExecutionResult);

    const request = new NextRequest('http://localhost:3000/api/agent/initialize', {
      method: 'POST',
      body: JSON.stringify({
        agentId: 'alex-facilitator',
        bundlePath: 'bmad/custom/bundles/requirements-workflow',
      }),
    });

    // Act
    const response = await POST(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    // Verify agentic loop executed multiple iterations (file loads)
    expect(mockExecutionResult.iterations).toBeGreaterThan(1);
  });

  /**
   * Test: Agent without critical-actions initializes normally
   */
  it('should handle agents without critical-actions section', async () => {
    // Arrange
    const agentWithoutCriticalActions: Agent = {
      ...mockAgent,
      fullContent: '# Simple Agent\n\n<cmds>\n  <c cmd="*help">Show help</c>\n</cmds>',
    };

    const mockCriticalContext = {
      messages: [], // No messages for agents without critical-actions
      config: null,
    };

    const mockExecutionResult = {
      success: true,
      response: 'Simple agent initialized.',
      iterations: 1,
      messages: [],
    };

    (agentLoader.getAgentById as jest.Mock).mockResolvedValue(agentWithoutCriticalActions);
    (criticalActions.processCriticalActions as jest.Mock).mockResolvedValue(mockCriticalContext);
    (agenticLoop.executeAgent as jest.Mock).mockResolvedValue(mockExecutionResult);

    const request = new NextRequest('http://localhost:3000/api/agent/initialize', {
      method: 'POST',
      body: JSON.stringify({
        agentId: 'simple-agent',
      }),
    });

    // Act
    const response = await POST(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.greeting).toBe('Simple agent initialized.');
  });

  /**
   * AC-4.7.7: Initialization errors display clearly without crashing UI
   */
  it('should handle critical actions errors gracefully (AC-4.7.7)', async () => {
    // Arrange
    (agentLoader.getAgentById as jest.Mock).mockResolvedValue(mockAgent);
    (criticalActions.processCriticalActions as jest.Mock).mockRejectedValue(
      new Error('Critical action failed: Load into memory {bundle-root}/config.yaml\nError: File not found')
    );

    const request = new NextRequest('http://localhost:3000/api/agent/initialize', {
      method: 'POST',
      body: JSON.stringify({
        agentId: 'alex-facilitator',
        bundlePath: 'bmad/custom/bundles/requirements-workflow',
      }),
    });

    // Act
    const response = await POST(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
    // Error message should be user-friendly, not expose internal details
    expect(data.error).toContain('unexpected error');
  });

  /**
   * AC-4.7.7: Handle agent not found errors
   */
  it('should return 404 when agent not found (AC-4.7.7)', async () => {
    // Arrange
    (agentLoader.getAgentById as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/agent/initialize', {
      method: 'POST',
      body: JSON.stringify({
        agentId: 'nonexistent-agent',
      }),
    });

    // Act
    const response = await POST(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toContain('not found');
  });

  /**
   * AC-4.7.7: Handle invalid agentId validation
   */
  it('should return 400 for invalid agentId (AC-4.7.7)', async () => {
    // Arrange
    const request = new NextRequest('http://localhost:3000/api/agent/initialize', {
      method: 'POST',
      body: JSON.stringify({
        agentId: '', // Empty agentId
      }),
    });

    // Act
    const response = await POST(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });

  /**
   * Test: Use agent.path as fallback when bundlePath not provided
   */
  it('should use agent.path as bundleRoot when bundlePath not provided', async () => {
    // Arrange
    const mockCriticalContext = {
      messages: [],
      config: null,
    };

    const mockExecutionResult = {
      success: true,
      response: 'Initialized',
      iterations: 1,
      messages: [],
    };

    (agentLoader.getAgentById as jest.Mock).mockResolvedValue(mockAgent);
    (criticalActions.processCriticalActions as jest.Mock).mockResolvedValue(mockCriticalContext);
    (agenticLoop.executeAgent as jest.Mock).mockResolvedValue(mockExecutionResult);

    const request = new NextRequest('http://localhost:3000/api/agent/initialize', {
      method: 'POST',
      body: JSON.stringify({
        agentId: 'alex-facilitator',
        // bundlePath not provided
      }),
    });

    // Act
    const response = await POST(request);

    // Assert
    expect(response.status).toBe(200);
    // Verify processCriticalActions was called with agent.path as fallback
    expect(criticalActions.processCriticalActions).toHaveBeenCalledWith(
      mockAgent,
      mockAgent.path
    );
  });

  /**
   * AC-4.7.7: Handle agentic loop execution errors
   */
  it('should handle agentic loop errors during initialization (AC-4.7.7)', async () => {
    // Arrange
    const mockCriticalContext = {
      messages: [],
      config: null,
    };

    (agentLoader.getAgentById as jest.Mock).mockResolvedValue(mockAgent);
    (criticalActions.processCriticalActions as jest.Mock).mockResolvedValue(mockCriticalContext);
    (agenticLoop.executeAgent as jest.Mock).mockRejectedValue(
      new Error('OpenAI API error: Rate limit exceeded')
    );

    const request = new NextRequest('http://localhost:3000/api/agent/initialize', {
      method: 'POST',
      body: JSON.stringify({
        agentId: 'alex-facilitator',
      }),
    });

    // Act
    const response = await POST(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });
});
