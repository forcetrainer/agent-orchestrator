/**
 * Agent Validator Module
 *
 * Validates agent files for proper structure, required metadata, and security.
 * Used during agent discovery to filter out invalid or malicious files.
 *
 * Story 3.4: Agent Discovery and Selection Dropdown
 * AC-4.9: Agent discovery validates required XML metadata and filters invalid files
 */

import { resolve } from 'path';

/**
 * Validation result for an agent file.
 */
export interface AgentValidationResult {
  /** Whether the agent file is valid */
  valid: boolean;
  /** Array of validation error messages */
  errors: string[];
}

/**
 * Validates that an agent file meets all requirements.
 *
 * Validation checks:
 * 1. File path matches agents/{dir}/*.md pattern
 * 2. XML <agent> tag present with required attributes (id, name, title)
 * 3. ID is unique (checked by loader, not here)
 * 4. Metadata is sanitized for XSS prevention
 *
 * @param filePath - Absolute path to agent file
 * @param agentsBasePath - Base path for agents folder
 * @param fileContent - Content of the agent file
 * @returns Validation result with errors array
 */
export function validateAgentFile(
  filePath: string,
  agentsBasePath: string,
  fileContent: string
): AgentValidationResult {
  const errors: string[] = [];

  // Resolve to absolute paths for comparison
  const absoluteFilePath = resolve(filePath);
  const absoluteBasePath = resolve(agentsBasePath);

  // Check 1: File path must be within agents folder
  if (!absoluteFilePath.startsWith(absoluteBasePath)) {
    errors.push('File path is outside agents folder');
    return { valid: false, errors };
  }

  // Check 2: File path must match agents/{dir}/*.md pattern (depth 1)
  const relativePath = absoluteFilePath.substring(absoluteBasePath.length + 1);
  const pathParts = relativePath.split('/');

  if (pathParts.length !== 2) {
    errors.push(`File must be at depth 1 (agents/{dir}/*.md), found: ${relativePath}`);
  }

  if (!pathParts[1]?.endsWith('.md')) {
    errors.push('File must have .md extension');
  }

  // Check 3: File must not be in excluded subdirectories
  const excludedDirs = ['workflows', 'templates', 'files'];
  if (excludedDirs.includes(pathParts[0])) {
    errors.push(`File is in excluded directory: ${pathParts[0]}`);
  }

  // Check 4: XML <agent> tag must be present with required attributes
  const agentTagRegex = /<agent\s+id="([^"]+)"\s+name="([^"]+)"\s+title="([^"]+)"(?:\s+icon="([^"]+)")?/;
  const agentTagMatch = fileContent.match(agentTagRegex);

  if (!agentTagMatch) {
    errors.push('Missing <agent> tag with required attributes (id, name, title)');
    return { valid: false, errors };
  }

  const [, id, name, title, icon] = agentTagMatch;

  // Check 5: Required attributes must not be empty
  if (!id || id.trim() === '') {
    errors.push('Agent ID attribute is empty');
  }

  if (!name || name.trim() === '') {
    errors.push('Agent name attribute is empty');
  }

  if (!title || title.trim() === '') {
    errors.push('Agent title attribute is empty');
  }

  // Check 6: Sanitize for XSS prevention (detect dangerous patterns)
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /onerror=/i,
    /onclick=/i,
    /onload=/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(id) || pattern.test(name) || pattern.test(title)) {
      errors.push('Agent metadata contains potentially dangerous content (XSS risk)');
      break;
    }

    if (icon && pattern.test(icon)) {
      errors.push('Agent icon contains potentially dangerous content (XSS risk)');
      break;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitizes agent metadata by removing potentially dangerous characters.
 *
 * @param value - Raw metadata value from XML
 * @returns Sanitized string safe for display
 */
export function sanitizeAgentMetadata(value: string): string {
  return value
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}
