/**
 * System Prompt Builder Module
 *
 * Creates system prompts that instruct OpenAI to actively use tools.
 * Addresses the critical issue where OpenAI tends to acknowledge file load
 * instructions as text rather than actually calling the read_file tool.
 *
 * Per AGENT-EXECUTION-SPEC.md Section 6, the system prompt must:
 * 1. Include agent persona to establish role and capabilities
 * 2. List all available tools with clear descriptions
 * 3. Emphasize tool execution over acknowledgment
 * 4. Provide workflow execution context
 * 5. Make tool usage instructions impossible to misinterpret
 *
 * SYSTEM PROMPT VERSIONING:
 * - Current Version: v2.2 (Minimal - Defer to Workflow)
 * - Template Location: lib/agents/prompts/system-prompt.md
 * - Changelog: lib/agents/prompts/CHANGELOG.md
 * - Version History: lib/agents/prompts/versions/
 */

import { Agent } from '@/types';
import { env } from '@/lib/utils/env';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Extracts persona information from agent XML content.
 * Returns structured persona data or defaults if sections not found.
 */
function extractPersona(fullContent: string): {
  role: string;
  identity: string;
  communication_style: string;
  principles: string;
} {
  const roleMatch = fullContent.match(/<role>([\s\S]*?)<\/role>/);
  const identityMatch = fullContent.match(/<identity>([\s\S]*?)<\/identity>/);
  const styleMatch = fullContent.match(
    /<communication_style>([\s\S]*?)<\/communication_style>/
  );
  const principlesMatch = fullContent.match(
    /<principles>([\s\S]*?)<\/principles>/
  );

  return {
    role: roleMatch ? roleMatch[1].trim() : '',
    identity: identityMatch ? identityMatch[1].trim() : '',
    communication_style: styleMatch ? styleMatch[1].trim() : '',
    principles: principlesMatch ? principlesMatch[1].trim() : '',
  };
}

/**
 * Extracts available commands from agent XML <cmds> section.
 * Returns array of command objects with cmd, description, and optional runWorkflow.
 */
function extractCommands(
  fullContent: string
): Array<{ cmd: string; description: string; runWorkflow?: string }> {
  const commands: Array<{
    cmd: string;
    description: string;
    runWorkflow?: string;
  }> = [];

  // Match all <c> tags within <cmds> section
  const cmdsMatch = fullContent.match(/<cmds>([\s\S]*?)<\/cmds>/);
  if (!cmdsMatch) return commands;

  const cmdsContent = cmdsMatch[1];

  // Extract individual command tags
  const cmdRegex = /<c\s+cmd="([^"]+)"(?:\s+run-workflow="([^"]+)")?\s*>([^<]+)<\/c>/g;
  const cmdMatches = Array.from(cmdsContent.matchAll(cmdRegex));

  for (const match of cmdMatches) {
    const [, cmd, runWorkflow, description] = match;
    commands.push({
      cmd: cmd.trim(),
      description: description.trim(),
      runWorkflow: runWorkflow?.trim(),
    });
  }

  return commands;
}

/**
 * Loads the system prompt template from file.
 * Template contains {{VARIABLE}} placeholders for interpolation.
 */
function loadPromptTemplate(): string {
  const templatePath = join(
    process.cwd(),
    'lib/agents/prompts/system-prompt.md'
  );

  try {
    return readFileSync(templatePath, 'utf-8');
  } catch (error) {
    console.error(
      '[systemPromptBuilder] Failed to load system prompt template:',
      error
    );
    throw new Error(
      `Failed to load system prompt template from ${templatePath}`
    );
  }
}

/**
 * Builds system prompt that instructs OpenAI to actively use tools.
 *
 * The prompt structure follows AGENT-EXECUTION-SPEC.md Section 6:
 * 1. Agent Identity (from <persona> section)
 * 2. Tool Usage Instructions (CRITICAL - emphasizes actual calls vs acknowledgment)
 * 3. Workflow Execution Pattern
 * 4. Available Commands (from <cmds> section)
 *
 * Version: v2.2 (Minimal - Defer to Workflow)
 * See: lib/agents/prompts/CHANGELOG.md for version history
 *
 * @param agent - Agent object containing fullContent XML
 * @returns Complete system prompt string with emphatic tool usage instructions
 */
export function buildSystemPrompt(agent: Agent): string {
  const persona = extractPersona(agent.fullContent);
  const commands = extractCommands(agent.fullContent);

  // Build commands section
  let commandsSection = '';
  if (commands.length > 0) {
    commandsSection = `
AVAILABLE COMMANDS:
${commands
  .map((cmd) => {
    if (cmd.runWorkflow) {
      return `${cmd.cmd} - ${cmd.description} [Workflow: ${cmd.runWorkflow}]`;
    }
    return `${cmd.cmd} - ${cmd.description}`;
  })
  .join('\n')}`;
  }

  // Load template and replace variables
  const template = loadPromptTemplate();

  return template
    .replace(/{{AGENT_NAME}}/g, agent.name)
    .replace(/{{AGENT_TITLE}}/g, agent.title)
    .replace(/{{PERSONA_ROLE}}/g, persona.role)
    .replace(/{{PERSONA_IDENTITY}}/g, persona.identity)
    .replace(/{{PERSONA_COMMUNICATION_STYLE}}/g, persona.communication_style)
    .replace(/{{PERSONA_PRINCIPLES}}/g, persona.principles)
    .replace(/{{COMMANDS_SECTION}}/g, commandsSection)
    .replace(/{{PROJECT_ROOT}}/g, env.PROJECT_ROOT)
    .replace(/{{AGENT_PATH}}/g, agent.path);
}
