/**
 * System Prompt Builder Module Tests
 *
 * Tests for building system prompts that instruct OpenAI to actively use tools.
 * Covers:
 * - Persona extraction (role, identity, communication_style, principles) - AC-4.8.1
 * - Tool usage instructions - AC-4.8.2, AC-4.8.5
 * - Tool list with descriptions - AC-4.8.3
 * - Workflow execution pattern - AC-4.8.4
 * - Available commands extraction - AC-4.8.6
 * - Edge cases: agents with/without commands section
 */

import { buildSystemPrompt } from '../systemPromptBuilder';
import type { Agent } from '@/types';
import { env } from '@/lib/utils/env';

describe('system prompt builder module', () => {
  const mockAgent: Agent = {
    id: 'test-agent',
    name: 'Alex',
    title: 'Requirements Facilitator',
    icon: '🤝',
    path: '/test/path/to/agent',
    mainFile: '/test/path/to/agent/agent.md',
    fullContent: `<agent id="test-agent" name="Alex" title="Requirements Facilitator" icon="🤝">
  <persona>
    <role>Requirements Facilitator + User Advocate</role>
    <identity>Experienced facilitator who specializes in helping users articulate their needs in a comfortable, non-technical environment.</identity>
    <communication_style>Friendly, warm, and encouraging. Makes users feel comfortable sharing incomplete or fuzzy ideas.</communication_style>
    <principles>I believe every user has valuable insights, even if they struggle to articulate them initially. I operate with empathy and patience.</principles>
  </persona>

  <cmds>
    <c cmd="*help">Show numbered cmd list</c>
    <c cmd="*workflow-request" run-workflow="{bundle-root}/workflows/intake-workflow/workflow.yaml">Gather requirements for workflow automation</c>
    <c cmd="*exit">Exit with confirmation</c>
  </cmds>
</agent>`,
  };

  describe('buildSystemPrompt', () => {
    it('should include agent name and title', () => {
      const prompt = buildSystemPrompt(mockAgent);

      expect(prompt).toContain('You are Alex, Requirements Facilitator.');
    });

    it('should extract and include persona role - AC-4.8.1', () => {
      const prompt = buildSystemPrompt(mockAgent);

      expect(prompt).toContain('Requirements Facilitator + User Advocate');
    });

    it('should extract and include persona identity - AC-4.8.1', () => {
      const prompt = buildSystemPrompt(mockAgent);

      expect(prompt).toContain('IDENTITY:');
      expect(prompt).toContain(
        'Experienced facilitator who specializes in helping users articulate their needs in a comfortable, non-technical environment.'
      );
    });

    it('should extract and include communication style - AC-4.8.1', () => {
      const prompt = buildSystemPrompt(mockAgent);

      expect(prompt).toContain('COMMUNICATION STYLE:');
      expect(prompt).toContain(
        'Friendly, warm, and encouraging. Makes users feel comfortable sharing incomplete or fuzzy ideas.'
      );
    });

    it('should extract and include principles - AC-4.8.1', () => {
      const prompt = buildSystemPrompt(mockAgent);

      expect(prompt).toContain('PRINCIPLES:');
      expect(prompt).toContain(
        'I believe every user has valuable insights, even if they struggle to articulate them initially. I operate with empathy and patience.'
      );
    });

    it('should include explicit instruction to use read_file tool - AC-4.8.2', () => {
      const prompt = buildSystemPrompt(mockAgent);

      expect(prompt).toContain(
        'When you see instructions to load files, you MUST use the read_file tool'
      );
    });

    it('should list available tools with descriptions - AC-4.8.3', () => {
      const prompt = buildSystemPrompt(mockAgent);

      expect(prompt).toContain('AVAILABLE TOOLS:');
      expect(prompt).toContain(
        'read_file: Read files from your instruction folder, output directory, or any accessible path'
      );
      expect(prompt).toContain(
        'write_file: Write content to files in the output directory'
      );
      expect(prompt).toContain(
        'list_files: List files and directories in a given path'
      );
    });

    it('should explain workflow execution pattern - AC-4.8.4', () => {
      const prompt = buildSystemPrompt(mockAgent);

      expect(prompt).toContain('WORKFLOW EXECUTION PATTERN:');
      expect(prompt).toContain(
        'Identify the workflow path from the command definition'
      );
      expect(prompt).toContain('Call execute_workflow tool with that path');
      expect(prompt).toContain(
        'Wait for the workflow configuration, instructions, and template'
      );
      expect(prompt).toContain('Follow the workflow instructions step by step');
    });

    it('should emphasize tool execution over acknowledgment - AC-4.8.5', () => {
      const prompt = buildSystemPrompt(mockAgent);

      expect(prompt).toContain(
        'DO NOT just acknowledge file load instructions - actually call the tools'
      );
      expect(prompt).toContain('CRITICAL INSTRUCTIONS FOR TOOL USAGE:');
      expect(prompt).toContain(
        'You have access to tools - use them actively, not just describe them'
      );
    });

    it('should extract and format available commands - AC-4.8.6', () => {
      const prompt = buildSystemPrompt(mockAgent);

      expect(prompt).toContain('AVAILABLE COMMANDS:');
      expect(prompt).toContain('*help - Show numbered cmd list');
      expect(prompt).toContain(
        '*workflow-request - Gather requirements for workflow automation'
      );
      expect(prompt).toContain('*exit - Exit with confirmation');
    });

    it('should include workflow path for commands with run-workflow attribute - AC-4.8.6', () => {
      const prompt = buildSystemPrompt(mockAgent);

      expect(prompt).toContain(
        'Workflow: {bundle-root}/workflows/intake-workflow/workflow.yaml'
      );
    });

    it('should include environment variables section', () => {
      const prompt = buildSystemPrompt(mockAgent);

      expect(prompt).toContain('ENVIRONMENT VARIABLES:');
      expect(prompt).toContain(`{project-root} or {project_root} = ${env.PROJECT_ROOT}`);
      expect(prompt).toContain(`Agent directory = ${mockAgent.path}`);
    });

    it('should handle agent without commands section - AC-4.8.1', () => {
      const agentWithoutCommands: Agent = {
        ...mockAgent,
        fullContent: `<agent id="test-agent" name="Alex" title="Requirements Facilitator">
  <persona>
    <role>Test Role</role>
    <identity>Test identity</identity>
    <communication_style>Test style</communication_style>
    <principles>Test principles</principles>
  </persona>
</agent>`,
      };

      const prompt = buildSystemPrompt(agentWithoutCommands);

      expect(prompt).toContain('You are Alex, Requirements Facilitator.');
      expect(prompt).toContain('Test Role');
      expect(prompt).not.toContain('AVAILABLE COMMANDS:');
    });

    it('should handle agent with partial persona sections', () => {
      const agentPartialPersona: Agent = {
        ...mockAgent,
        fullContent: `<agent id="test-agent" name="Alex" title="Requirements Facilitator">
  <persona>
    <role>Test Role</role>
  </persona>
</agent>`,
      };

      const prompt = buildSystemPrompt(agentPartialPersona);

      expect(prompt).toContain('You are Alex, Requirements Facilitator.');
      expect(prompt).toContain('Test Role');
      expect(prompt).toContain('IDENTITY:');
      expect(prompt).toContain('COMMUNICATION STYLE:');
      expect(prompt).toContain('PRINCIPLES:');
    });

    it('should handle commands with and without run-workflow attribute - AC-4.8.6', () => {
      const prompt = buildSystemPrompt(mockAgent);

      // Command without run-workflow
      expect(prompt).toContain('*help - Show numbered cmd list');
      expect(prompt).not.toContain('*help - Show numbered cmd list\n  Workflow:');

      // Command with run-workflow
      expect(prompt).toContain('*workflow-request - Gather requirements for workflow automation');
      expect(prompt).toContain(
        'Workflow: {bundle-root}/workflows/intake-workflow/workflow.yaml'
      );
    });

    it('should return valid string with no undefined/null values - AC-4.8.3', () => {
      const prompt = buildSystemPrompt(mockAgent);

      expect(prompt).not.toContain('undefined');
      expect(prompt).not.toContain('null');
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(100);
    });

    it('should match expected structure from AGENT-EXECUTION-SPEC.md Section 6 - AC-4.8.7', () => {
      const prompt = buildSystemPrompt(mockAgent);

      // Verify all required sections in order
      const sections = [
        'You are',
        'IDENTITY:',
        'COMMUNICATION STYLE:',
        'PRINCIPLES:',
        'CRITICAL INSTRUCTIONS FOR TOOL USAGE:',
        'AVAILABLE TOOLS:',
        'WORKFLOW EXECUTION PATTERN:',
        'AVAILABLE COMMANDS:',
        'ENVIRONMENT VARIABLES:',
      ];

      let lastIndex = -1;
      for (const section of sections) {
        const index = prompt.indexOf(section);
        expect(index).toBeGreaterThan(lastIndex);
        lastIndex = index;
      }
    });

    it('should include multiple emphatic statements about tool usage - AC-4.8.5', () => {
      const prompt = buildSystemPrompt(mockAgent);

      // Count occurrences of emphatic statements
      const doNotAcknowledge = (prompt.match(/DO NOT just acknowledge/g) || [])
        .length;
      const mustUse = (prompt.match(/you MUST use/g) || []).length;

      expect(doNotAcknowledge).toBeGreaterThanOrEqual(2);
      expect(mustUse).toBeGreaterThanOrEqual(2);
    });
  });
});
