import { ValidationError } from './errors';
import { log } from './logger';

// Validation patterns
const AGENT_ID_PATTERN = /^[a-z0-9-]+$/;
const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_MESSAGE_LENGTH = 10000;

/**
 * Validates agent ID format.
 * Agent IDs must be lowercase alphanumeric with hyphens only.
 *
 * @param agentId - Agent ID to validate
 * @throws ValidationError if invalid
 */
export function validateAgentId(agentId: string): void {
  if (!agentId || typeof agentId !== 'string') {
    log('ERROR', 'validation:agentId', { error: 'Agent ID is required' });
    throw new ValidationError('Agent ID is required', 'agentId');
  }

  if (!AGENT_ID_PATTERN.test(agentId)) {
    log('ERROR', 'validation:agentId', {
      agentId,
      error: 'Invalid format - must be lowercase alphanumeric with hyphens',
    });
    throw new ValidationError(
      'Agent ID must be lowercase alphanumeric with hyphens only',
      'agentId'
    );
  }

  log('DEBUG', 'validation:agentId', { agentId, valid: true });
}

/**
 * Validates message content.
 * Message must be non-empty and under 10,000 characters.
 *
 * @param message - Message to validate
 * @throws ValidationError if invalid
 */
export function validateMessage(message: string): void {
  if (!message || typeof message !== 'string') {
    log('ERROR', 'validation:message', { error: 'Message is required' });
    throw new ValidationError('Message is required', 'message');
  }

  if (message.trim().length === 0) {
    log('ERROR', 'validation:message', { error: 'Message cannot be empty' });
    throw new ValidationError('Message cannot be empty', 'message');
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    log('ERROR', 'validation:message', {
      messageLength: message.length,
      maxLength: MAX_MESSAGE_LENGTH,
      error: 'Message exceeds maximum length',
    });
    throw new ValidationError(
      `Message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters`,
      'message'
    );
  }

  log('DEBUG', 'validation:message', {
    messageLength: message.length,
    valid: true,
  });
}

/**
 * Validates conversation ID format.
 * Conversation ID must be a valid UUID v4 format if provided.
 *
 * @param conversationId - Optional conversation ID to validate
 * @throws ValidationError if provided and invalid
 */
export function validateConversationId(
  conversationId: string | undefined
): void {
  // Conversation ID is optional
  if (!conversationId) {
    log('DEBUG', 'validation:conversationId', {
      conversationId: undefined,
      valid: true,
    });
    return;
  }

  if (typeof conversationId !== 'string') {
    log('ERROR', 'validation:conversationId', {
      error: 'Conversation ID must be a string',
    });
    throw new ValidationError(
      'Conversation ID must be a string',
      'conversationId'
    );
  }

  if (!UUID_V4_PATTERN.test(conversationId)) {
    log('ERROR', 'validation:conversationId', {
      conversationId,
      error: 'Invalid UUID v4 format',
    });
    throw new ValidationError(
      'Conversation ID must be a valid UUID v4',
      'conversationId'
    );
  }

  log('DEBUG', 'validation:conversationId', {
    conversationId,
    valid: true,
  });
}
