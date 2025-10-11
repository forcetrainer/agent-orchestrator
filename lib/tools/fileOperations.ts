/**
 * File Operation Tools for Agentic Execution
 *
 * Provides file operation tools that work within the agentic execution loop.
 * All tools resolve path variables before execution and return results
 * compatible with OpenAI tool calling format.
 *
 * Tools:
 * - read_file: Read files from bundle or core BMAD system
 * - save_output: Save generated content to file
 * - execute_workflow: Load workflow configuration, instructions, and template
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { dirname, resolve, sep, basename } from 'path';
import { load as parseYaml } from 'js-yaml';
import { resolvePath, PathContext, loadBundleConfig, validateWritePath } from '@/lib/pathResolver';
import { v4 as uuidv4 } from 'uuid';
import { validateFilename } from '@/lib/files/filenameValidator';

/**
 * Standard result format for all file operation tools
 * Compatible with agentic loop context injection
 */
export interface ToolResult {
  /** Whether the operation succeeded */
  success: boolean;
  /** Resolved file path (for debugging and visibility) */
  path?: string;
  /** File content (for read operations) */
  content?: string;
  /** Content/file size in characters/bytes */
  size?: number;
  /** Error message (if success: false) */
  error?: string;
  /** Additional tool-specific data */
  [key: string]: any;
}

/**
 * Parameters for read_file tool
 */
export interface ReadFileParams {
  /** Path to file. Can use variables: {bundle-root}, {core-root}, {project-root}, {config_source}:var */
  file_path: string;
}

/**
 * Parameters for save_output tool
 */
export interface SaveOutputParams {
  /** Path to save file. Can use variables: {bundle-root}, {core-root}, {project-root}, {config_source}:var */
  file_path: string;
  /** Content to write to file */
  content: string;
}

/**
 * Parameters for execute_workflow tool
 */
export interface ExecuteWorkflowParams {
  /** Path to workflow.yaml file */
  workflow_path: string;
  /** Optional user input data to pass to workflow */
  user_input?: Record<string, any>;
}

/**
 * Read File Tool
 *
 * Reads a file from the bundle or core BMAD system. Resolves path variables
 * before reading. Returns file content and metadata.
 *
 * @param params - File path (can contain variables)
 * @param context - PathContext with bundleRoot, coreRoot, projectRoot, bundleConfig
 * @returns ToolResult with success, path, content, size, or error
 */
export async function executeReadFile(
  params: ReadFileParams,
  context: PathContext
): Promise<ToolResult> {
  let resolvedPath: string | undefined;

  try {
    // Resolve path variables (includes security validation)
    resolvedPath = resolvePath(params.file_path, context);

    // Read file content
    const content = await readFile(resolvedPath, 'utf-8');

    return {
      success: true,
      path: resolvedPath,
      content: content,
      size: content.length,
    };
  } catch (error: any) {
    // Distinguish between file not found and other errors
    if (error.code === 'ENOENT') {
      return {
        success: false,
        error: `File not found: ${params.file_path}`,
        path: resolvedPath || params.file_path,
      };
    } else if (error.code === 'EACCES' || error.code === 'EPERM') {
      return {
        success: false,
        error: `Permission denied: ${params.file_path}`,
        path: resolvedPath || params.file_path,
      };
    } else if (error.message?.includes('Security violation')) {
      // Security violations from path resolution
      return {
        success: false,
        error: error.message,
        path: params.file_path,
      };
    } else {
      return {
        success: false,
        error: `Failed to read file: ${error.message}`,
        path: resolvedPath || params.file_path,
      };
    }
  }
}

/**
 * Save Output Tool
 *
 * Saves generated content to a file. Resolves path variables before writing.
 * Automatically creates parent directories if they don't exist.
 *
 * @param params - File path and content
 * @param context - PathContext with bundleRoot, coreRoot, projectRoot, bundleConfig
 * @returns ToolResult with success, path, size, or error
 */
