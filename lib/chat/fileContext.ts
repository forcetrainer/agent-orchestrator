/**
 * File Context Message Builder
 * Story 6.7: File Attachment Backend Processing
 *
 * Builds system messages containing file contents from attachments.
 * Formats multiple files with proper separators for agent context.
 */

import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

/**
 * Builds a system message containing file contents from attachments.
 *
 * Format for each file:
 * ```
 * File: {filename}
 * ---
 * {content}
 * ---
 * ```
 *
 * Multiple files are concatenated with double newlines between them.
 *
 * @param attachments - Array of attachments with filepath, filename, and content
 * @returns System message with formatted file contents, or null if no attachments
 */
export function buildFileContextMessage(
  attachments: Array<{ filepath: string; filename: string; content: string }>
): ChatCompletionMessageParam | null {
  if (attachments.length === 0) {
    return null;
  }

  const fileBlocks = attachments.map(({ filename, content }) => {
    return `File: ${filename}\n---\n${content}\n---`;
  }).join('\n\n');

  return {
    role: 'system',
    content: `Files attached by user:\n${fileBlocks}`
  };
}
