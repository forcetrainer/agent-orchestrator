/**
 * Path Variable Resolution System
 *
 * Resolves BMAD path variables in file paths to enable portable agent workflows.
 * This system allows agents and workflows to reference files using variables instead
 * of hardcoded paths, making bundles portable across different installations.
 *
 * SUPPORTED VARIABLES:
 * - Path variables: {bundle-root}, {core-root}, {project-root}
 * - Config references: {config_source}:variable_name
 * - System variables: {date}, {user_name}
 * - Nested variable resolution (variables can reference other variables)
 *
 * RESOLUTION ORDER (CRITICAL - order matters!):
 * 1. Config references ({config_source}:variable_name) - Load values from bundle config.yaml
 * 2. System variables ({date}, {user_name}) - Generate runtime values
 * 3. Path variables ({bundle-root}, {core-root}, {project-root}) - Replace with actual paths
 * 4. Nested resolution - If replaced values contain variables, repeat steps 1-3 (max 10 iterations)
 *
 * EXAMPLE:
 * Input:  "{config_source}:output_folder/report-{date}.md"
 * Step 1: "{project-root}/docs/report-{date}.md" (config says output_folder = "{project-root}/docs")
 * Step 2: "{project-root}/docs/report-2025-10-05.md" (date resolved)
 * Step 3: "/Users/bryan/agent-orchestrator/docs/report-2025-10-05.md" (project-root resolved)
 * Output: "/Users/bryan/agent-orchestrator/docs/report-2025-10-05.md"
 *
 * SECURITY:
 * - All resolved paths validated to be within bundleRoot, coreRoot, or projectRoot
 * - Path traversal attempts (..) are blocked
 * - Symbolic links resolved to real paths and validated
 * - Null bytes and invalid characters rejected
 *
 * For complete specification, see: docs/AGENT-EXECUTION-SPEC.md Section 5
 * @see https://github.com/your-repo/docs/AGENT-EXECUTION-SPEC.md#5-path-resolution-system
 */

import { resolve, normalize, isAbsolute, sep } from 'path';
import { readFile } from 'fs/promises';
import { realpathSync } from 'fs';
import { load as parseYaml } from 'js-yaml';
import { env } from '@/lib/utils/env';

/**
 * Context for path variable resolution
 */
export interface PathContext {
  /** Path to bundle directory: bmad/custom/bundles/{bundle-name} */
  bundleRoot: string;
  /** Path to core directory: bmad/core */
  coreRoot: string;
  /** Project root directory (absolute path) */
  projectRoot: string;
  /** Parsed bundle config.yaml (optional) */
  bundleConfig?: Record<string, any>;
  /** Active session folder path (set by conversation initialization, used by save_output) */
  sessionFolder?: string;
}

/**
 * Cache for parsed bundle configs to avoid repeated file reads
 */
const configCache = new Map<string, Record<string, any>>();

/**
 * Clears the bundle config cache (mainly for testing)
 */
export function clearConfigCache(): void {
  configCache.clear();
}

/**
 * Maximum iterations for nested variable resolution (prevents infinite loops)
 */
const MAX_RESOLUTION_ITERATIONS = 10;

/**
 * Creates a PathContext from bundle name and optional config
 *
 * @param bundleName - Name of the bundle (e.g., "requirements-workflow")
 * @param bundleConfig - Optional pre-loaded bundle config
 * @returns PathContext for use with resolvePath
 */
export function createPathContext(
  bundleName: string,
  bundleConfig?: Record<string, any>
): PathContext {
  const projectRoot = env.PROJECT_ROOT;
  const bundleRoot = resolve(projectRoot, 'bmad/custom/bundles', bundleName);
  const coreRoot = resolve(projectRoot, 'bmad/core');

  return {
    bundleRoot,
    coreRoot,
    projectRoot,
    bundleConfig,
  };
}

/**
 * Loads and parses config.yaml from bundle directory
 *
 * @param bundleRoot - Absolute path to bundle directory
 * @returns Parsed config object, or empty object if config doesn't exist
 */
