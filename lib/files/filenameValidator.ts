/**
 * Filename Validation Utility
 *
 * Story 6.5: Context-Aware File Naming Validation
 *
 * Validates filenames to prevent generic names and security issues.
 * Encourages descriptive, content-based naming through educational error messages.
 *
 * Validation Rules:
 * 1. Security: Block path traversal (../, /, \) and special characters (<>:"|?*)
 * 2. Generic patterns: Block obviously meaningless names (output.md, result.txt, file.txt)
 * 3. Descriptive names: Allow everything else (permissive approach)
 */

/**
 * Generic filename patterns to reject
 * These patterns match filenames that provide no context about content
 */
const GENERIC_PATTERNS = [
  /^output(-\d+)?\.md$/i,      // output.md, output-1.md, output-2.md
  /^result(-\d+)?\.txt$/i,     // result.txt, result-1.txt
  /^file\d*\./i,               // file.txt, file1.md, file2.csv
  /^untitled/i,                // untitled.md, untitled-document.txt
  /^document\d*\./i,           // document.md, document1.txt
];

/**
 * Special characters not allowed in filenames
 * These cause issues on various operating systems
 */
const INVALID_CHARS_PATTERN = /[<>:"|?*]/;

/**
 * Validates a filename according to Story 6.5 acceptance criteria
 *
 * @param filename - The filename to validate (without path)
 * @throws Error with educational message if validation fails
 */
export function validateFilename(filename: string): void {
  // Trim whitespace
  const trimmed = filename.trim();

  // Check for empty filename
  if (!trimmed) {
    throw new Error('Filename cannot be empty');
  }

  // Security: Path traversal prevention
  // Block ../, /, \ characters that could enable path traversal
  if (trimmed.includes('..') || trimmed.includes('/') || trimmed.includes('\\')) {
    throw new Error(
      'Filename cannot contain path separators or "..".\n' +
      'Path traversal is not allowed for security reasons.'
    );
  }

  // Security: Special character blocking
  // These characters cause issues on Windows, macOS, or Linux
  const invalidChars = trimmed.match(INVALID_CHARS_PATTERN);
  if (invalidChars) {
    throw new Error(
      'Filename contains invalid characters: < > : " | ? *\n' +
      'These characters are not allowed on most operating systems.'
    );
  }

  // Generic pattern blocking with educational error message
  // Show examples to guide agent toward better naming
  for (const pattern of GENERIC_PATTERNS) {
    if (pattern.test(trimmed)) {
      throw new Error(
        `Generic filename "${trimmed}" not allowed. ` +
        `Use descriptive names based on content or purpose.\n\n` +
        `Examples:\n` +
        `  ✅ procurement-request.md\n` +
        `  ✅ budget-analysis-q3.csv\n` +
        `  ✅ approval-checklist.md\n` +
        `  ✅ software-license-quote.md\n\n` +
        `  ❌ output.md\n` +
        `  ❌ result.txt\n` +
        `  ❌ file-1.md`
      );
    }
  }

  // All validation passed - filename is acceptable
}

/**
 * Checks if a filename is valid without throwing
 *
 * @param filename - The filename to check
 * @returns true if valid, false if invalid
 */
export function isValidFilename(filename: string): boolean {
  try {
    validateFilename(filename);
    return true;
  } catch {
    return false;
  }
}

/**
 * Gets validation error message for a filename
 *
 * @param filename - The filename to validate
 * @returns Error message if invalid, null if valid
 */
export function getValidationError(filename: string): string | null {
  try {
    validateFilename(filename);
    return null;
  } catch (error: any) {
    return error.message;
  }
}