export async function executeSaveOutput(
  params: SaveOutputParams,
  context: PathContext
): Promise<ToolResult> {
  let resolvedPath: string | undefined;

  try {
    // Story 6.5: Validate filename before resolving path
    // Extract filename from path for validation
    const filename = basename(params.file_path);
    try {
      validateFilename(filename);
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        path: params.file_path,
      };
    }

    // If sessionFolder is set and file_path is relative (doesn't start with { or /),
    // prepend session folder to ensure files save in session directory
    let filePathToResolve = params.file_path;
    console.log(`[save_output] DEBUG - sessionFolder: ${context.sessionFolder}, file_path: ${params.file_path}`);

    if (context.sessionFolder && !params.file_path.startsWith('{') && !params.file_path.startsWith('/')) {
      filePathToResolve = resolve(context.sessionFolder, params.file_path);
      console.log(`[save_output] Using session folder, filePathToResolve: ${filePathToResolve}`);
    }

    // Resolve path variables (includes security validation)
    // IMPORTANT: If sessionFolder was prepended, filePathToResolve is already an absolute path
    // resolvePath should handle it without modification since it has no variables
    console.log(`[save_output] Before resolvePath: ${filePathToResolve}`);
    resolvedPath = resolvePath(filePathToResolve, context);
    console.log(`[save_output] After resolvePath: ${resolvedPath}`);

    // Story 5.0: Validate write path is within /data/agent-outputs only
    try {
      validateWritePath(resolvedPath, context);
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        path: resolvedPath,
      };
    }

    // Legacy check: if path is within core-root (read-only directory)
    const normalizedCoreRoot = resolve(context.coreRoot);
    const normalizedPath = resolve(resolvedPath);
    const isInCore = normalizedPath.startsWith(normalizedCoreRoot + sep) || normalizedPath === normalizedCoreRoot;

    if (isInCore) {
      return {
        success: false,
        error: 'Write operation denied: Core files are read-only. Attempted to write to core-root directory.',
        path: resolvedPath,
      };
    }

    // Extract directory and create if doesn't exist
    const dir = dirname(resolvedPath);
    await mkdir(dir, { recursive: true });

    // Write file content
    await writeFile(resolvedPath, params.content, 'utf-8');

    return {
      success: true,
      path: resolvedPath,
      size: params.content.length,
    };
  } catch (error: any) {
    // Handle write errors
    if (error.code === 'EACCES' || error.code === 'EPERM') {
      return {
        success: false,
        error: `Permission denied: ${params.file_path}`,
        path: resolvedPath || params.file_path,
      };
    } else if (error.message?.includes('Security violation')) {
      // Security violations from path resolution
      return {
        success: false,
        error: error.message,
        path: params.file_path,
      };
    } else {
      return {
        success: false,
        error: `Failed to write file: ${error.message}`,
        path: resolvedPath || params.file_path,
      };
    }
  }
}

/**
 * Creates initial manifest.json for a new session
 *
 * Story 5.0: Auto-generates manifest on workflow start with status: "running"
 *
 * @param sessionId - UUID v4 session identifier
 * @param sessionFolder - Absolute path to session folder
 * @param workflowName - Name of the workflow
 * @param workflowDescription - Description of the workflow
 * @param author - Workflow author (e.g., "Alex the Facilitator")
 * @param bundleName - Bundle name extracted from bundle root path
 * @param bundleConfig - Bundle configuration with user_name
 */
async function createInitialManifest(
  sessionId: string,
  sessionFolder: string,
  workflowName: string,
  workflowDescription: string,
  author: string,
  bundleName: string,
  bundleConfig?: Record<string, any>
): Promise<void> {
  // Extract agent name from author (e.g., "Alex the Facilitator" -> "alex")
  const agentName = author.split(' ')[0].toLowerCase();

  const manifest = {
    version: '1.0.0',
    session_id: sessionId,
    agent: {
      name: agentName,
      title: author,
      bundle: bundleName,
    },
    workflow: {
      name: workflowName,
      description: workflowDescription,
    },
    execution: {
      started_at: new Date().toISOString(),
      status: 'running',
      user: bundleConfig?.user_name || 'unknown',
    },
    outputs: [],
    inputs: {},
    related_sessions: [],
    metadata: {},
  };

  const manifestPath = resolve(sessionFolder, 'manifest.json');
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`[createInitialManifest] Created manifest: ${manifestPath}`);
}

/**
 * Execute Workflow Tool
 *
 * Loads a workflow configuration, instructions, and optional template.
 * Resolves all path variables in the workflow configuration.
 *
 * Story 5.0: Generates UUID session ID, creates session folder, and injects session variables.
 *
 * @param params - Workflow path and optional user input
 * @param context - PathContext with bundleRoot, coreRoot, projectRoot, bundleConfig
 * @returns ToolResult with workflow data: name, description, instructions, template, config, user_input, session_id, session_folder
 */