export async function loadBundleConfig(
  bundleRoot: string
): Promise<Record<string, any>> {
  // Check cache first
  if (configCache.has(bundleRoot)) {
    return configCache.get(bundleRoot)!;
  }

  const configPath = resolve(bundleRoot, 'config.yaml');

  try {
    const content = await readFile(configPath, 'utf-8');
    const config = parseYaml(content) as Record<string, any>;

    // Cache the parsed config
    configCache.set(bundleRoot, config);

    return config;
  } catch (error: any) {
    // If file doesn't exist, return empty config (not an error)
    if (error.code === 'ENOENT') {
      const emptyConfig = {};
      configCache.set(bundleRoot, emptyConfig);
      return emptyConfig;
    }

    // Re-throw other errors (parsing errors, permission issues)
    throw new Error(
      `Failed to load bundle config at ${configPath}: ${error.message}`
    );
  }
}

/**
 * Validates that write operations are restricted to agent output directories only
 *
 * Story 5.0: Path validator blocks writes outside /data/agent-outputs
 *
 * @param resolvedPath - Absolute path after variable resolution
 * @param context - PathContext with projectRoot
 * @throws Error if write path is not within /data/agent-outputs
 */
export function validateWritePath(
  resolvedPath: string,
  context: PathContext
): void {
  const normalizedPath = resolve(normalize(resolvedPath));
  const agentOutputsPath = resolve(context.projectRoot, 'data/agent-outputs');

  // Check if path is within /data/agent-outputs/
  const isInAgentOutputs =
    normalizedPath.startsWith(agentOutputsPath + sep) ||
    normalizedPath === agentOutputsPath;

  if (!isInAgentOutputs) {
    console.error('[PathValidator Security] Write blocked - path outside agent outputs directory:', {
      requested: normalizedPath,
      allowed: agentOutputsPath,
    });
    throw new Error(
      'Security violation: Write operations are only allowed within /data/agent-outputs/ directory'
    );
  }

  // Additional check: Block writes to specific protected paths even if they're in project root
  const protectedPaths = [
    resolve(context.projectRoot, 'agents'),
    resolve(context.projectRoot, 'bmad'),
    resolve(context.projectRoot, 'lib'),
    resolve(context.projectRoot, 'app'),
    resolve(context.projectRoot, 'docs'),
  ];

  for (const protectedPath of protectedPaths) {
    if (normalizedPath.startsWith(protectedPath + sep) || normalizedPath === protectedPath) {
      console.error('[PathValidator Security] Write blocked - protected source directory:', protectedPath);
      throw new Error(
        'Security violation: Write operations to source code directories are not allowed'
      );
    }
  }
}

/**
 * Validates that resolved path is within allowed directories and doesn't contain
 * path traversal attempts. Also validates symbolic links don't escape allowed directories.
 *
 * @param resolvedPath - Absolute path after variable resolution
 * @param context - PathContext with allowed directories
 * @throws Error if path is outside allowed directories or contains security violations
 */
export function validatePathSecurity(
  resolvedPath: string,
  context: PathContext
): void {
  // Normalize and resolve to absolute path
  const normalizedPath = resolve(normalize(resolvedPath));

  // Check for null bytes
  if (normalizedPath.includes('\0')) {
    console.error('[PathResolver Security] Null byte detected in path');
    throw new Error('Security violation: Invalid path characters detected');
  }

  // Resolve symbolic links to their real paths (OWASP best practice)
  // This prevents symbolic links from escaping allowed directories
  let realPath: string;
  try {
    // realpathSync will resolve symlinks to their actual targets
    // If the file doesn't exist yet, this will throw - that's OK for new files
    realPath = realpathSync(normalizedPath);
  } catch (error: any) {
    // If file doesn't exist (ENOENT), use the normalized path
    // This allows validation of paths for files that will be created
    if (error.code === 'ENOENT') {
      realPath = normalizedPath;
    } else {
      // Other errors (permission issues, etc.) are security concerns
      console.error('[PathResolver Security] Error resolving path:', error.code);
      throw new Error('Security violation: Unable to validate path');
    }
  }

  // Validate real path is within bundleRoot OR coreRoot OR projectRoot
  const normalizedBundleRoot = resolve(context.bundleRoot);
  const normalizedCoreRoot = resolve(context.coreRoot);
  const normalizedProjectRoot = resolve(context.projectRoot);

  // Check if real path is within any allowed directory
  const isInBundle =
    realPath.startsWith(normalizedBundleRoot + sep) ||
    realPath === normalizedBundleRoot;
  const isInCore =
    realPath.startsWith(normalizedCoreRoot + sep) ||
    realPath === normalizedCoreRoot;
  const isInProject =
    realPath.startsWith(normalizedProjectRoot + sep) ||
    realPath === normalizedProjectRoot;

  // Allow if within any allowed directory
  if (!isInBundle && !isInCore && !isInProject) {
    // Log detailed information for security monitoring
    console.error('[PathResolver Security] Path outside allowed directories');
    // Throw sanitized error that doesn't expose internal paths
    throw new Error('Security violation: Access denied');
  }

  // Additional check: if realPath differs from normalizedPath, a symlink was followed
  // Log this for security monitoring (but don't block - it's already validated above)
  if (realPath !== normalizedPath) {
    console.warn('[PathResolver Security] Symbolic link resolved:', {
      requested: normalizedPath,
      resolved: realPath,
    });
  }
}

