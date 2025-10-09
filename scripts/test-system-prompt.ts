#!/usr/bin/env tsx
/**
 * System Prompt Testing Script
 *
 * Tests that the system prompt template loads correctly and interpolates variables.
 * Run with: npx tsx scripts/test-system-prompt.ts
 */

import { buildSystemPrompt } from '../lib/agents/systemPromptBuilder';
import { Agent } from '../types';

// Mock agent for testing
const mockAgent: Agent = {
  id: 'test-agent',
  name: 'TestBot',
  title: 'Test Agent',
  path: '/test/path',
  bundlePath: '/test/bundle',
  bundleName: 'test-bundle',
  fullContent: `
<agent>
  <persona>
    <role>Test Role</role>
    <identity>Test Identity</identity>
    <communication_style>Test Style</communication_style>
    <principles>Test Principles</principles>
  </persona>
  <cmds>
    <c cmd="*test" run-workflow="/path/to/workflow.yaml">Test command</c>
  </cmds>
</agent>
  `,
};

console.log('Testing System Prompt Builder...\n');

try {
  const prompt = buildSystemPrompt(mockAgent);

  console.log('✅ System prompt generated successfully!\n');
  console.log('=== Prompt Preview (first 500 chars) ===');
  console.log(prompt.substring(0, 500));
  console.log('...\n');

  // Check for key interpolations
  const checks = [
    { name: 'Agent Name', value: 'TestBot', found: prompt.includes('TestBot') },
    { name: 'Agent Title', value: 'Test Agent', found: prompt.includes('Test Agent') },
    { name: 'Persona Role', value: 'Test Role', found: prompt.includes('Test Role') },
    { name: 'Context-Aware Section', value: 'loaded context', found: prompt.includes('loaded context') },
    { name: 'Commands Section', value: '*test', found: prompt.includes('*test') },
  ];

  console.log('=== Interpolation Checks ===');
  checks.forEach(check => {
    const status = check.found ? '✅' : '❌';
    console.log(`${status} ${check.name}: ${check.found ? 'Found' : 'MISSING'}`);
  });

  console.log('\n=== Version Check ===');
  if (prompt.includes('Review any attached or loaded context')) {
    console.log('✅ v3.0 Context-Aware features detected');
  } else {
    console.log('⚠️  Warning: v3.0 features not detected');
  }

  const allPassed = checks.every(c => c.found);
  if (allPassed) {
    console.log('\n✅ All checks passed!');
    process.exit(0);
  } else {
    console.log('\n❌ Some checks failed!');
    process.exit(1);
  }

} catch (error) {
  console.error('❌ Error generating system prompt:', error);
  process.exit(1);
}
