/**
 * Critical Actions Processor Module
 * Story 4.3: Implement Critical Actions Processor
 *
 * Processes agent critical-actions during initialization to:
 * - Load bundle config.yaml files
 * - Set up initial context with user preferences
 * - Inject system messages before user interaction
 *
 * Critical actions run BEFORE the agentic execution loop starts.
 * Failure during critical actions halts initialization.
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
    console.log('[criticalActions] No critical actions found in agent definition');
    return { messages, config: bundleConfig };
  }

  console.log(`[criticalActions] Processing ${criticalActions.length} critical actions`);

  // Initialize path context for resolution
  const context: PathContext = {
    bundleRoot,
    coreRoot: `${process.cwd()}/bmad/core`,
    projectRoot: process.cwd(),
    bundleConfig: undefined,
  };

  // Process each critical action in sequence
  // AC-4.3.7: All critical actions complete before agent accepts first user message
  for (let i = 0; i < criticalActions.length; i++) {
    const instruction = criticalActions[i].trim();

    try {
      // AC-4.3.2: Extract file load instructions
      const fileLoadMatch = instruction.match(
        /Load (?:into memory )?(.+?)(?: and set variables: (.+?))?$/i
      );

      if (fileLoadMatch) {
        // This is a file load instruction
        const filePath = fileLoadMatch[1].trim();
        const variables = fileLoadMatch[2]?.trim();

        console.log(`[criticalActions] Loading file: ${filePath}`);

        // AC-4.3.3: Execute file loads via read_file function
        const resolvedPath = resolvePath(filePath, context);
        const fileContent = await readFile(resolvedPath, 'utf-8');

        // AC-4.3.4: Inject loaded file contents as system messages
        messages.push({
          role: 'system',
          content: `[Critical Action] Loaded file: ${resolvedPath}\n\n${fileContent}`,
        });

        // AC-4.3.5: Parse config.yaml files and store variables
        if (filePath.includes('config.yaml')) {
          bundleConfig = parseYaml(fileContent) as Record<string, any>;
          context.bundleConfig = bundleConfig;
          console.log(
            `[criticalActions] Parsed config.yaml with variables: ${Object.keys(bundleConfig).join(', ')}`
          );

          // Log if specific variables were mentioned
          if (variables) {
            console.log(`[criticalActions] Setting variables: ${variables}`);
          }
        }
      } else {
        // AC-4.3.6: Execute non-file instructions as system messages
        // Resolve any config variables in the instruction text
        let resolvedInstruction = instruction;

        if (context.bundleConfig) {
          // Replace {variable_name} with values from bundleConfig
          resolvedInstruction = instruction.replace(
            /\{(\w+)\}/g,
            (match, varName) => {
              if (context.bundleConfig && varName in context.bundleConfig) {
                return String(context.bundleConfig[varName]);
              }
              return match; // Keep original if not found
            }
          );
        }

        console.log(`[criticalActions] Non-file instruction: ${resolvedInstruction}`);

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

  console.log(
    `[criticalActions] Completed successfully: ${messages.length} messages, config ${bundleConfig ? 'loaded' : 'not loaded'}`
  );

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
