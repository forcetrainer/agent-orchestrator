/**
 * Next.js 14 Instrumentation Hook
 *
 * This file is automatically loaded by Next.js on server startup.
 * It provides a hook to run initialization code before the server starts handling requests.
 *
 * Story 10.1 AI-1: Server initialization for conversation persistence
 * Story 10.2 Task 4: Added instrumentation hook for initializeConversationPersistence()
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run in Node.js runtime (not Edge runtime)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initializeConversationPersistence } = await import('./lib/utils/conversations');

    console.log('[Server] Initializing conversation persistence...');
    await initializeConversationPersistence();
    console.log('[Server] Conversation persistence initialized');
  }
}
