/**
 * Integration Smoke Test for Story 5.0: Session-Based Output Management
 *
 * Tests:
 * - UUID generation
 * - Session folder creation
 * - Manifest creation
 * - Session discovery
 */

import { executeWorkflow } from '../lib/tools/fileOperations';
import { findSessions, registerOutput } from '../lib/agents/sessionDiscovery';
import { createPathContext } from '../lib/pathResolver';
import { readFile, rm } from 'fs/promises';
import { resolve } from 'path';

async function runSmokeTests() {
  console.log('🧪 Story 5.0 Session Management Smoke Tests\n');

  try {
    // Test 1: Execute workflow and verify session creation
    console.log('Test 1: Workflow execution creates session...');
    // Load the actual bundle config to ensure all variables are available
    const bundleConfigPath = resolve(
      process.cwd(),
      'bmad/custom/bundles/requirements-workflow/config.yaml'
    );
    const { load: parseYaml } = await import('js-yaml');
    const bundleConfigContent = await readFile(bundleConfigPath, 'utf-8');
    const bundleConfig = parseYaml(bundleConfigContent) as Record<string, any>;

    const context = createPathContext('requirements-workflow', bundleConfig);

    const result = await executeWorkflow(
      {
        workflow_path: '{bundle-root}/workflows/intake-app/workflow.yaml',
      },
      context
    );

    if (!result.success) {
      throw new Error(`Workflow execution failed: ${result.error}`);
    }

    console.log(`  ✅ Session ID generated: ${result.session_id}`);
    console.log(`  ✅ Session folder created: ${result.session_folder}`);

    // Test 2: Verify manifest exists and is valid
    console.log('\nTest 2: Manifest file exists and is valid...');
    const manifestPath = resolve(result.session_folder!, 'manifest.json');
    const manifestContent = await readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);

    if (manifest.version !== '1.0.0') {
      throw new Error('Manifest version mismatch');
    }
    if (manifest.session_id !== result.session_id) {
      throw new Error('Session ID mismatch in manifest');
    }
    if (manifest.execution.status !== 'running') {
      throw new Error('Initial status should be "running"');
    }

    console.log('  ✅ Manifest exists and is valid');
    console.log(`  ✅ Status: ${manifest.execution.status}`);
    console.log(`  ✅ Workflow: ${manifest.workflow.name}`);

    // Test 3: Session discovery
    console.log('\nTest 3: Session discovery...');
    const sessions = await findSessions({ limit: 5 });
    console.log(`  ✅ Found ${sessions.length} session(s)`);

    if (sessions.length > 0) {
      console.log(`  ✅ Latest session: ${sessions[0].session_id}`);
      console.log(`  ✅ Workflow: ${sessions[0].workflow.name}`);
    }

    // Test 4: Output registration
    console.log('\nTest 4: Output registration...');
    const registered = await registerOutput(result.session_id!, {
      file: 'test-output.md',
      type: 'document',
      description: 'Test output file',
    });

    if (!registered) {
      throw new Error('Output registration failed');
    }

    // Verify output was added
    const updatedManifestContent = await readFile(manifestPath, 'utf-8');
    const updatedManifest = JSON.parse(updatedManifestContent);

    if (updatedManifest.outputs.length !== 1) {
      throw new Error('Output not added to manifest');
    }

    console.log('  ✅ Output registered successfully');
    console.log(`  ✅ Output count: ${updatedManifest.outputs.length}`);

    // Cleanup: Remove test session
    console.log('\nCleaning up test session...');
    await rm(result.session_folder!, { recursive: true, force: true });
    console.log('  ✅ Test session cleaned up');

    console.log('\n✅ All tests passed!');
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

runSmokeTests();