export async function executeWorkflow(
  params: ExecuteWorkflowParams,
  context: PathContext
): Promise<ToolResult> {
  let resolvedWorkflowPath: string | undefined;

  try {
    // Resolve workflow path (includes security validation)
    resolvedWorkflowPath = resolvePath(params.workflow_path, context);
    console.log(`[executeWorkflow] 📄 Loading workflow.yaml: ${resolvedWorkflowPath}`);

    // Read and parse workflow.yaml
    const workflowContent = await readFile(resolvedWorkflowPath, 'utf-8');
    console.log(`[executeWorkflow] ✅ Loaded workflow.yaml (${workflowContent.length} bytes)`);
    const workflowConfig = parseYaml(workflowContent) as Record<string, any>;

    // Extract workflow metadata
    const workflowName = workflowConfig.name || 'Unnamed Workflow';
    const description = workflowConfig.description || '';
    console.log(`[executeWorkflow] Workflow name: "${workflowName}"`);

    // Story 5.0: Generate UUID v4 session ID
    const sessionId = uuidv4();
    console.log(`[executeWorkflow] Generated session ID: ${sessionId}`);

    // Story 5.0: Inject session_id into workflow config for variable resolution
    workflowConfig.session_id = sessionId;

    // Create enhanced context - we'll update bundleConfig if we find config files
    const enhancedContext: PathContext = {
      ...context,
      bundleConfig: context.bundleConfig,
    };

    // First pass: Resolve workflow config variables
    let resolvedConfig = await resolveWorkflowVariables(
      workflowConfig,
      enhancedContext
    );

    // Story 5.0: Second pass to resolve session_folder after session_id is injected
    // The session_folder might reference {{session_id}}, so we need another resolution pass
    resolvedConfig = await resolveWorkflowVariables(
      resolvedConfig,
      enhancedContext
    );

    // Dynamic file loading: Load any file paths found in the workflow config
    // This replaces hardcoded keys like 'instructions', 'template', 'config_source'
    const loadedFiles: Record<string, string> = {};

    for (const [key, value] of Object.entries(resolvedConfig)) {
      // Skip non-string values and known non-file keys
      if (typeof value !== 'string') continue;
      if (key === 'name' || key === 'description' || key === 'author' || key === 'category' || key === 'request_type') continue;
      if (key === 'session_id' || key === 'project_slug' || key === 'date') continue;

      // Skip values that still contain unresolved variables
      if (value.includes('{') || value.includes('{{')) {
        console.log(`[executeWorkflow] ⏭️  Skipping ${key}: contains unresolved variables: ${value}`);
        continue;
      }

      // Skip values that look like variable references (e.g., "config.yaml:project_name")
      if (value.includes(':') && !value.startsWith('/') && !value.startsWith('{')) {
        console.log(`[executeWorkflow] ⏭️  Skipping ${key}: looks like variable reference, not a file: ${value}`);
        continue;
      }

      // Check if value looks like a file path with extension
      const hasFileExtension = /\.(md|yaml|yml|json|txt|csv|js|ts|xml|html|css)$/i.test(value);

      // Only load if it has a file extension (to avoid directories and other non-file paths)
      if (hasFileExtension) {
        try {
          const filePath = resolvePath(value, enhancedContext);
          console.log(`[executeWorkflow] 📄 Loading ${key}: ${filePath}`);
          const fileContent = await readFile(filePath, 'utf-8');
          console.log(`[executeWorkflow] ✅ Loaded ${key} (${fileContent.length} bytes, ${fileContent.split('\n').length} lines)`);
          loadedFiles[key] = fileContent;

          // Special handling: if this looks like a config file, parse it and update bundleConfig
          if (key.toLowerCase().includes('config') && (filePath.endsWith('.yaml') || filePath.endsWith('.yml'))) {
            try {
              const parsedConfig = parseYaml(fileContent) as Record<string, any>;
              enhancedContext.bundleConfig = { ...enhancedContext.bundleConfig, ...parsedConfig };
              console.log(`[executeWorkflow] Updated bundleConfig with variables from ${key}: ${Object.keys(parsedConfig).join(', ')}`);

              // Re-resolve workflow variables now that we have more config
              resolvedConfig = await resolveWorkflowVariables(resolvedConfig, enhancedContext);
            } catch (error) {
              console.warn(`[executeWorkflow] Could not parse ${key} as YAML config: ${error}`);
            }
          }
        } catch (error: any) {
          if (error.code === 'ENOENT') {
            console.log(`[executeWorkflow] ❌ File not found for ${key}: ${value}`);
          } else if (error.code === 'EISDIR') {
            console.log(`[executeWorkflow] ⏭️  Skipping ${key}: is a directory, not a file: ${value}`);
          } else if (error.message?.includes('Unable to resolve variables')) {
            console.log(`[executeWorkflow] ❌ Cannot resolve path for ${key}: ${value}`);
            console.log(`[executeWorkflow]    Error: ${error.message}`);
          } else {
            console.warn(`[executeWorkflow] ❌ Could not load ${key}: ${error.message}`);
            console.warn(`[executeWorkflow]    Path was: ${value}`);
          }
        }
      }
    }

    // Story 5.0: Create session folder - ALWAYS create for all workflows
    let sessionFolder = '';

    if (resolvedConfig.session_folder) {
      // Story 5.0: Final mustache replacement for {{session_id}} in session_folder
      sessionFolder = resolvedConfig.session_folder
        .replace(/\{\{session_id\}\}/g, sessionId)
        .replace(/\{session_id\}/g, sessionId);

      // Story 5.0: Resolve any remaining path variables (like {project-root})
      if (sessionFolder.includes('{')) {
        try {
          sessionFolder = resolvePath(sessionFolder, enhancedContext);
        } catch (error: any) {
          console.warn(`[executeWorkflow] Could not fully resolve session_folder: ${error.message}`);
        }
      }
    } else {
      // If workflow doesn't define session_folder, auto-generate one
      sessionFolder = resolve(context.projectRoot, 'data/agent-outputs', sessionId);
      console.log(`[executeWorkflow] Auto-generated session folder (not defined in workflow): ${sessionFolder}`);
    }

    // Story 5.1 Security: Validate session folder is within /data/agent-outputs ONLY
    try {
      validateWritePath(sessionFolder, enhancedContext);
    } catch (error: any) {
      return {
        success: false,
        error: `Security violation: Session folder must be within /data/agent-outputs. ${error.message}`,
        path: sessionFolder,
      };
    }

    // Create the session directory
    await mkdir(sessionFolder, { recursive: true });
    console.log(`[executeWorkflow] Created session folder: ${sessionFolder}`);

    // Story 5.0: Create initial manifest.json
    // Extract agent metadata from workflow and context
    const author = workflowConfig.author || 'Unknown Agent';
    const bundleName = context.bundleRoot.split('/').pop() || 'unknown';

    await createInitialManifest(sessionId, sessionFolder, workflowName, description, author, bundleName, enhancedContext.bundleConfig);

    console.log(`[executeWorkflow] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`[executeWorkflow] 🎯 Workflow loaded successfully: "${workflowName}"`);
    console.log(`[executeWorkflow] 📁 Session folder: ${sessionFolder}`);
    console.log(`[executeWorkflow] 🆔 Session ID: ${sessionId}`);
    console.log(`[executeWorkflow] 📂 Loaded files: ${Object.keys(loadedFiles).length > 0 ? Object.keys(loadedFiles).join(', ') : 'none'}`);
    console.log(`[executeWorkflow] ⚙️  Config variables: ${Object.keys(resolvedConfig).length} total`);
    console.log(`[executeWorkflow] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    // Return all loaded files dynamically
    const toolResult = {
      success: true,
      path: resolvedWorkflowPath,
      workflow_name: workflowName,
      description: description,
      config: resolvedConfig,
      user_input: params.user_input || {},
      session_id: sessionId,
      session_folder: sessionFolder,
      ...loadedFiles, // Spread all loaded files into the result (instructions, template, etc.)
    };

    // Log what's being returned to the LLM
    console.log(`[executeWorkflow] 🔄 Returning to LLM:`);
    console.log(`[executeWorkflow]    - workflow_name: ${toolResult.workflow_name}`);
    console.log(`[executeWorkflow]    - session_id: ${toolResult.session_id}`);
    console.log(`[executeWorkflow]    - session_folder: ${toolResult.session_folder}`);
    for (const [key, value] of Object.entries(loadedFiles)) {
      const content = typeof value === 'string' ? value : JSON.stringify(value);
      console.log(`[executeWorkflow]    - ${key}: ${content.length} chars, ${content.split('\n').length} lines`);
    }

    return toolResult;
  } catch (error: any) {
    // Handle various error types
    if (error.code === 'ENOENT') {
      return {
        success: false,
        error: `Workflow file not found: ${params.workflow_path}`,
        path: resolvedWorkflowPath || params.workflow_path,
      };
    } else if (error.message?.includes('Security violation')) {
      return {
        success: false,
        error: error.message,
        path: params.workflow_path,
      };
    } else if (error.name === 'YAMLException') {
      return {
        success: false,
        error: `Invalid YAML in workflow file: ${error.message}`,
        path: resolvedWorkflowPath || params.workflow_path,
      };
    } else {
      return {
        success: false,
        error: `Failed to load workflow: ${error.message}`,
        path: resolvedWorkflowPath || params.workflow_path,
      };
    }
  }
}

/**
 * Resolves variables in workflow configuration
 *
 * Handles nested variable resolution where workflow variables reference other workflow variables.
 * Example: installed_path: "{bundle-root}/workflows/intake" → instructions: "{installed_path}/instructions.md"
 *
 * Uses multiple passes to resolve variables that depend on other workflow-defined variables.
 *
 * @param config - Workflow configuration object
 * @param context - PathContext with resolved variables
 * @returns Configuration with all path variables resolved
 */
async function resolveWorkflowVariables(
  config: Record<string, any>,
  context: PathContext
): Promise<Record<string, any>> {
  const MAX_PASSES = 5; // Prevent infinite loops
  let currentConfig = { ...config };
  let hasUnresolvedVars = true;
  let passCount = 0;

  // Multi-pass resolution for nested workflow variables
  while (hasUnresolvedVars && passCount < MAX_PASSES) {
    passCount++;
    hasUnresolvedVars = false;
    const resolved: Record<string, any> = {};

    // Create extended context that includes already-resolved workflow variables
    const extendedContext: PathContext = {
      ...context,
      // Add workflow variables to context for nested resolution
      // This allows {installed_path} to be resolved if it's already been processed
    };

    for (const [key, value] of Object.entries(currentConfig)) {
      if (typeof value === 'string') {
        // Attempt to resolve path variables in strings
        if (value.includes('{')) {
          try {
            // First try to replace workflow-defined variables
            let resolvedValue = value;

            // Replace references to other workflow variables (e.g., {installed_path})
            // Story 5.0: Also support {{session_id}} mustache syntax (double braces)
            for (const [varKey, varValue] of Object.entries(currentConfig)) {
              if (typeof varValue === 'string' && !varValue.includes('{')) {
                // This variable is already resolved, can be used for substitution
                const varPattern = new RegExp(`\\{${varKey}\\}`, 'g');
                const mustachePattern = new RegExp(`\\{\\{${varKey}\\}\\}`, 'g');
                resolvedValue = resolvedValue.replace(varPattern, varValue);
                resolvedValue = resolvedValue.replace(mustachePattern, varValue);
              }
            }

            // Then resolve path variables ({bundle-root}, {core-root}, etc.)
            if (resolvedValue.includes('{')) {
              resolvedValue = resolvePath(resolvedValue, context);
            }

            resolved[key] = resolvedValue;

            // Check if this value still has unresolved variables
            if (resolvedValue.includes('{')) {
              hasUnresolvedVars = true;
            }
          } catch (error) {
            // If resolution fails, keep original value and mark as unresolved
            resolved[key] = value;
            if (value.includes('{')) {
              hasUnresolvedVars = true;
            }
          }
        } else {
          resolved[key] = value;
        }
      } else if (Array.isArray(value)) {
        // Recursively resolve arrays
        resolved[key] = await Promise.all(
          value.map(async (item) => {
            if (typeof item === 'string' && item.includes('{')) {
              try {
                // Same multi-pass logic for array items
                let resolvedItem = item;
                for (const [varKey, varValue] of Object.entries(currentConfig)) {
                  if (typeof varValue === 'string' && !varValue.includes('{')) {
                    const varPattern = new RegExp(`\\{${varKey}\\}`, 'g');
                    resolvedItem = resolvedItem.replace(varPattern, varValue);
                  }
                }
                if (resolvedItem.includes('{')) {
                  resolvedItem = resolvePath(resolvedItem, context);
                }
                return resolvedItem;
              } catch {
                return item;
              }
            } else if (typeof item === 'object' && item !== null) {
              return resolveWorkflowVariables(item, context);
            } else {
              return item;
            }
          })
        );
      } else if (typeof value === 'object' && value !== null) {
        // Recursively resolve nested objects
        resolved[key] = await resolveWorkflowVariables(value, context);
      } else {
        // Keep primitive values as-is
        resolved[key] = value;
      }
    }

    currentConfig = resolved;
  }

  // If we still have unresolved variables after MAX_PASSES, log warning but return what we have
  if (hasUnresolvedVars) {
    console.warn('[resolveWorkflowVariables] Some variables could not be resolved after', MAX_PASSES, 'passes');
  }

  return currentConfig;
}
