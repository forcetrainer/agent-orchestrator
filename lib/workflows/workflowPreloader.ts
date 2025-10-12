/**
 * Smart Workflow Pre-loader
 * Story 9.4: Implement Smart Workflow Pre-loading
 *
 * Loads all files needed for workflow execution in a single operation.
 * Replaces multi-step LLM orchestration with fast parser-based loading.
 *
 * PERFORMANCE:
 * - Baseline (Story 9.3): ~110 seconds for 4 files (sequential read_file calls)
 * - Target (Story 9.4): <20 seconds (parallel Promise.all loading)
 * - Token reduction: 50-70% (single tool call vs 4-6 API round-trips)
 * - No rate limit pressure (10K TPM limit no longer hit)
 */

import { PathContext, resolvePath } from '@/lib/pathResolver';
import { promises as fs } from 'fs';
import path from 'path';
import * as yaml from 'js-yaml';

/**
 * Result of pre-loading workflow files
 */
export interface PreloadResult {
  // Core files (always loaded)
  workflowYaml: any;
  configYaml: any;
  instructions: string;
  template: string | null;
  workflowEngine: string;

  // Conditionally loaded files
  elicitTask?: string;
  invokedWorkflows?: Record<string, any>;

  // Metadata for LLM
  filesLoaded: string[];
  message: string;
}

/**
 * Pre-loads all files needed for a workflow execution.
 *
 * This function:
 * 1. Loads workflow.yaml and parses it
 * 2. Resolves YAML-internal variables (e.g., {installed_path})
 * 3. Loads all referenced files in parallel (config, instructions, template, engine)
 * 4. Conditionally loads files based on instruction content (elicit task, etc.)
 * 5. Returns all content with clear message for LLM
 *
 * @param workflowPath - Path to workflow.yaml (e.g., {bundle-root}/workflows/intake-integration/workflow.yaml)
 * @param pathContext - Path resolution context (bundle-root, core-root, project-root)
 * @returns PreloadResult with all file contents and metadata
 * @throws Error if required files are missing or YAML parsing fails
 */
export async function preloadWorkflowFiles(
  workflowPath: string,
  pathContext: PathContext
): Promise<PreloadResult> {
  const filesLoaded: string[] = [];

  // Step 1: Load workflow.yaml
  const resolvedWorkflowPath = resolvePath(workflowPath, pathContext);
  const workflowContent = await fs.readFile(resolvedWorkflowPath, 'utf-8');
  const workflowYaml = yaml.load(workflowContent) as any;
  filesLoaded.push(workflowPath);

  // Step 2: Resolve YAML-internal variables (e.g., {installed_path})
  const resolvedPaths = resolveWorkflowInternalVariables(workflowYaml, pathContext);

  // Step 3: Load core files in parallel
  const [configYaml, instructions, template, workflowEngine] = await Promise.all([
    loadConfigFile(resolvedPaths.config_source, pathContext),
    loadFileContent(resolvedPaths.instructions, pathContext),
    resolvedPaths.template ? loadFileContent(resolvedPaths.template, pathContext) : Promise.resolve(null),
    loadFileContent('{project-root}/bmad/core/tasks/workflow.md', pathContext)
  ]);

  filesLoaded.push(
    resolvedPaths.config_source,
    resolvedPaths.instructions,
    '{project-root}/bmad/core/tasks/workflow.md'
  );
  if (resolvedPaths.template) {
    filesLoaded.push(resolvedPaths.template);
  }

  // Step 4: Parse instructions for conditional file loading
  let elicitTask: string | undefined;

  if (instructions.includes('<elicit-required>')) {
    elicitTask = await loadFileContent('{project-root}/bmad/core/tasks/adv-elicit.md', pathContext);
    filesLoaded.push('{project-root}/bmad/core/tasks/adv-elicit.md');
  }

  // TODO: Handle <invoke-workflow> tags (parse and load referenced workflows)
  // This is future extensibility - not required for MVP

  return {
    workflowYaml,
    configYaml,
    instructions,
    template,
    workflowEngine,
    elicitTask,
    filesLoaded,
    message: buildPreloadMessage(filesLoaded)
  };
}

