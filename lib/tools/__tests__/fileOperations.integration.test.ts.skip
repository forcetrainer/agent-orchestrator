/**
 * Integration Tests for File Operation Tools
 *
 * Tests file operations with real file system and bundle structure.
 * Uses temporary test directories and real bundle configurations.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { mkdir, writeFile, readFile, rm } from 'fs/promises';
import { resolve } from 'path';
import {
  executeReadFile,
  executeSaveOutput,
  executeWorkflow,
} from '../fileOperations';
import { createPathContext } from '@/lib/pathResolver';

describe('File Operations Integration Tests', () => {
  let testDir: string;
  let bundleRoot: string;
  let coreRoot: string;

  beforeEach(async () => {
    // Create temporary test directory structure
    testDir = resolve(
      process.cwd(),
      '__integration_test_temp__',
      `test-${Date.now()}`
    );
    bundleRoot = resolve(testDir, 'bundles/test-bundle');
    coreRoot = resolve(testDir, 'core');

    await mkdir(bundleRoot, { recursive: true });
    await mkdir(coreRoot, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directory
    if (testDir && testDir.includes('__integration_test_temp__')) {
      await rm(testDir, { recursive: true, force: true });
    }
  });

  describe('Bundle Structure Support (AC-4.5.7)', () => {
    it('should read files from {bundle-root}/workflows/*', async () => {
      // Create test file in bundle workflows directory
      const workflowDir = resolve(bundleRoot, 'workflows/test-workflow');
      await mkdir(workflowDir, { recursive: true });
      const workflowFile = resolve(workflowDir, 'workflow.yaml');
      const content = 'name: test-workflow\ndescription: Test';
      await writeFile(workflowFile, content, 'utf-8');

      const context = createPathContext('test-bundle', {});
      context.bundleRoot = bundleRoot;
      context.coreRoot = coreRoot;
      context.projectRoot = testDir;

      const result = await executeReadFile(
        { file_path: '{bundle-root}/workflows/test-workflow/workflow.yaml' },
        context
      );

      expect(result.success).toBe(true);
      expect(result.content).toBe(content);
      expect(result.path).toContain('workflows/test-workflow/workflow.yaml');
    });

    it('should read files from {core-root}/tasks/*', async () => {
      // Create test file in core tasks directory
      const tasksDir = resolve(coreRoot, 'tasks');
      await mkdir(tasksDir, { recursive: true });
      const taskFile = resolve(tasksDir, 'workflow.md');
      const content = '# Workflow Task\n\nInstructions here...';
      await writeFile(taskFile, content, 'utf-8');

      const context = createPathContext('test-bundle', {});
      context.bundleRoot = bundleRoot;
      context.coreRoot = coreRoot;
      context.projectRoot = testDir;

      const result = await executeReadFile(
        { file_path: '{core-root}/tasks/workflow.md' },
        context
      );

      expect(result.success).toBe(true);
      expect(result.content).toBe(content);
      expect(result.path).toContain('core/tasks/workflow.md');
    });

    it('should write to {output_folder} from bundle config', async () => {
      // Create bundle config with output_folder
      const configContent = 'output_folder: "{project-root}/outputs"';
      const configFile = resolve(bundleRoot, 'config.yaml');
      await mkdir(bundleRoot, { recursive: true });
      await writeFile(configFile, configContent, 'utf-8');

      const context = createPathContext('test-bundle', {
        output_folder: `${testDir}/outputs`,
      });
      context.bundleRoot = bundleRoot;
      context.coreRoot = coreRoot;
      context.projectRoot = testDir;

      const result = await executeSaveOutput(
        {
          file_path: '{config_source}:output_folder/test-output.md',
          content: '# Test Output',
        },
        context
      );

      expect(result.success).toBe(true);
      expect(result.path).toContain('outputs/test-output.md');

      // Verify file was actually written
      const writtenContent = await readFile(result.path!, 'utf-8');
      expect(writtenContent).toBe('# Test Output');
    });

    it('should handle nested bundle directory structures', async () => {
      // Create deeply nested directory structure
      const nestedDir = resolve(bundleRoot, 'workflows/nested/deep/structure');
      await mkdir(nestedDir, { recursive: true });
      const nestedFile = resolve(nestedDir, 'config.json');
      await writeFile(nestedFile, '{"test": "value"}', 'utf-8');

      const context = createPathContext('test-bundle', {});
      context.bundleRoot = bundleRoot;
      context.coreRoot = coreRoot;
      context.projectRoot = testDir;

      const result = await executeReadFile(
        { file_path: '{bundle-root}/workflows/nested/deep/structure/config.json' },
        context
      );

      expect(result.success).toBe(true);
      expect(result.content).toBe('{"test": "value"}');
    });
  });

  describe('Workflow Loading Integration (AC-4.5.8)', () => {
    it('should load complete workflow with instructions and template', async () => {
      // Create workflow directory structure
      const workflowDir = resolve(bundleRoot, 'workflows/complete-workflow');
      await mkdir(workflowDir, { recursive: true });

      // Create workflow.yaml
      const workflowYaml = `name: complete-workflow
description: Complete workflow test
instructions: "{bundle-root}/workflows/complete-workflow/instructions.md"
template: "{bundle-root}/workflows/complete-workflow/template.md"
output_folder: "{project-root}/outputs"`;
      await writeFile(
        resolve(workflowDir, 'workflow.yaml'),
        workflowYaml,
        'utf-8'
      );

      // Create instructions.md
      const instructions = `# Complete Workflow Instructions
Step 1: Read input
Step 2: Process data
Step 3: Generate output`;
      await writeFile(
        resolve(workflowDir, 'instructions.md'),
        instructions,
        'utf-8'
      );

      // Create template.md
      const template = `# Output Template
{{variable1}}
{{variable2}}`;
      await writeFile(
        resolve(workflowDir, 'template.md'),
        template,
        'utf-8'
      );

      const context = createPathContext('test-bundle', {});
      context.bundleRoot = bundleRoot;
      context.coreRoot = coreRoot;
      context.projectRoot = testDir;

      const result = await executeWorkflow(
        {
          workflow_path:
            '{bundle-root}/workflows/complete-workflow/workflow.yaml',
          user_input: { key: 'value' },
        },
        context
      );

      expect(result.success).toBe(true);
      expect(result.workflow_name).toBe('complete-workflow');
      expect(result.description).toBe('Complete workflow test');
      expect(result.instructions).toBe(instructions);
      expect(result.template).toBe(template);
      expect(result.user_input).toEqual({ key: 'value' });
    });

    it('should load workflow with config_source variables', async () => {
      // Create bundle config
      const configYaml = `output_folder: "{project-root}/outputs"
user_name: TestUser
project_name: Test Project`;
      await writeFile(
        resolve(bundleRoot, 'config.yaml'),
        configYaml,
        'utf-8'
      );

      // Create workflow that references config variables
      const workflowDir = resolve(bundleRoot, 'workflows/config-workflow');
      await mkdir(workflowDir, { recursive: true });

      const workflowYaml = `name: config-workflow
description: Workflow with config variables
config_source: "{bundle-root}/config.yaml"
instructions: "{bundle-root}/workflows/config-workflow/instructions.md"
default_output: "{config_source}:output_folder/output.md"`;
      await writeFile(
        resolve(workflowDir, 'workflow.yaml'),
        workflowYaml,
        'utf-8'
      );

      const instructions = '# Instructions';
      await writeFile(
        resolve(workflowDir, 'instructions.md'),
        instructions,
        'utf-8'
      );

      const context = createPathContext('test-bundle', {
        output_folder: `${testDir}/outputs`,
        user_name: 'TestUser',
        project_name: 'Test Project',
      });
      context.bundleRoot = bundleRoot;
      context.coreRoot = coreRoot;
      context.projectRoot = testDir;

      const result = await executeWorkflow(
        {
          workflow_path: '{bundle-root}/workflows/config-workflow/workflow.yaml',
        },
        context
      );

      expect(result.success).toBe(true);
      expect(result.config).toBeDefined();
    });

    it('should handle workflows without templates', async () => {
      // Create workflow without template (action workflow)
      const workflowDir = resolve(bundleRoot, 'workflows/action-workflow');
      await mkdir(workflowDir, { recursive: true });

      const workflowYaml = `name: action-workflow
description: Action-only workflow
instructions: "{bundle-root}/workflows/action-workflow/instructions.md"
template: false`;
      await writeFile(
        resolve(workflowDir, 'workflow.yaml'),
        workflowYaml,
        'utf-8'
      );

      const instructions = '# Action Instructions';
      await writeFile(
        resolve(workflowDir, 'instructions.md'),
        instructions,
        'utf-8'
      );

      const context = createPathContext('test-bundle', {});
      context.bundleRoot = bundleRoot;
      context.coreRoot = coreRoot;
      context.projectRoot = testDir;

      const result = await executeWorkflow(
        {
          workflow_path: '{bundle-root}/workflows/action-workflow/workflow.yaml',
        },
        context
      );

      expect(result.success).toBe(true);
      expect(result.template).toBe('');
      expect(result.instructions).toBe('# Action Instructions');
    });
  });

  describe('End-to-End Workflow Execution', () => {
    it('should complete full workflow: load config, read template, write output', async () => {
      // Setup: Create complete bundle structure
      const workflowDir = resolve(bundleRoot, 'workflows/e2e-workflow');
      await mkdir(workflowDir, { recursive: true });

      // Create config
      const configYaml = `output_folder: "${testDir}/outputs"
user_name: E2EUser`;
      await writeFile(
        resolve(bundleRoot, 'config.yaml'),
        configYaml,
        'utf-8'
      );

      // Create workflow
      const workflowYaml = `name: e2e-workflow
description: End-to-end test workflow
config_source: "{bundle-root}/config.yaml"
instructions: "{bundle-root}/workflows/e2e-workflow/instructions.md"
template: "{bundle-root}/workflows/e2e-workflow/template.md"`;
      await writeFile(
        resolve(workflowDir, 'workflow.yaml'),
        workflowYaml,
        'utf-8'
      );

      const instructions = '# E2E Instructions';
      await writeFile(
        resolve(workflowDir, 'instructions.md'),
        instructions,
        'utf-8'
      );

      const template = '# Template\nUser: {{user_name}}';
      await writeFile(
        resolve(workflowDir, 'template.md'),
        template,
        'utf-8'
      );

      const context = createPathContext('test-bundle', {
        output_folder: `${testDir}/outputs`,
        user_name: 'E2EUser',
      });
      context.bundleRoot = bundleRoot;
      context.coreRoot = coreRoot;
      context.projectRoot = testDir;

      // Step 1: Load workflow
      const workflowResult = await executeWorkflow(
        {
          workflow_path: '{bundle-root}/workflows/e2e-workflow/workflow.yaml',
        },
        context
      );

      expect(workflowResult.success).toBe(true);

      // Step 2: Read template from workflow result
      expect(workflowResult.template).toBe(template);

      // Step 3: Generate output and save
      const output = '# Generated Output\nUser: E2EUser\nGenerated content';
      const saveResult = await executeSaveOutput(
        {
          file_path: '{config_source}:output_folder/e2e-output.md',
          content: output,
        },
        context
      );

      expect(saveResult.success).toBe(true);

      // Step 4: Verify output file exists and has correct content
      const savedContent = await readFile(saveResult.path!, 'utf-8');
      expect(savedContent).toBe(output);
    });
  });

  describe('Security and Error Handling', () => {
    it('should prevent writing outside allowed directories', async () => {
      const context = createPathContext('test-bundle', {});
      context.bundleRoot = bundleRoot;
      context.coreRoot = coreRoot;
      context.projectRoot = testDir;

      const result = await executeSaveOutput(
        {
          file_path: '../../../etc/passwd',
          content: 'malicious content',
        },
        context
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Security violation');
    });

    it('should handle missing files gracefully', async () => {
      const context = createPathContext('test-bundle', {});
      context.bundleRoot = bundleRoot;
      context.coreRoot = coreRoot;
      context.projectRoot = testDir;

      const result = await executeReadFile(
        { file_path: '{bundle-root}/nonexistent/file.txt' },
        context
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('File not found');
    });

    it('should create nested directories automatically on save', async () => {
      const context = createPathContext('test-bundle', {});
      context.bundleRoot = bundleRoot;
      context.coreRoot = coreRoot;
      context.projectRoot = testDir;

      const result = await executeSaveOutput(
        {
          file_path: '{bundle-root}/new/nested/deep/directory/file.txt',
          content: 'auto-created directories',
        },
        context
      );

      expect(result.success).toBe(true);

      // Verify file exists and content is correct
      const content = await readFile(result.path!, 'utf-8');
      expect(content).toBe('auto-created directories');
    });
  });

  describe('Core File Support (AC-4.11.1, AC-4.11.3, AC-4.11.4, AC-4.11.7)', () => {
    it('should read files from {core-root} directory (AC-4.11.1, AC-4.11.7)', async () => {
      // Create test file in core tasks directory (simulating bmad/core/tasks/workflow.md)
      const tasksDir = resolve(coreRoot, 'tasks');
      await mkdir(tasksDir, { recursive: true });
      const workflowFile = resolve(tasksDir, 'workflow.md');
      const content = '# BMAD Workflow Task\n\nCore workflow execution instructions...';
      await writeFile(workflowFile, content, 'utf-8');

      const context = createPathContext('test-bundle', {});
      context.bundleRoot = bundleRoot;
      context.coreRoot = coreRoot;
      context.projectRoot = testDir;

      const result = await executeReadFile(
        { file_path: '{core-root}/tasks/workflow.md' },
        context
      );

      expect(result.success).toBe(true);
      expect(result.content).toBe(content);
      expect(result.path).toContain('core/tasks/workflow.md');
    });

    it('should reject write attempts to {core-root} paths (AC-4.11.4)', async () => {
      const context = createPathContext('test-bundle', {});
      context.bundleRoot = bundleRoot;
      context.coreRoot = coreRoot;
      context.projectRoot = testDir;

      const result = await executeSaveOutput(
        {
          file_path: '{core-root}/tasks/malicious.md',
          content: 'Attempting to write to core directory',
        },
        context
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Write operation denied');
      expect(result.error).toContain('read-only');
    });

    it('should reject writes to resolved core-root paths (AC-4.11.4)', async () => {
      const context = createPathContext('test-bundle', {});
      context.bundleRoot = bundleRoot;
      context.coreRoot = coreRoot;
      context.projectRoot = testDir;

      // Test with absolute path that resolves to coreRoot
      const result = await executeSaveOutput(
        {
          file_path: '{core-root}/workflows/test.yaml',
          content: 'Should not be written',
        },
        context
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Core files are read-only');
    });

    it('should allow reading multiple core files in sequence (AC-4.11.3)', async () => {
      // Create multiple core files
      const tasksDir = resolve(coreRoot, 'tasks');
      await mkdir(tasksDir, { recursive: true });

      await writeFile(
        resolve(tasksDir, 'workflow.md'),
        'Workflow content',
        'utf-8'
      );
      await writeFile(
        resolve(tasksDir, 'adv-elicit.md'),
        'Elicit content',
        'utf-8'
      );

      const context = createPathContext('test-bundle', {});
      context.bundleRoot = bundleRoot;
      context.coreRoot = coreRoot;
      context.projectRoot = testDir;

      const result1 = await executeReadFile(
        { file_path: '{core-root}/tasks/workflow.md' },
        context
      );
      const result2 = await executeReadFile(
        { file_path: '{core-root}/tasks/adv-elicit.md' },
        context
      );

      expect(result1.success).toBe(true);
      expect(result1.content).toBe('Workflow content');
      expect(result2.success).toBe(true);
      expect(result2.content).toBe('Elicit content');
    });

    it('should handle non-existent core files gracefully (AC-4.11.1)', async () => {
      const context = createPathContext('test-bundle', {});
      context.bundleRoot = bundleRoot;
      context.coreRoot = coreRoot;
      context.projectRoot = testDir;

      const result = await executeReadFile(
        { file_path: '{core-root}/tasks/nonexistent.md' },
        context
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('File not found');
    });
  });
});