/**
 * Resolves config variable references ({config_source}:variable_name)
 *
 * @param pathTemplate - Path template with config variables
 * @param context - PathContext with bundleConfig
 * @returns Path with config variables resolved (leaves unresolved if variable not found)
 */
function resolveConfigVariables(
  pathTemplate: string,
  context: PathContext
): string {
  // Pattern: {config_source}:variable_name
  const configPattern = /\{config_source\}:(\w+)/g;

  return pathTemplate.replace(configPattern, (match, varName) => {
    // If config doesn't exist or variable not found, leave it as-is
    if (!context.bundleConfig || !(varName in context.bundleConfig)) {
      console.debug(
        `[resolveConfigVariables] Variable not found: ${varName}. ` +
        `Leaving unresolved. Available variables: ${context.bundleConfig ? Object.keys(context.bundleConfig).join(', ') : 'none'}`
      );
      return match; // Return original {config_source}:varName unchanged
    }

    const value = context.bundleConfig[varName];

    // Convert value to string
    const strValue = String(value);

    // Recursively resolve any path variables in the config value itself
    // This handles cases like agent_outputs_folder: '{project-root}/data/agent-outputs'
    if (strValue.includes('{')) {
      try {
        return resolvePathVariables(strValue, context);
      } catch (error) {
        // If recursive resolution fails, return the original value
        console.warn(`[resolveConfigVariables] Failed to recursively resolve ${varName}: ${error}`);
        return strValue;
      }
    }

    return strValue;
  });
}

/**
 * Resolves system variables ({date}, {user_name}, etc.)
 *
 * @param pathTemplate - Path template with system variables
 * @param context - PathContext (may contain bundleConfig with user_name)
 * @returns Path with system variables resolved
 */
function resolveSystemVariables(
  pathTemplate: string,
  context: PathContext
): string {
  let result = pathTemplate;

  // {date} - format: YYYY-MM-DD
  result = result.replace(/\{date\}/g, () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  // {user_name} - from bundleConfig if available
  result = result.replace(/\{user_name\}/g, () => {
    if (context.bundleConfig && 'user_name' in context.bundleConfig) {
      return String(context.bundleConfig.user_name);
    }
    // Default to environment user or 'user'
    return process.env.USER || process.env.USERNAME || 'user';
  });

  return result;
}

/**
 * Resolves path variables ({bundle-root}, {core-root}, {project-root})
 *
 * @param pathTemplate - Path template with path variables
 * @param context - PathContext with directory paths
 * @returns Path with path variables resolved
 */
function resolvePathVariables(
  pathTemplate: string,
  context: PathContext
): string {
  let result = pathTemplate;

  // Simple string replacement - no regex needed since we're matching literal strings
  result = result.replace(/\{bundle-root\}/g, context.bundleRoot);
  result = result.replace(/\{core-root\}/g, context.coreRoot);
  result = result.replace(/\{project-root\}/g, context.projectRoot);

  return result;
}

/**
 * Checks if a string contains any unresolved variables
 *
 * @param str - String to check
 * @returns true if unresolved variables exist
 */
function hasUnresolvedVariables(str: string): boolean {
  // Check for any {variable} pattern or {config_source}:variable pattern
  return /\{[^}]+\}/.test(str);
}