/**
 * Resolves YAML-internal variables like {installed_path}.
 *
 * Example workflow.yaml:
 * ```yaml
 * installed_path: "{bundle-root}/workflows/intake-integration"
 * instructions: "{installed_path}/instructions.md"
 * template: "{bundle-root}/templates/initial-requirements.md"
 * config_source: "{bundle-root}/config.yaml"
 * ```
 *
 * This function finds variables defined in the YAML itself (like installed_path)
 * and replaces references to them in other path values.
 *
 * @param workflowYaml - Parsed workflow.yaml object
 * @param pathContext - Path context for resolving {bundle-root} etc.
 * @returns Object with resolved paths (config_source, instructions, template)
 */
function resolveWorkflowInternalVariables(
  workflowYaml: any,
  pathContext: PathContext
): { config_source: string; instructions: string; template: string | null } {
  // Build a map of YAML-internal variables
  const internalVars: Record<string, string> = {};

  // Scan for variables that might be used as references
  // Common pattern: installed_path, bundle_path, etc.
  for (const key of Object.keys(workflowYaml)) {
    const value = workflowYaml[key];
    if (typeof value === 'string' && value.includes('{') && key.endsWith('_path')) {
      // This looks like a path variable definition
      internalVars[key] = value;
    }
  }

  // Helper to resolve a path with internal variables (iterative to handle nested refs)
  const resolveWithInternalVars = (pathStr: string | null): string | null => {
    if (!pathStr) return null;
    let resolved = pathStr;
    let changed = true;
    let iterations = 0;
    const maxIterations = 10; // Prevent infinite loops

    // Keep resolving until no more changes (handles nested variable references)
    while (changed && iterations < maxIterations) {
      changed = false;
      iterations++;

      // Replace {installed_path} and similar with their values
      for (const [varName, varValue] of Object.entries(internalVars)) {
        const placeholder = `{${varName}}`;
        if (resolved.includes(placeholder)) {
          resolved = resolved.replace(placeholder, varValue);
          changed = true;
        }
      }
    }

    return resolved;
  };

  return {
    config_source: resolveWithInternalVars(workflowYaml.config_source) || '',
    instructions: resolveWithInternalVars(workflowYaml.instructions) || '',
    template: resolveWithInternalVars(workflowYaml.template) || null
  };
}

/**
 * Loads a file and returns its content as a string.
 *
 * @param filePath - Path with variables (e.g., {bundle-root}/instructions.md)
 * @param pathContext - Path context for variable resolution
 * @returns File content as string
 * @throws Error if file cannot be read
 */
async function loadFileContent(filePath: string, pathContext: PathContext): Promise<string> {
  const resolvedPath = resolvePath(filePath, pathContext);
  return await fs.readFile(resolvedPath, 'utf-8');
}

/**
 * Loads a config file (YAML format) and returns parsed object.
 *
 * @param filePath - Path to config.yaml
 * @param pathContext - Path context for variable resolution
 * @returns Parsed YAML object
 * @throws Error if file cannot be read or parsed
 */
async function loadConfigFile(filePath: string, pathContext: PathContext): Promise<any> {
  const content = await loadFileContent(filePath, pathContext);
  return yaml.load(content);
}

/**
 * Builds the instructional message for LLM.
 *
 * This message is included in the tool result to tell the LLM:
 * - Which files were pre-loaded
 * - That it should NOT call read_file for these files again
 * - How to proceed (follow instructions step-by-step)
 *
 * @param filesLoaded - Array of file paths that were loaded
 * @returns Formatted message string
 */
function buildPreloadMessage(filesLoaded: string[]): string {
  return `
All workflow files have been pre-loaded for you:

${filesLoaded.map((f, i) => `${i + 1}. ${f}`).join('\n')}

**IMPORTANT**:
- You do NOT need to call read_file for these files - their content is already available above
- Follow the workflow instructions step-by-step in exact order
- Use save_output to write files as instructed
- Maintain conversation context with the user throughout execution

Begin by following Step 1 of the instructions.
  `.trim();
}
