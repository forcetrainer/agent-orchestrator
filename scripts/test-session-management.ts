/**
 * DEPRECATED: Story 9.1 - execute_workflow tool removed
 *
 * This test script is obsolete as it tests the executeWorkflow function
 * which was removed in Story 9.1: Remove execute_workflow Tool.
 *
 * Session management has been moved to conversation initialization
 * (app/api/chat/route.ts) as part of AC7.
 *
 * To test session management in the new architecture:
 * - Start a conversation via the chat API
 * - Session is created automatically on first message
 * - Check /data/agent-outputs/{uuid}/ for session folder and manifest.json
 *
 * This file is kept for reference but should not be executed.
 */

console.log('⚠️  DEPRECATED: This test script is obsolete after Story 9.1');
console.log('📝 Session management now happens at conversation initialization');
console.log('🔗 See app/api/chat/route.ts for session creation logic');
process.exit(0);
