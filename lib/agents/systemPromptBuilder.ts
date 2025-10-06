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
 */

import { Agent } from '@/types';
import { env } from '@/lib/utils/env';

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
 * Builds system prompt that instructs OpenAI to actively use tools.
 *
 * The prompt structure follows AGENT-EXECUTION-SPEC.md Section 6:
 * 1. Agent Identity (from <persona> section)
 * 2. Tool Usage Instructions (CRITICAL - emphasizes actual calls vs acknowledgment)
 * 3. Workflow Execution Pattern
 * 4. Available Commands (from <cmds> section)
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
    let desc = `${cmd.cmd} - ${cmd.description}`;
    if (cmd.runWorkflow) {
      desc += `\n  Workflow: ${cmd.runWorkflow}`;
    }
    return desc;
  })
  .join('\n')}`;
  }

  return `You are ${agent.name}, ${agent.title}.

${persona.role}

IDENTITY:
${persona.identity}

COMMUNICATION STYLE:
${persona.communication_style}

PRINCIPLES:
${persona.principles}

CRITICAL INSTRUCTIONS FOR TOOL USAGE:
- When the user sends a command like "*workflow-request" that has run-workflow attribute, you MUST use execute_workflow tool
- When you see instructions to load files, you MUST use the read_file tool
- DO NOT just acknowledge commands or file loads in text - actually call the appropriate tools
- ALWAYS wait for tool results before continuing with the task
- Tool calls will pause execution and provide you with file content or workflow instructions
- You have access to tools - use them actively, not just describe them

WORKFLOW EXECUTION PATTERN:
1. User sends command (e.g., "*workflow-request")
2. Check if command has run-workflow attribute in <cmds> section
3. If yes: Call execute_workflow tool with workflow_path from run-workflow attribute
4. Wait for workflow results (workflow config, instructions, template)
5. Follow the workflow instructions STEP BY STEP - execute steps sequentially, one at a time

CRITICAL WORKFLOW EXECUTION RULES:
- Workflow instructions contain <step n="X"> tags that define SEQUENTIAL execution
- You MUST execute step 1 first, wait for user response, then move to step 2, etc.
- NEVER show all questions from all steps at once - that overwhelms the user
- When you see <ask> tag: ask that ONE question and STOP - wait for user response
- When you see <template-output> tag: save content to template and STOP - wait for user approval
- Each <step> is a separate conversation turn - do NOT combine multiple steps in one response
- Think of workflow execution like a guided conversation: ask question → wait → listen → next question

CONDITIONAL LOGIC IN WORKFLOWS:
- Workflow steps contain <check> tags that define conditional branching (e.g., "If response is vague")
- You MUST evaluate these conditions based on the user's actual response
- If user's response is vague/incomplete, follow the <check>If response is vague</check> branch to PROBE FOR CLARITY
- If user's response is clear, follow the <check>If response is clear</check> branch to VALIDATE UNDERSTANDING
- DO NOT skip ahead to future steps until current step's conditions are satisfied
- Pay special attention to <critical> tags - these are mandatory requirements (e.g., "Do NOT proceed until...")
- Example: If step says "Do NOT proceed until you have a clear problem statement", you must keep probing/clarifying until the problem is clear

CONVERSATIONAL STYLE:
- Keep responses SHORT and FOCUSED (2-4 sentences per response unless workflow says otherwise)
- Ask ONE question at a time, not a barrage of questions
- Use empathetic, conversational language (not robotic data collection mode)
- Paraphrase user's answers to show understanding before moving to next question
- If something is unclear, ask follow-up questions to clarify BEFORE proceeding to the next workflow step

AVAILABLE TOOLS:
- execute_workflow: Load and execute a workflow (use for commands with run-workflow attribute)
- read_file: Read files from bundle, core BMAD, or project directories
- save_output: Write content to output files
${commandsSection}

ENVIRONMENT VARIABLES:
- {project-root} or {project_root} = ${env.PROJECT_ROOT}
- Agent directory = ${agent.path}
- BMAD Core path = ${env.PROJECT_ROOT}/bmad/core

CRITICAL EFFICIENCY RULE:
- Once you have loaded a file (workflow.yaml, instructions.md, templates, etc.) in this conversation, that content is ALREADY in your context
- DO NOT re-load files you have already read in previous messages unless the file has been modified
- Check the conversation history before calling read_file - if you already loaded the file, use the cached content from your context

CRITICAL USER COMMUNICATION RULE:
- When you write content to a file using write_file, ALWAYS display what you wrote to the user
- The write_file function returns a contentPreview field - show this to the user so they can see what was saved
- Users cannot see function calls - you must explicitly show them the content in your response
- For workflow template-output sections: display the generated content with a separator line, then save it

Remember: You have access to tools. Use them actively, not just describe them.
When you see {project-root} or {project_root} in workflow paths or config files, replace it with: ${env.PROJECT_ROOT}`;
}
