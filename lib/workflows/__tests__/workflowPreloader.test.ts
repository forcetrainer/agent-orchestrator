/**
 * Unit Tests for Workflow Pre-loader
 * Story 9.4: Implement Smart Workflow Pre-loading
 *
 * Tests the smart workflow pre-loading system that loads all workflow files
 * in a single operation instead of requiring 4-6 sequential LLM tool calls.
 *
 * PERFORMANCE TARGET: <20 seconds vs ~110s baseline (3-5x speedup)
 * TOKEN SAVINGS: 50-70% reduction vs sequential loading
 */

import { mkdir, rm, writeFile } from 'fs/promises';
import { resolve } from 'path';
import { preloadWorkflowFiles, PreloadResult } from '../workflowPreloader';
import { PathContext } from '@/lib/pathResolver';

describe('Workflow Preloader (Story 9.4)', () => {
  let testDir: string;
  let bundleRoot: string;
  let workflowDir: string;
  let context: PathContext;

  beforeEach(async () => {
    // Create temporary test directory structure
    testDir = resolve(
      process.cwd(),
      '__test_temp__',
      `workflow-preloader-${Date.now()}`
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

  describe('AC1: Core Files Pre-loaded', () => {
    it('should load all core files for standard workflow', async () => {
      // Create test workflow files
      const workflowYaml = `
name: test-workflow
description: Test workflow
config_source: "{bundle-root}/config.yaml"
instructions: "{bundle-root}/workflows/test-workflow/instructions.md"
template: "{bundle-root}/workflows/test-workflow/template.md"
      `.trim();

      const configYaml = `
user_name: TestUser
output_folder: "{project-root}/data"
      `.trim();

      const instructions = `
# Test Workflow Instructions

<step n="1" goal="Test step">
  <action>Do something</action>
</step>
      `.trim();

      const template = '# Template\n\nTemplate content';

      await writeFile(resolve(workflowDir, 'workflow.yaml'), workflowYaml);
      await writeFile(resolve(bundleRoot, 'config.yaml'), configYaml);
      await writeFile(resolve(workflowDir, 'instructions.md'), instructions);
      await writeFile(resolve(workflowDir, 'template.md'), template);

      // Execute preload
      const result = await preloadWorkflowFiles(
        '{bundle-root}/workflows/test-workflow/workflow.yaml',
        context
      );

      // Verify all core files loaded
      expect(result.workflowYaml).toBeDefined();
      expect(result.workflowYaml.name).toBe('test-workflow');
      expect(result.configYaml).toBeDefined();
      expect(result.configYaml.user_name).toBe('TestUser');
      expect(result.instructions).toBe(instructions);
      expect(result.template).toBe(template);
      expect(result.workflowEngine).toContain('Workflow Engine');
    });

    it('should handle template: false for action-only workflows', async () => {
      const workflowYaml = `
name: action-workflow
config_source: "{bundle-root}/config.yaml"
instructions: "{bundle-root}/workflows/test-workflow/instructions.md"
template: false
      `.trim();

      await writeFile(resolve(workflowDir, 'workflow.yaml'), workflowYaml);
      await writeFile(resolve(bundleRoot, 'config.yaml'), 'user_name: Test');
      await writeFile(resolve(workflowDir, 'instructions.md'), '# Instructions');

      const result = await preloadWorkflowFiles(
        '{bundle-root}/workflows/test-workflow/workflow.yaml',
        context
      );

      expect(result.workflowYaml.template).toBe(false);
      expect(result.template).toBeNull();
      expect(result.filesLoaded).not.toContain(
        expect.stringContaining('template.md')
      );
    });

    it('should include filesLoaded array with all loaded paths', async () => {
      const workflowYaml = `
name: test
config_source: "{bundle-root}/config.yaml"
instructions: "{bundle-root}/workflows/test-workflow/instructions.md"
template: false
      `.trim();

      await writeFile(resolve(workflowDir, 'workflow.yaml'), workflowYaml);
      await writeFile(resolve(bundleRoot, 'config.yaml'), 'user_name: Test');
      await writeFile(resolve(workflowDir, 'instructions.md'), '# Instructions');

      const result = await preloadWorkflowFiles(
        '{bundle-root}/workflows/test-workflow/workflow.yaml',
        context
      );

      expect(result.filesLoaded).toContain(
        '{bundle-root}/workflows/test-workflow/workflow.yaml'
      );
      expect(result.filesLoaded).toContain('{bundle-root}/config.yaml');
      expect(result.filesLoaded).toContain(
        '{bundle-root}/workflows/test-workflow/instructions.md'
      );
      expect(result.filesLoaded).toContain(
        '{project-root}/bmad/core/tasks/workflow.md'
      );
      expect(result.filesLoaded.length).toBe(4); // workflow, config, instructions, engine
    });
  });

  describe('AC2: YAML-internal Variable Resolution', () => {
    it('should resolve {installed_path} variable in workflow paths', async () => {
      const workflowYaml = `
name: test-workflow
installed_path: "{bundle-root}/workflows/test-workflow"
config_source: "{installed_path}/config.yaml"
instructions: "{installed_path}/instructions.md"
template: false
      `.trim();

      await writeFile(resolve(workflowDir, 'workflow.yaml'), workflowYaml);
      await writeFile(resolve(workflowDir, 'config.yaml'), 'user_name: Test');
      await writeFile(resolve(workflowDir, 'instructions.md'), '# Instructions');

      const result = await preloadWorkflowFiles(
        '{bundle-root}/workflows/test-workflow/workflow.yaml',
        context
      );

      // Verify files loaded correctly with resolved paths
      expect(result.configYaml).toBeDefined();
      expect(result.configYaml.user_name).toBe('Test');
      expect(result.instructions).toContain('Instructions');
      expect(result.filesLoaded).toContain(
        '{bundle-root}/workflows/test-workflow/config.yaml'
      );
    });

    it('should handle multiple YAML-internal variables', async () => {
      const workflowYaml = `
name: multi-var-workflow
installed_path: "{bundle-root}/workflows/test-workflow"
secondary_path: "{installed_path}"
config_source: "{secondary_path}/config.yaml"
instructions: "{secondary_path}/instructions.md"
template: false
      `.trim();

      await writeFile(resolve(workflowDir, 'workflow.yaml'), workflowYaml);
      await writeFile(resolve(workflowDir, 'config.yaml'), 'test: value');
      await writeFile(resolve(workflowDir, 'instructions.md'), '# Multi-var');

      const result = await preloadWorkflowFiles(
        '{bundle-root}/workflows/test-workflow/workflow.yaml',
        context
      );

      expect(result.configYaml.test).toBe('value');
      expect(result.instructions).toContain('Multi-var');
    });
  });

  describe('AC3: Conditional File Loading', () => {
    it('should load elicit task when <elicit-required> tag present', async () => {
      const workflowYaml = `
name: elicit-workflow
config_source: "{bundle-root}/config.yaml"
instructions: "{bundle-root}/workflows/test-workflow/instructions.md"
template: false
      `.trim();

      const instructions = `
# Workflow with Elicitation

<step n="1" goal="Step 1">
  <action>Do something</action>
  <elicit-required>Enhance this step</elicit-required>
</step>
      `.trim();

      await writeFile(resolve(workflowDir, 'workflow.yaml'), workflowYaml);
      await writeFile(resolve(bundleRoot, 'config.yaml'), 'user: Test');
      await writeFile(resolve(workflowDir, 'instructions.md'), instructions);
      await writeFile(
        resolve(context['core-root'] as string, 'tasks/adv-elicit.md'),
        '# Advanced Elicitation Task\n\nElicitation rules...'
      );

      const result = await preloadWorkflowFiles(
        '{bundle-root}/workflows/test-workflow/workflow.yaml',
        context
      );

      expect(result.elicitTask).toBeDefined();
      expect(result.elicitTask).toContain('Elicitation Task');
      expect(result.filesLoaded).toContain(
        '{project-root}/bmad/core/tasks/adv-elicit.md'
      );
    });

    it('should NOT load elicit task when tag not present', async () => {
      const workflowYaml = `
name: no-elicit-workflow
config_source: "{bundle-root}/config.yaml"
instructions: "{bundle-root}/workflows/test-workflow/instructions.md"
template: false
      `.trim();

      const instructions = `
# Workflow without Elicitation

<step n="1" goal="Simple step">
  <action>Do something simple</action>
</step>
      `.trim();

      await writeFile(resolve(workflowDir, 'workflow.yaml'), workflowYaml);
      await writeFile(resolve(bundleRoot, 'config.yaml'), 'user: Test');
      await writeFile(resolve(workflowDir, 'instructions.md'), instructions);

      const result = await preloadWorkflowFiles(
        '{bundle-root}/workflows/test-workflow/workflow.yaml',
        context
      );

      expect(result.elicitTask).toBeUndefined();
      expect(result.filesLoaded).not.toContain(
        '{project-root}/bmad/core/tasks/adv-elicit.md'
      );
    });
  });

  describe('AC6: Clear LLM Contract', () => {
    it('should include helpful message for LLM', async () => {
      const workflowYaml = `
name: test-workflow
config_source: "{bundle-root}/config.yaml"
instructions: "{bundle-root}/workflows/test-workflow/instructions.md"
template: false
      `.trim();

      await writeFile(resolve(workflowDir, 'workflow.yaml'), workflowYaml);
      await writeFile(resolve(bundleRoot, 'config.yaml'), 'user: Test');
      await writeFile(resolve(workflowDir, 'instructions.md'), '# Instructions');

      const result = await preloadWorkflowFiles(
        '{bundle-root}/workflows/test-workflow/workflow.yaml',
        context
      );

      expect(result.message).toContain('All workflow files have been pre-loaded');
      expect(result.message).toContain(
        'You do NOT need to call read_file for these files'
      );
      expect(result.message).toContain('Follow the workflow instructions');
      expect(result.message).toContain('step-by-step in exact order');
    });

    it('should list all loaded files in message', async () => {
      const workflowYaml = `
name: test-workflow
config_source: "{bundle-root}/config.yaml"
instructions: "{bundle-root}/workflows/test-workflow/instructions.md"
template: "{bundle-root}/workflows/test-workflow/template.md"
      `.trim();

      await writeFile(resolve(workflowDir, 'workflow.yaml'), workflowYaml);
      await writeFile(resolve(bundleRoot, 'config.yaml'), 'user: Test');
      await writeFile(resolve(workflowDir, 'instructions.md'), '# Instructions');
      await writeFile(resolve(workflowDir, 'template.md'), '# Template');

      const result = await preloadWorkflowFiles(
        '{bundle-root}/workflows/test-workflow/workflow.yaml',
        context
      );

      // Check that message lists all files numerically
      expect(result.message).toContain('1. ');
      expect(result.message).toContain('2. ');
      expect(result.message).toContain('3. ');
      expect(result.message).toContain('4. ');
      expect(result.message).toContain('5. ');
    });
  });

  describe('Error Handling', () => {
    it('should throw error when workflow.yaml not found', async () => {
      await expect(
        preloadWorkflowFiles(
          '{bundle-root}/workflows/nonexistent/workflow.yaml',
          context
        )
      ).rejects.toThrow();
    });

    it('should throw error when config file not found', async () => {
      const workflowYaml = `
name: test-workflow
config_source: "{bundle-root}/nonexistent-config.yaml"
instructions: "{bundle-root}/workflows/test-workflow/instructions.md"
template: false
      `.trim();

      await writeFile(resolve(workflowDir, 'workflow.yaml'), workflowYaml);
      await writeFile(resolve(workflowDir, 'instructions.md'), '# Instructions');

      await expect(
        preloadWorkflowFiles(
          '{bundle-root}/workflows/test-workflow/workflow.yaml',
          context
        )
      ).rejects.toThrow();
    });

    it('should throw error when instructions file not found', async () => {
      const workflowYaml = `
name: test-workflow
config_source: "{bundle-root}/config.yaml"
instructions: "{bundle-root}/workflows/test-workflow/missing.md"
template: false
      `.trim();

      await writeFile(resolve(workflowDir, 'workflow.yaml'), workflowYaml);
      await writeFile(resolve(bundleRoot, 'config.yaml'), 'user: Test');

      await expect(
        preloadWorkflowFiles(
          '{bundle-root}/workflows/test-workflow/workflow.yaml',
          context
        )
      ).rejects.toThrow();
    });

    it('should throw error when YAML is malformed', async () => {
      const invalidYaml = `
name: test-workflow
config_source: [invalid yaml structure
      `.trim();

      await writeFile(resolve(workflowDir, 'workflow.yaml'), invalidYaml);

      await expect(
        preloadWorkflowFiles(
          '{bundle-root}/workflows/test-workflow/workflow.yaml',
          context
        )
      ).rejects.toThrow();
    });
  });

  describe('Performance', () => {
    it('should load files in parallel (Promise.all)', async () => {
      const workflowYaml = `
name: test-workflow
config_source: "{bundle-root}/config.yaml"
instructions: "{bundle-root}/workflows/test-workflow/instructions.md"
template: "{bundle-root}/workflows/test-workflow/template.md"
      `.trim();

      await writeFile(resolve(workflowDir, 'workflow.yaml'), workflowYaml);
      await writeFile(resolve(bundleRoot, 'config.yaml'), 'user: Test');
      await writeFile(resolve(workflowDir, 'instructions.md'), '# Instructions');
      await writeFile(resolve(workflowDir, 'template.md'), '# Template');

      const startTime = Date.now();
      const result = await preloadWorkflowFiles(
        '{bundle-root}/workflows/test-workflow/workflow.yaml',
        context
      );
      const duration = Date.now() - startTime;

      // Should complete very quickly (< 100ms for local files)
      expect(duration).toBeLessThan(100);
      expect(result.filesLoaded.length).toBe(5);
    });
  });

  describe('PreloadResult Structure', () => {
    it('should return PreloadResult with correct interface', async () => {
      const workflowYaml = `
name: test-workflow
config_source: "{bundle-root}/config.yaml"
instructions: "{bundle-root}/workflows/test-workflow/instructions.md"
template: false
      `.trim();

      await writeFile(resolve(workflowDir, 'workflow.yaml'), workflowYaml);
      await writeFile(resolve(bundleRoot, 'config.yaml'), 'user: Test');
      await writeFile(resolve(workflowDir, 'instructions.md'), '# Instructions');

      const result = await preloadWorkflowFiles(
        '{bundle-root}/workflows/test-workflow/workflow.yaml',
        context
      );

      // Verify PreloadResult interface
      expect(result).toHaveProperty('workflowYaml');
      expect(result).toHaveProperty('configYaml');
      expect(result).toHaveProperty('instructions');
      expect(result).toHaveProperty('template');
      expect(result).toHaveProperty('workflowEngine');
      expect(result).toHaveProperty('filesLoaded');
      expect(result).toHaveProperty('message');

      // Verify types
      expect(typeof result.workflowYaml).toBe('object');
      expect(typeof result.configYaml).toBe('object');
      expect(typeof result.instructions).toBe('string');
      expect(result.template === null || typeof result.template === 'string').toBe(
        true
      );
      expect(typeof result.workflowEngine).toBe('string');
      expect(Array.isArray(result.filesLoaded)).toBe(true);
      expect(typeof result.message).toBe('string');
    });
  });
});
