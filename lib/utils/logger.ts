/**
 * Structured logging utility with log levels.
 * Provides consistent logging interface across the application.
 */

type LogLevel = 'INFO' | 'ERROR' | 'DEBUG';

/**
 * Logs a message with structured format including timestamp and operation context.
 *
 * @param level - Log level (INFO, ERROR, DEBUG)
 * @param operation - Operation or context identifier
 * @param data - Data to log (object, string, error, etc.)
 */
export function log(level: LogLevel, operation: string, data: any): void {
  // DEBUG logs only in development
  if (level === 'DEBUG' && process.env.NODE_ENV !== 'development') {
    return;
  }

  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    operation,
    data,
  };

  switch (level) {
    case 'ERROR':
      // Log full error details server-side (including stack trace if available)
      console.error(`[${timestamp}] [${level}] ${operation}:`, data);
      break;

    case 'DEBUG':
      console.debug(`[${timestamp}] [${level}] ${operation}:`, data);
      break;

    case 'INFO':
    default:
      console.log(`[${timestamp}] [${level}] ${operation}:`, data);
      break;
  }
}
