/**
 * Critical Actions Processor Module
 * Story 4.3: Implement Critical Actions Processor
 *
 * Processes agent critical actions during initialization to set up the agent's
 * initial context BEFORE any user interaction or agentic loop execution begins.
 *
 * WHAT ARE CRITICAL ACTIONS?
 * Critical actions are initialization instructions defined in an agent's <critical-actions>
 * XML section. They specify which files must be loaded and what context must be set up
 * before the agent can begin processing user messages.
 *
 * INITIALIZATION SEQUENCE:
 * 1. Agent selected/loaded by user
 * 2. Parse <critical-actions> section from agent.md XML
 * 3. Execute each critical action in sequence:
 *    - File load instructions → Read file and inject as system message
 *    - Config files (config.yaml) → Parse YAML and store variables
 *    - Other instructions → Inject as system messages
 * 4. All critical actions complete successfully
 * 5. Agent ready for user interaction
 *
 * TIMING:
 * Critical actions run BEFORE the agentic execution loop starts.
 * They happen during agent initialization, not during message processing.
 * Failure during critical actions HALTS initialization - agent won't be available.
 *
 * EXAMPLE CRITICAL ACTIONS:
 * <critical-actions>
 *   <i>Load into memory {bundle-root}/config.yaml and set variables: user_name, output_folder</i>
 *   <i>Remember the user's name is {user_name}</i>
 *   <i>ALWAYS communicate in {communication_language}</i>
 * </critical-actions>
 *
 * Result: config.yaml loaded, variables parsed, instructions injected as system messages
 *
 * For complete specification, see: docs/AGENT-EXECUTION-SPEC.md Section 4
 * @see https://github.com/your-repo/docs/AGENT-EXECUTION-SPEC.md#4-critical-actions-processor
 */

import { readFile } from 'fs/promises';
import { load as parseYaml } from 'js-yaml';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { resolvePath, type PathContext } from '@/lib/pathResolver';
import type { Agent } from '@/types';

/**
 * Context returned from critical actions processor.
 * Contains system messages to inject before user input and parsed bundle config.
 *
 * AC-4.3.4: System messages injected before user input
 */
export interface CriticalContext {
  /** System messages to inject into conversation context */
  messages: Array<ChatCompletionMessageParam>;
  /** Parsed bundle configuration (null if no config loaded) */
  config: Record<string, any> | null;
}

/**
 * Processes critical actions from agent definition.
 *
 * AC-4.3.1: Parse <critical-actions> section from agent.md XML
 * AC-4.3.2: Extract file load instructions
 * AC-4.3.3: Execute file loads via read_file function
 * AC-4.3.4: Inject loaded file contents as system messages
 * AC-4.3.5: Parse config.yaml files and store variables
 * AC-4.3.6: Execute non-file instructions as system messages
 * AC-4.3.7: All critical actions complete before agent accepts first user message
 * AC-4.3.8: Errors in critical actions halt initialization with clear message
 *
 * @param agent - Agent metadata with fullContent containing XML
 * @param bundleRoot - Root path to bundle directory for path resolution
 * @returns CriticalContext with system messages and bundle config
 * @throws Error if file load fails or critical action cannot be executed
 */
