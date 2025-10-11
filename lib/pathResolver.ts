/**
 * Path Variable Resolution System (Simplified)
 *
 * Resolves BMAD path variables in file paths to enable portable agent workflows.
 * This system allows agents and workflows to reference files using variables instead
 * of hardcoded paths, making bundles portable across different installations.
 *
 * ARCHITECTURE:
 * Generic variable resolution using a data-driven PathContext interface.
 * Variables in format {variable-name} are replaced with values from PathContext.
 * Simple single-pass string replacement - no nested resolution, no config loading.
 *
 * SUPPORTED VARIABLES (extensible):
 * Currently standardized: {bundle-root}, {core-root}, {project-root}
 * Architecture is generic: any {variable-name} can be added to PathContext
 *
 * EXAMPLE:
 * context = { 'bundle-root': '/app/bmad/bundles/my-bundle', ... }
 * Input:  "{bundle-root}/workflows/intake.yaml"
 * Output: "/app/bmad/bundles/my-bundle/workflows/intake.yaml"
 *
 * WHAT WAS REMOVED (Epic 9, Story 9.2):
 * - {config_source}:variable_name resolution (LLM now reads config.yaml directly)
 * - {date} and {user_name} resolution (LLM generates these values)
 * - Multi-pass nested variable resolution
 * - Config file auto-loading and YAML parsing
 * - Circular reference detection
 *
 * WHY THIS IS SAFE:
 * Story 9.1 removed execute_workflow tool and moved session management to conversation
 * initialization. LLM now explicitly handles variable substitution through read_file calls.
 * This simplification makes variable resolution transparent and maintainable.
 *
 * SECURITY:
 * - All resolved paths validated to be within bundleRoot, coreRoot, or projectRoot
 * - Path traversal attempts (..) are blocked
 * - Symbolic links resolved to real paths and validated
 * - Write operations restricted to /data/agent-outputs
 * - Null bytes and invalid characters rejected
 *
 * For complete specification, see: docs/tech-spec-epic-9.md Section "Story 9.2"
 */

import { resolve, normalize, isAbsolute, sep } from 'path';
import { realpathSync } from 'fs';
import { env } from '@/lib/utils/env';

/**
 * Context for path variable resolution
 *
 * ARCHITECTURE: Generic key-value interface for extensible variable resolution.
 * Any {variable-name} in a path template is replaced with context[variable-name].
 *
 * STANDARD VARIABLES (currently used):
 * - 'bundle-root': Path to bundle directory (bmad/custom/bundles/{bundle-name})
 * - 'core-root': Path to core directory (bmad/core)
 * - 'project-root': Project root directory (absolute path)
 *
 * EXTENSIBILITY:
 * New variables can be added without code changes, just update the PathContext object:
 * Example: context['workflow-root'] = '{bundle-root}/workflows'
 * Then use: "{workflow-root}/intake.yaml"
 */
export interface PathContext {
  [key: string]: string;

  // Standard variables (documented but not enforced at compile time)
  'bundle-root': string;
  'core-root': string;
  'project-root': string;
}

/**
 * Creates a PathContext from bundle name
 *
 * @param bundleName - Name of the bundle (e.g., "requirements-workflow")
 * @returns PathContext for use with resolvePath
 */
export function createPathContext(bundleName: string): PathContext {
  const projectRoot = env.PROJECT_ROOT;
  const bundleRoot = resolve(projectRoot, 'bmad/custom/bundles', bundleName);
  const coreRoot = resolve(projectRoot, 'bmad/core');

  return {
    'bundle-root': bundleRoot,
    'core-root': coreRoot,
    'project-root': projectRoot,
  };
}

/**
 * Validates that write operations are restricted to agent output directories only
 *
 * Story 5.0: Path validator blocks writes outside /data/agent-outputs
 *
 * @param resolvedPath - Absolute path after variable resolution
 * @param context - PathContext with project-root
 * @throws Error if write path is not within /data/agent-outputs
 */
export function validateWritePath(
  resolvedPath: string,
  context: PathContext
): void {
  const normalizedPath = resolve(normalize(resolvedPath));
  const projectRoot = context['project-root'];
  const agentOutputsPath = resolve(projectRoot, 'data/agent-outputs');

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
    resolve(projectRoot, 'agents'),
    resolve(projectRoot, 'bmad'),
    resolve(projectRoot, 'lib'),
    resolve(projectRoot, 'app'),
    resolve(projectRoot, 'docs'),
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
  const bundleRoot = context['bundle-root'];
  const coreRoot = context['core-root'];
  const projectRoot = context['project-root'];

  const normalizedBundleRoot = resolve(bundleRoot);
  const normalizedCoreRoot = resolve(coreRoot);
  const normalizedProjectRoot = resolve(projectRoot);

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
 * Resolves BMAD path variables in file paths using generic pattern matching
 *
 * ARCHITECTURE:
 * Generic single-pass variable resolution. Any {variable-name} in the path template
 * is replaced with the corresponding value from the PathContext.
 *
 * WHY THIS IS SIMPLE:
 * - No nested variables: Variables don't contain other variables
 * - No multi-pass: Single regex replacement is sufficient
 * - No config loading: LLM reads config.yaml and extracts values
 * - No system variables: LLM generates dates and usernames
 *
 * EXAMPLE:
 * context = { 'bundle-root': '/app/bundles/my-bundle', 'core-root': '/app/core' }
 * Input:  "{bundle-root}/workflows/{core-root}/tasks.yaml"
 * Output: "/app/bundles/my-bundle/workflows//app/core/tasks.yaml"
 *
 * @param pathTemplate - Path template with variables (e.g., "{bundle-root}/workflows/intake.yaml")
 * @param context - PathContext with variable values
 * @returns Resolved absolute path
 * @throws Error if variables cannot be resolved or security validation fails
 */
export function resolvePath(pathTemplate: string, context: PathContext): string {
  // Generic single-pass variable resolution
  // Regex: \{([a-z-]+)\} matches {variable-name} format (lowercase and hyphens only)
  const result = pathTemplate.replace(/\{([a-z-]+)\}/g, (match, varName) => {
    if (varName in context) {
      return context[varName];
    }
    // Variable not found in context
    throw new Error(
      `Unknown variable: {${varName}}. ` +
      `Available variables: ${Object.keys(context).join(', ')}`
    );
  });

  // Check for path traversal BEFORE normalization (normalize removes .. segments)
  if (result.includes('..')) {
    throw new Error('Security violation: Path traversal attempt detected');
  }

  // Normalize the final path
  const normalizedPath = normalize(result);

  // Security validation
  validatePathSecurity(normalizedPath, context);

  return normalizedPath;
}