/**
 * Resolves BMAD path variables in file paths
 *
 * This is the main entry point for path resolution. It takes a path template with
 * variables (like "{bundle-root}/workflows/intake.yaml") and returns a fully resolved
 * absolute path by replacing all variables with their actual values.
 *
 * RESOLUTION ORDER (CRITICAL - order matters!):
 * 1. Config references ({config_source}:variable_name) - Must resolve first because
 *    config values may contain other variables (e.g., output_folder = "{project-root}/docs")
 * 2. System variables ({date}, {user_name}) - Runtime-generated values
 * 3. Path variables ({bundle-root}, {core-root}, {project-root}) - Actual directory paths
 * 4. Nested resolution - If any replaced value contains variables, repeat steps 1-3
 *    (max 10 iterations to prevent infinite loops)
 *
 * WHY THIS ORDER?
 * - Config vars first: They may reference system/path vars, so resolve them early
 * - System vars second: They're simple runtime values with no dependencies
 * - Path vars last: They're concrete paths, unlikely to need further resolution
 * - Nested resolution: Handles cases like config value = "{project-root}/docs/{date}"
 *
 * EXAMPLE NESTED RESOLUTION:
 * Input:  "{config_source}:output_folder/report-{date}.md"
 * Iteration 1:
 *   Step 1: "{project-root}/docs/report-{date}.md" (config: output_folder = "{project-root}/docs")
 *   Step 2: "{project-root}/docs/report-2025-10-05.md" (date = "2025-10-05")
 *   Step 3: "/path/to/project/docs/report-2025-10-05.md" (project-root = "/path/to/project")
 * Iteration 2: No variables remain → done
 *
 * @param pathTemplate - Path template with variables (e.g., "{bundle-root}/workflows/intake/workflow.yaml")
 * @param context - PathContext with directory paths and optional bundleConfig
 * @returns Resolved absolute path
 * @throws Error if variables cannot be resolved, circular references detected, or security validation fails
 */
export function resolvePath(pathTemplate: string, context: PathContext): string {
  let result = pathTemplate;
  let iterations = 0;
  const seenValues = new Set<string>();

  // NESTED RESOLUTION LOOP
  // Iterative resolution for nested variables (e.g., config value contains another variable)
  // We keep looping while unresolved variables exist AND we haven't hit max iterations
  while (hasUnresolvedVariables(result) && iterations < MAX_RESOLUTION_ITERATIONS) {
    // CIRCULAR REFERENCE DETECTION
    // If we've seen this exact value before, we're in a circular reference
    // Example: var1 = "{var2}", var2 = "{var1}" → infinite loop
    if (seenValues.has(result)) {
      throw new Error(
        `Circular variable reference detected in path resolution: ${result}`
      );
    }
    seenValues.add(result);

    // Track if anything changed during this iteration
    const beforeResolution = result;

    // RESOLUTION ORDER (CRITICAL - DO NOT CHANGE ORDER!)
    // 1. Config variables FIRST - may contain system/path variables
    result = resolveConfigVariables(result, context);

    // 2. System variables SECOND - runtime-generated values
    result = resolveSystemVariables(result, context);

    // 3. Path variables LAST - concrete directory paths
    result = resolvePathVariables(result, context);

    // If nothing changed, we have unresolvable variables
    if (result === beforeResolution) {
      throw new Error(
        `Unable to resolve variables in path: ${result}. ` +
        `Variables may be undefined or contain typos.`
      );
    }

    iterations++;
  }

  // Check if we exceeded max iterations
  if (iterations >= MAX_RESOLUTION_ITERATIONS && hasUnresolvedVariables(result)) {
    throw new Error(
      `Maximum resolution iterations (${MAX_RESOLUTION_ITERATIONS}) exceeded. ` +
      `Possible circular reference or too many nested variables: ${result}`
    );
  }

  // Check for path traversal BEFORE normalization (normalize removes .. segments)
  if (result.includes('..')) {
    throw new Error('Security violation: Path traversal attempt detected');
  }

  // Normalize the final path
  result = normalize(result);

  // Security validation
  validatePathSecurity(result, context);

  return result;
}
