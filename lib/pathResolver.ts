/**
 * Path Variable Resolution System
 *
 * Resolves BMAD path variables in file paths to enable portable agent workflows.
 * Supports:
 * - Path variables: {bundle-root}, {core-root}, {project-root}
 * - Config references: {config_source}:variable_name
 * - System variables: {date}, {user_name}
 * - Nested variable resolution
 *
 * Resolution order (critical):
 * 1. Config references ({config_source}:variable_name)
 * 2. System variables ({date}, {user_name})
 * 3. Path variables ({bundle-root}, {core-root}, {project-root})
 * 4. Nested resolution (if replaced values contain variables, re-run)
 *
 * Security:
 * All resolved paths are validated to be within bundleRoot or coreRoot.
 * Path traversal attempts are blocked.
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
 * @returns Path with config variables resolved
 * @throws Error if config variable not found
 */
function resolveConfigVariables(
  pathTemplate: string,
  context: PathContext
): string {
  // Pattern: {config_source}:variable_name
  const configPattern = /\{config_source\}:(\w+)/g;

  return pathTemplate.replace(configPattern, (match, varName) => {
    if (!context.bundleConfig || !(varName in context.bundleConfig)) {
      throw new Error(
        `Config variable not found: ${varName}. ` +
        `Available variables: ${context.bundleConfig ? Object.keys(context.bundleConfig).join(', ') : 'none'}`
      );
    }

    const value = context.bundleConfig[varName];

    // Convert value to string if it's not already
    return String(value);
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
 * Resolution order:
 * 1. Config references ({config_source}:variable_name)
 * 2. System variables ({date}, {user_name})
 * 3. Path variables ({bundle-root}, {core-root}, {project-root})
 * 4. Nested resolution (repeat if variables remain, max 10 iterations)
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

  // Iterative resolution for nested variables
  while (hasUnresolvedVariables(result) && iterations < MAX_RESOLUTION_ITERATIONS) {
    // Detect circular references
    if (seenValues.has(result)) {
      throw new Error(
        `Circular variable reference detected in path resolution: ${result}`
      );
    }
    seenValues.add(result);

    // Resolution order (critical)
    const beforeResolution = result;

    // 1. Config variables
    result = resolveConfigVariables(result, context);

    // 2. System variables
    result = resolveSystemVariables(result, context);

    // 3. Path variables
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