export async function processCriticalActions(
  agent: Agent,
  bundleRoot: string
): Promise<CriticalContext> {
  const messages: Array<ChatCompletionMessageParam> = [];
  let bundleConfig: Record<string, any> | null = null;

  // AC-4.3.1: Parse <critical-actions> section from agent.md XML
  const criticalActions = extractCriticalActions(agent.fullContent);

  // If no critical actions, return empty context
  if (criticalActions.length === 0) {
    return { messages, config: bundleConfig };
  }

  // Initialize path context for resolution
  const context: PathContext = {
    'bundle-root': bundleRoot,
    'core-root': `${process.cwd()}/bmad/core`,
    'project-root': process.cwd(),
  };

  // SEQUENTIAL PROCESSING
  // Process each critical action in sequence (order matters!)
  // AC-4.3.7: All critical actions complete before agent accepts first user message
  // This loop is the heart of the initialization sequence
  for (let i = 0; i < criticalActions.length; i++) {
    const instruction = criticalActions[i].trim();

    try {
      // AC-4.3.2: Extract file load instructions
      // Pattern: "Load into memory {bundle-root}/config.yaml and set variables: var1, var2"
      const fileLoadMatch = instruction.match(
        /Load (?:into memory )?(.+?)(?: and set variables: (.+?))?$/i
      );

      if (fileLoadMatch) {
        // FILE LOAD PATTERN
        // This is a file load instruction - most critical actions are file loads
        const filePath = fileLoadMatch[1].trim();
        const variables = fileLoadMatch[2]?.trim();

        // AC-4.3.3: Execute file loads via path resolution + read_file
        // Path resolution handles {bundle-root}, {core-root}, etc.
        const resolvedPath = resolvePath(filePath, context);
        const fileContent = await readFile(resolvedPath, 'utf-8');

        // AC-4.3.4: INJECT FILE CONTENT - Inject loaded file contents as system messages
        // This makes the file content available to the agent before any user interaction
        // The LLM will see this content in the initial conversation context
        messages.push({
          role: 'system',
          content: `[Critical Action] Loaded file: ${resolvedPath}\n\n${fileContent}`,
        });

        // AC-4.3.5: PARSE CONFIG - Parse config.yaml files and store variables
        // Special handling for config files: parse YAML and store for later use
        // Note: After Story 9.2, config variables are no longer auto-resolved in paths
        // LLM now explicitly handles config variable substitution
        if (filePath.includes('config.yaml')) {
          bundleConfig = parseYaml(fileContent) as Record<string, any>;
        }
      } else {
        // NON-FILE INSTRUCTION PATTERN
        // AC-4.3.6: Execute non-file instructions as system messages
        // Examples: "Remember the user's name is {user_name}"
        //          "ALWAYS communicate in {communication_language}"
        // These become system-level instructions for the agent

        // Resolve any config variables in the instruction text
        // If config was loaded in previous actions, variables like {user_name} will be replaced
        let resolvedInstruction = instruction;

        if (bundleConfig) {
          // Replace {variable_name} with values from bundleConfig
          resolvedInstruction = instruction.replace(
            /\{(\w+)\}/g,
            (match, varName) => {
              if (bundleConfig && varName in bundleConfig) {
                return String(bundleConfig[varName]);
              }
              return match; // Keep original if not found
            }
          );
        }

        // Inject as system message
        messages.push({
          role: 'system',
          content: `[Critical Instruction] ${resolvedInstruction}`,
        });
      }
    } catch (error: any) {
      // AC-4.3.8: Errors in critical actions halt initialization with clear message
      const errorMessage = `Critical action failed: ${instruction}\nError: ${error.message || String(error)}`;
      console.error(`[criticalActions] ${errorMessage}`);
      throw new Error(errorMessage);
    }
  }

  return { messages, config: bundleConfig };
}

/**
 * Extracts critical action instructions from agent XML content.
 *
 * AC-4.3.1: Parse <critical-actions> section from agent.md XML
 *
 * Extraction pattern:
 * - Find <critical-actions> opening tag
 * - Extract all <i>...</i> instruction elements
 * - Return array of instruction strings
 *
 * @param agentContent - Full agent markdown content with XML
 * @returns Array of critical action instruction strings (empty if no critical-actions section)
 */
function extractCriticalActions(agentContent: string): string[] {
  // Find <critical-actions> section
  const criticalActionsMatch = agentContent.match(
    /<critical-actions>([\s\S]*?)<\/critical-actions>/
  );

  if (!criticalActionsMatch) {
    return [];
  }

  const criticalActionsSection = criticalActionsMatch[1];

  // Extract all <i>...</i> instruction elements
  const instructionPattern = /<i(?:\s+[^>]*)?>([^<]+)<\/i>/g;
  const instructions: string[] = [];

  let match;
  while ((match = instructionPattern.exec(criticalActionsSection)) !== null) {
    const instruction = match[1].trim();
    if (instruction) {
      instructions.push(instruction);
    }
  }

  return instructions;
}
