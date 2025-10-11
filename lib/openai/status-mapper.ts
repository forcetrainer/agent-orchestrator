/**
 * Status Mapper Utility - Story 6.9
 *
 * Maps OpenAI tool calls to user-friendly status messages with context awareness.
 * Distinguishes between user-visible actions (user-attached files) and agent-internal
 * operations (workflows, instructions, templates, core files).
 *
 * UX Philosophy:
 * - User-attached files: Show specific filename ("Reading budget-report.csv...")
 * - Internal files: Generic message ("Loading resources...")
 * - Workflows: Generic action ("Executing workflow...")
 * - Outputs: Always show filename ("Writing procurement-request.md...")
 */

/**
 * Tool call structure from OpenAI API
 */
export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

/**
 * Maps tool calls to user-friendly status messages with context awareness.
 *
 * @param toolCall - The OpenAI tool call object
 * @param userAttachments - Array of file paths that user attached (optional)
 * @returns User-friendly status message
 *
 * @example
 * // User-attached file
 * mapToolCallToStatus(
 *   { function: { name: 'read_file', arguments: '{"file_path": "/output/budget.csv"}' } },
 *   ['/output/budget.csv']
 * )
 * // Returns: "Reading budget.csv..."
 *
 * @example
 * // Internal workflow file
 * mapToolCallToStatus(
 *   { function: { name: 'read_file', arguments: '{"file_path": "{bundle-root}/workflows/intake.yaml"}' } }
 * )
 * // Returns: "Loading resources..."
 *
 * @example
 * // Write operation (always show filename)
 * mapToolCallToStatus(
 *   { function: { name: 'save_output', arguments: '{"file_path": "/output/report.md"}' } }
 * )
 * // Returns: "Writing report.md..."
 */
export function mapToolCallToStatus(
  toolCall: ToolCall,
  userAttachments?: string[]
): string {
  const { name, arguments: args } = toolCall.function;

  // Parse arguments (handle JSON string or object)
  let parsedArgs: any;
  try {
    parsedArgs = typeof args === 'string' ? JSON.parse(args) : args;
  } catch (error) {
    // If parsing fails, return generic message
    return 'Processing...';
  }

  switch (name) {
    case 'read_file':
      const filepath = parsedArgs.file_path || parsedArgs.path;

      if (!filepath) {
        return 'Reading file...';
      }

      // User-attached files → show filename
      if (userAttachments?.includes(filepath)) {
        return `Reading ${extractFilename(filepath)}...`;
      }

      // Internal files (workflows, instructions, templates) → generic message
      if (isInternalFile(filepath)) {
        return 'Loading resources...';
      }

      // Other files (output folder) → show filename
      return `Reading ${extractFilename(filepath)}...`;

    case 'save_output':
    case 'write_file':
      // Always show filename for writes (all writes are user-facing outputs)
      const outputPath = parsedArgs.file_path || parsedArgs.path;
      return `Writing ${extractFilename(outputPath || 'file')}...`;

    case 'list_files':
      return 'Browsing files...';

    default:
      return 'Processing...';
  }
}

/**
 * Checks if file path is agent-internal (not user-visible).
 *
 * Internal files include: workflows, instructions, templates, core files, bundle files.
 *
 * @param path - File path to check
 * @returns True if file is internal, false otherwise
 *
 * @example
 * isInternalFile('{bundle-root}/workflows/intake.yaml') // true
 * isInternalFile('/templates/epic-template.md') // true
 * isInternalFile('/output/budget.csv') // false
 */
export function isInternalFile(path: string): boolean {
  return (
    path.includes('{bundle-root}') ||
    path.includes('{core-root}') ||
    path.includes('/workflows/') ||
    path.includes('/templates/') ||
    path.includes('/instructions/')
  );
}

/**
 * Extracts filename from file path (handles BMAD path variables).
 *
 * @param path - File path (may contain {bundle-root}, {core-root}, etc.)
 * @returns Filename component only
 *
 * @example
 * extractFilename('{bundle-root}/workflows/intake.yaml') // 'intake.yaml'
 * extractFilename('/output/procurement-request.md') // 'procurement-request.md'
 * extractFilename('') // 'file'
 * extractFilename('no-slash') // 'no-slash'
 */
export function extractFilename(path: string): string {
  if (!path) return 'file';

  const parts = path.split('/');
  const filename = parts[parts.length - 1];

  // Truncate long filenames (>50 chars) with "..." suffix
  if (filename.length > 50) {
    return filename.substring(0, 47) + '...';
  }

  return filename || 'file';
}
