/**
 * Integration Tests for preload_workflow Tool
 * Story 9.4: Implement Smart Workflow Pre-loading
 *
 * Tests the end-to-end integration of preload_workflow tool with the tool executor.
 * Validates that the tool properly:
 * - Loads all workflow files in a single call
 * - Returns structured result for LLM consumption
 * - Handles errors gracefully
 * - Works with real workflow files
 */

import { mkdir, rm, writeFile } from 'fs/promises';
import { resolve } from 'path';
import { executeToolCall } from '../toolExecutor';
import { PathContext } from '@/lib/pathResolver';

describe('preload_workflow Tool Integration (Story 9.4)', () => {
  let testDir: string;
  let bundleRoot: string;
  let workflowDir: string;
  let context: PathContext;

  beforeEach(async () => {
    // Create temporary test directory structure
    testDir = resolve(
      process.cwd(),
      '__test_temp__',
      `preload-integration-${Date.now()}`
    );
    bundleRoot = resolve(testDir, 'bmad/bmm');
    workflowDir = resolve(bundleRoot, 'workflows/test-workflow');
    const coreRoot = resolve(testDir, 'bmad/core');

    await mkdir(workflowDir, { recursive: true });
    await mkdir(resolve(coreRoot, 'tasks'), { recursive: true });

    // Create test context
    context = {
      'bundle-root': bundleRoot,
      'core-root': coreRoot,
      'project-root': testDir,
    };

    // Create core workflow.md file
    await writeFile(
      resolve(coreRoot, 'tasks/workflow.md'),
      '# Workflow Engine\n\nCore execution rules for workflows.'
    );
  });

  afterEach(async () => {
    // Clean up test directory
    if (testDir && testDir.includes('__test_temp__')) {
      await rm(testDir, { recursive: true, force: true });
    }
  });

  describe('AC5: Tool Executor Integration', () => {
    it('should execute preload_workflow tool and return structured result', async () => {
      // Create test workflow files
      const workflowYaml = `
name: integration-test-workflow
description: Test workflow for integration testing
config_source: "{bundle-root}/config.yaml"
instructions: "{bundle-root}/workflows/test-workflow/instructions.md"
template: false
      `.trim();

      const configYaml = `
user_name: IntegrationTest
output_folder: "{project-root}/data"
communication_language: English
      `.trim();

      const instructions = `
# Integration Test Workflow Instructions

<step n="1" goal="Test step">
  <action>Execute test action</action>
</step>
      `.trim();

      await writeFile(resolve(workflowDir, 'workflow.yaml'), workflowYaml);
      await writeFile(resolve(bundleRoot, 'config.yaml'), configYaml);
      await writeFile(resolve(workflowDir, 'instructions.md'), instructions);

      // Execute tool through tool executor
      const toolCall = {
        id: 'test-call-1',
        type: 'function' as const,
        function: {
          name: 'preload_workflow',
          arguments: JSON.stringify({
            workflow_path: '{bundle-root}/workflows/test-workflow/workflow.yaml',
          }),
        },
      };

      const result = await executeToolCall(toolCall, context);

      // Verify structured result (tool executor wraps PreloadResult with `files` object)
      expect(result.success).toBe(true);
      expect(result.files).toBeDefined();
      expect(result.files.workflow_config).toBeDefined();
      expect(result.files.workflow_config.content.name).toBe('integration-test-workflow');
      expect(result.files.config).toBeDefined();
      expect(result.files.config.content.user_name).toBe('IntegrationTest');
      expect(result.files.instructions.content).toContain('Integration Test Workflow Instructions');
      expect(result.files.workflow_engine.content).toContain('Workflow Engine');
      expect(result.filesLoaded).toHaveLength(4);
      expect(result.message).toContain('All workflow files have been pre-loaded');
    });

    it('should return error result when workflow file not found', async () => {
      const toolCall = {
        id: 'test-call-2',
        type: 'function' as const,
        function: {
          name: 'preload_workflow',
          arguments: JSON.stringify({
            workflow_path: '{bundle-root}/workflows/nonexistent/workflow.yaml',
          }),
        },
      };

      const result = await executeToolCall(toolCall, context);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      // Error will contain the actual file system error
    });

    it('should handle missing workflow_path parameter', async () => {
      const toolCall = {
        id: 'test-call-3',
        type: 'function' as const,
        function: {
          name: 'preload_workflow',
          arguments: JSON.stringify({}),
        },
      };

      const result = await executeToolCall(toolCall, context);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('AC8: Performance Validation', () => {
    it('should complete preload in <1 second for simple workflow', async () => {
      // Create test workflow files
      const workflowYaml = `
name: performance-test
config_source: "{bundle-root}/config.yaml"
instructions: "{bundle-root}/workflows/test-workflow/instructions.md"
template: false
      `.trim();

      await writeFile(resolve(workflowDir, 'workflow.yaml'), workflowYaml);
      await writeFile(resolve(bundleRoot, 'config.yaml'), 'user_name: Test');
      await writeFile(resolve(workflowDir, 'instructions.md'), '# Instructions');

      const toolCall = {
        id: 'perf-test-1',
        type: 'function' as const,
        function: {
          name: 'preload_workflow',
          arguments: JSON.stringify({
            workflow_path: '{bundle-root}/workflows/test-workflow/workflow.yaml',
          }),
        },
      };

      const startTime = Date.now();
      const result = await executeToolCall(toolCall, context);
      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(1000); // Should be very fast for local files
    });

    it('should use single tool call (not multiple sequential calls)', async () => {
      // This test validates that preload_workflow loads all files in one call
      // vs the old pattern of 4-6 sequential read_file calls

      const workflowYaml = `
name: single-call-test
config_source: "{bundle-root}/config.yaml"
instructions: "{bundle-root}/workflows/test-workflow/instructions.md"
template: "{bundle-root}/workflows/test-workflow/template.md"
      `.trim();

      await writeFile(resolve(workflowDir, 'workflow.yaml'), workflowYaml);
      await writeFile(resolve(bundleRoot, 'config.yaml'), 'user_name: Test');
      await writeFile(resolve(workflowDir, 'instructions.md'), '# Instructions');
      await writeFile(resolve(workflowDir, 'template.md'), '# Template');

      const toolCall = {
        id: 'single-call-test',
        type: 'function' as const,
        function: {
          name: 'preload_workflow',
          arguments: JSON.stringify({
            workflow_path: '{bundle-root}/workflows/test-workflow/workflow.yaml',
          }),
        },
      };

      // Single call to executeToolCall
      const result = await executeToolCall(toolCall, context);

      // Verify all files loaded in this single call
      expect(result.success).toBe(true);
      expect(result.filesLoaded).toContain(
        '{bundle-root}/workflows/test-workflow/workflow.yaml'
      );
      expect(result.filesLoaded).toContain('{bundle-root}/config.yaml');
      expect(result.filesLoaded).toContain(
        '{bundle-root}/workflows/test-workflow/instructions.md'
      );
      expect(result.filesLoaded).toContain(
        '{bundle-root}/workflows/test-workflow/template.md'
      );
      expect(result.filesLoaded).toContain(
        '{project-root}/bmad/core/tasks/workflow.md'
      );
      expect(result.filesLoaded.length).toBe(5);
    });
  });

  describe('Real-world Workflow Scenarios', () => {
    it('should handle workflow with elicit task', async () => {
      const workflowYaml = `
name: elicit-workflow
config_source: "{bundle-root}/config.yaml"
instructions: "{bundle-root}/workflows/test-workflow/instructions.md"
template: false
      `.trim();

      const instructions = `
# Workflow with Elicitation

<step n="1" goal="Elicited step">
  <action>Perform action</action>
  <elicit-required>Enhance this step</elicit-required>
</step>
      `.trim();

      await writeFile(resolve(workflowDir, 'workflow.yaml'), workflowYaml);
      await writeFile(resolve(bundleRoot, 'config.yaml'), 'user_name: Test');
      await writeFile(resolve(workflowDir, 'instructions.md'), instructions);
      await writeFile(
        resolve(context['core-root'] as string, 'tasks/adv-elicit.md'),
        '# Elicitation Task\n\nEnhance workflow steps.'
      );

      const toolCall = {
        id: 'elicit-test',
        type: 'function' as const,
        function: {
          name: 'preload_workflow',
          arguments: JSON.stringify({
            workflow_path: '{bundle-root}/workflows/test-workflow/workflow.yaml',
          }),
        },
      };

      const result = await executeToolCall(toolCall, context);

      expect(result.success).toBe(true);
      expect(result.files.elicit_task).toBeDefined();
      expect(result.files.elicit_task.content).toContain('Elicitation Task');
      expect(result.filesLoaded).toContain(
        '{project-root}/bmad/core/tasks/adv-elicit.md'
      );
    });

    it('should handle workflow with YAML-internal variables', async () => {
      const workflowYaml = `
name: internal-vars-workflow
installed_path: "{bundle-root}/workflows/test-workflow"
config_source: "{installed_path}/config.yaml"
instructions: "{installed_path}/instructions.md"
template: false
      `.trim();

      await writeFile(resolve(workflowDir, 'workflow.yaml'), workflowYaml);
      await writeFile(resolve(workflowDir, 'config.yaml'), 'test: value');
      await writeFile(resolve(workflowDir, 'instructions.md'), '# Workflow');

      const toolCall = {
        id: 'internal-vars-test',
        type: 'function' as const,
        function: {
          name: 'preload_workflow',
          arguments: JSON.stringify({
            workflow_path: '{bundle-root}/workflows/test-workflow/workflow.yaml',
          }),
        },
      };

      const result = await executeToolCall(toolCall, context);

      expect(result.success).toBe(true);
      expect(result.files.config.content.test).toBe('value');
      expect(result.files.instructions.content).toContain('Workflow');
    });

    it('should handle action-only workflow (template: false)', async () => {
      const workflowYaml = `
name: action-workflow
config_source: "{bundle-root}/config.yaml"
instructions: "{bundle-root}/workflows/test-workflow/instructions.md"
template: false
      `.trim();

      await writeFile(resolve(workflowDir, 'workflow.yaml'), workflowYaml);
      await writeFile(resolve(bundleRoot, 'config.yaml'), 'user_name: Test');
      await writeFile(resolve(workflowDir, 'instructions.md'), '# Action workflow');

      const toolCall = {
        id: 'action-workflow-test',
        type: 'function' as const,
        function: {
          name: 'preload_workflow',
          arguments: JSON.stringify({
            workflow_path: '{bundle-root}/workflows/test-workflow/workflow.yaml',
          }),
        },
      };

      const result = await executeToolCall(toolCall, context);

      expect(result.success).toBe(true);
      expect(result.files.template).toBeNull();
      expect(result.files.workflow_config.content.template).toBe(false);
      expect(result.filesLoaded).not.toContain(
        expect.stringContaining('template.md')
      );
    });
  });

  describe('LLM Contract Validation', () => {
    it('should include clear instructions for LLM not to reload files', async () => {
      const workflowYaml = `
name: llm-contract-test
config_source: "{bundle-root}/config.yaml"
instructions: "{bundle-root}/workflows/test-workflow/instructions.md"
template: false
      `.trim();

      await writeFile(resolve(workflowDir, 'workflow.yaml'), workflowYaml);
      await writeFile(resolve(bundleRoot, 'config.yaml'), 'user_name: Test');
      await writeFile(resolve(workflowDir, 'instructions.md'), '# Instructions');

      const toolCall = {
        id: 'llm-contract-test',
        type: 'function' as const,
        function: {
          name: 'preload_workflow',
          arguments: JSON.stringify({
            workflow_path: '{bundle-root}/workflows/test-workflow/workflow.yaml',
          }),
        },
      };

      const result = await executeToolCall(toolCall, context);

      expect(result.success).toBe(true);
      expect(result.message).toContain('All workflow files have been pre-loaded');
      expect(result.message).toContain(
        'You do NOT need to call read_file for these files'
      );
      expect(result.message).toContain('their content is already available above');
      expect(result.message).toContain('Follow the workflow instructions');
      expect(result.message).toContain('step-by-step in exact order');
    });

    it('should list all loaded file paths in result', async () => {
      const workflowYaml = `
name: file-list-test
config_source: "{bundle-root}/config.yaml"
instructions: "{bundle-root}/workflows/test-workflow/instructions.md"
template: "{bundle-root}/workflows/test-workflow/template.md"
      `.trim();

      await writeFile(resolve(workflowDir, 'workflow.yaml'), workflowYaml);
      await writeFile(resolve(bundleRoot, 'config.yaml'), 'user_name: Test');
      await writeFile(resolve(workflowDir, 'instructions.md'), '# Instructions');
      await writeFile(resolve(workflowDir, 'template.md'), '# Template');

      const toolCall = {
        id: 'file-list-test',
        type: 'function' as const,
        function: {
          name: 'preload_workflow',
          arguments: JSON.stringify({
            workflow_path: '{bundle-root}/workflows/test-workflow/workflow.yaml',
          }),
        },
      };

      const result = await executeToolCall(toolCall, context);

      expect(result.success).toBe(true);
      expect(Array.isArray(result.filesLoaded)).toBe(true);
      expect(result.filesLoaded.length).toBeGreaterThan(0);
      expect(result.filesLoaded[0]).toBe(
        '{bundle-root}/workflows/test-workflow/workflow.yaml'
      );
    });
  });
});
