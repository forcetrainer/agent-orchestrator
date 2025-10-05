/**
 * Integration Tests for Path Variable Resolution System
 *
 * Tests path resolution with real bundle structure and config.yaml files.
 * Verifies end-to-end workflows and performance characteristics.
 */

import {
  resolvePath,
  createPathContext,
  loadBundleConfig,
  clearConfigCache,
  type PathContext,
} from '@/lib/pathResolver';
import { resolve } from 'path';
import { mkdir, writeFile, rm } from 'fs/promises';

describe('pathResolver - Integration Tests', () => {
  const projectRoot = process.cwd();
  const testBundleRoot = resolve(projectRoot, 'temp-integration-test-bundle');
  const configPath = resolve(testBundleRoot, 'config.yaml');

  beforeEach(async () => {
    // Clear config cache
    clearConfigCache();

    // Create realistic bundle structure
    await mkdir(resolve(testBundleRoot, 'workflows/intake'), { recursive: true });
    await mkdir(resolve(testBundleRoot, 'agents'), { recursive: true });

    // Create sample config.yaml
    const configContent = `
# BMM Module Configuration
project_name: Test Project
tech_docs: '{project-root}/docs'
dev_story_location: '{project-root}/docs/stories'
output_folder: '{project-root}/docs/output'
user_name: TestUser
communication_language: English
`;
    await writeFile(configPath, configContent, 'utf-8');
  });

  afterEach(async () => {
    // Clean up test bundle
    await rm(testBundleRoot, { recursive: true, force: true });
  });

  describe('Real Bundle Structure (AC-4.2.6)', () => {
    it('should load config.yaml and resolve complex paths', async () => {
      const bundleConfig = await loadBundleConfig(testBundleRoot);
      const context: PathContext = {
        bundleRoot: testBundleRoot,
        coreRoot: resolve(projectRoot, 'bmad/core'),
        projectRoot,
        bundleConfig,
      };

      const result = resolvePath(
        '{config_source}:dev_story_location/story-4.2.md',
        context
      );

      expect(result).toBe(resolve(projectRoot, 'docs/stories/story-4.2.md'));
    });

    it('should resolve nested config variables with path variables', async () => {
      const bundleConfig = await loadBundleConfig(testBundleRoot);
      const context: PathContext = {
        bundleRoot: testBundleRoot,
        coreRoot: resolve(projectRoot, 'bmad/core'),
        projectRoot,
        bundleConfig,
      };

      const result = resolvePath(
        '{config_source}:tech_docs/AGENT-EXECUTION-SPEC.md',
        context
      );

      expect(result).toBe(
        resolve(projectRoot, 'docs/AGENT-EXECUTION-SPEC.md')
      );
    });

    it('should resolve output paths with date stamps', async () => {
      const bundleConfig = await loadBundleConfig(testBundleRoot);
      const context: PathContext = {
        bundleRoot: testBundleRoot,
        coreRoot: resolve(projectRoot, 'bmad/core'),
        projectRoot,
        bundleConfig,
      };

      const result = resolvePath(
        '{config_source}:output_folder/{date}/report.md',
        context
      );

      expect(result).toContain(resolve(projectRoot, 'docs/output'));
      expect(result).toMatch(/\d{4}-\d{2}-\d{2}/);
    });
  });

  describe('Performance (AC-4.2.8)', () => {
    it('should resolve complex paths quickly', async () => {
      const bundleConfig = await loadBundleConfig(testBundleRoot);
      const context: PathContext = {
        bundleRoot: testBundleRoot,
        coreRoot: resolve(projectRoot, 'bmad/core'),
        projectRoot,
        bundleConfig,
      };

      const start = Date.now();

      // Resolve 100 paths
      for (let i = 0; i < 100; i++) {
        resolvePath('{config_source}:dev_story_location/story-{date}.md', context);
      }

      const duration = Date.now() - start;

      // Should complete in under 100ms (1ms per resolution)
      expect(duration).toBeLessThan(100);
    });

    it('should benefit from config caching', async () => {
      // First load - reads from disk
      const config1 = await loadBundleConfig(testBundleRoot);

      // Second load - uses cache
      const config2 = await loadBundleConfig(testBundleRoot);

      // Same object reference indicates caching
      expect(config1).toBe(config2);
    });
  });

  describe('Workflow Integration Scenarios', () => {
    it('should support agent workflow file references', async () => {
      const bundleConfig = await loadBundleConfig(testBundleRoot);
      const context: PathContext = {
        bundleRoot: testBundleRoot,
        coreRoot: resolve(projectRoot, 'bmad/core'),
        projectRoot,
        bundleConfig,
      };

      // Simulate agent loading workflow instructions
      const workflowPath = resolvePath(
        '{bundle-root}/workflows/intake/workflow.yaml',
        context
      );

      expect(workflowPath).toBe(
        resolve(testBundleRoot, 'workflows/intake/workflow.yaml')
      );
    });

    it('should support core task references from workflows', async () => {
      const bundleConfig = await loadBundleConfig(testBundleRoot);
      const context: PathContext = {
        bundleRoot: testBundleRoot,
        coreRoot: resolve(projectRoot, 'bmad/core'),
        projectRoot,
        bundleConfig,
      };

      const taskPath = resolvePath('{core-root}/tasks/workflow.md', context);

      expect(taskPath).toBe(
        resolve(projectRoot, 'bmad/core/tasks/workflow.md')
      );
    });

    it('should resolve paths for multiple bundles independently', async () => {
      // Create second test bundle
      const bundle2Root = resolve(projectRoot, 'temp-integration-test-bundle-2');
      await mkdir(resolve(bundle2Root, 'workflows'), { recursive: true });

      const config2Path = resolve(bundle2Root, 'config.yaml');
      await writeFile(
        config2Path,
        'project_name: Bundle 2\noutput_folder: /different/output\n',
        'utf-8'
      );

      try {
        const config1 = await loadBundleConfig(testBundleRoot);
        const config2 = await loadBundleConfig(bundle2Root);

        const context1: PathContext = {
          bundleRoot: testBundleRoot,
          coreRoot: resolve(projectRoot, 'bmad/core'),
          projectRoot,
          bundleConfig: config1,
        };

        const context2: PathContext = {
          bundleRoot: bundle2Root,
          coreRoot: resolve(projectRoot, 'bmad/core'),
          projectRoot,
          bundleConfig: config2,
        };

        const path1 = resolvePath('{bundle-root}/workflows/test.yaml', context1);
        const path2 = resolvePath('{bundle-root}/workflows/test.yaml', context2);

        // Different bundles = different paths
        expect(path1).not.toBe(path2);
        expect(path1).toContain('temp-integration-test-bundle/');
        expect(path2).toContain('temp-integration-test-bundle-2/');
      } finally {
        await rm(bundle2Root, { recursive: true, force: true });
      }
    });
  });

  describe('Error Recovery and Edge Cases', () => {
    it('should handle missing config gracefully', async () => {
      // Delete config.yaml
      await rm(configPath, { force: true });

      const bundleConfig = await loadBundleConfig(testBundleRoot);
      const context: PathContext = {
        bundleRoot: testBundleRoot,
        coreRoot: resolve(projectRoot, 'bmad/core'),
        projectRoot,
        bundleConfig,
      };

      // Should still resolve path variables
      const result = resolvePath('{bundle-root}/workflows/test.yaml', context);

      expect(result).toBe(resolve(testBundleRoot, 'workflows/test.yaml'));
    });

    it('should handle special characters in paths', async () => {
      const bundleConfig = await loadBundleConfig(testBundleRoot);
      const context: PathContext = {
        bundleRoot: testBundleRoot,
        coreRoot: resolve(projectRoot, 'bmad/core'),
        projectRoot,
        bundleConfig,
      };

      const result = resolvePath(
        '{bundle-root}/files/file-with-dashes_and_underscores.yaml',
        context
      );

      expect(result).toBe(
        resolve(testBundleRoot, 'files/file-with-dashes_and_underscores.yaml')
      );
    });

    it('should normalize paths with redundant separators', async () => {
      const bundleConfig = await loadBundleConfig(testBundleRoot);
      const context: PathContext = {
        bundleRoot: testBundleRoot,
        coreRoot: resolve(projectRoot, 'bmad/core'),
        projectRoot,
        bundleConfig,
      };

      const result = resolvePath(
        '{bundle-root}//workflows///test.yaml',
        context
      );

      // Should normalize to single separators
      expect(result).toBe(resolve(testBundleRoot, 'workflows/test.yaml'));
      expect(result).not.toContain('//');
    });
  });
});
