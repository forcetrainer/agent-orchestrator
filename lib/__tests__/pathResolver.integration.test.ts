/**
 * Integration Tests for Path Variable Resolution System (Simplified)
 *
 * Story 9.2: Tests simplified path resolution with real bundle structure.
 * After simplification, tests focus on:
 * - Basic path variable resolution ({bundle-root}, {core-root}, {project-root})
 * - Custom variable resolution (extensibility)
 * - Performance characteristics
 * - Edge cases and error handling
 *
 * REMOVED (no longer tested):
 * - Config file loading and parsing (LLM handles this)
 * - {config_source}:variable_name resolution
 * - {date} and {user_name} system variables
 * - Multi-pass nested resolution
 */

import {
  resolvePath,
  createPathContext,
  type PathContext,
} from '@/lib/pathResolver';
import { resolve } from 'path';
import { mkdir, writeFile, rm } from 'fs/promises';

describe('pathResolver - Integration Tests (Story 9.2 Simplified)', () => {
  const projectRoot = process.cwd();
  // Note: createPathContext generates paths like: bmad/custom/bundles/{bundleName}
  const testBundleRoot = resolve(projectRoot, 'bmad/custom/bundles/temp-integration-test-bundle');

  beforeEach(async () => {
    // Create realistic bundle structure
    await mkdir(resolve(testBundleRoot, 'workflows/intake'), { recursive: true });
    await mkdir(resolve(testBundleRoot, 'agents'), { recursive: true });
  });

  afterEach(async () => {
    // Clean up test bundle
    await rm(testBundleRoot, { recursive: true, force: true });
  });

  describe('Real Bundle Structure', () => {
    it('should resolve bundle workflow paths', () => {
      const context = createPathContext('temp-integration-test-bundle');

      // Simulate agent loading workflow instructions
      const workflowPath = resolvePath(
        '{bundle-root}/workflows/intake/workflow.yaml',
        context
      );

      expect(workflowPath).toBe(
        resolve(testBundleRoot, 'workflows/intake/workflow.yaml')
      );
    });

    it('should resolve core task references from workflows', () => {
      const context = createPathContext('temp-integration-test-bundle');

      const taskPath = resolvePath('{core-root}/tasks/workflow.md', context);

      expect(taskPath).toBe(
        resolve(projectRoot, 'bmad/core/tasks/workflow.md')
      );
    });

    it('should resolve project-relative documentation paths', () => {
      const context = createPathContext('temp-integration-test-bundle');

      const docPath = resolvePath(
        '{project-root}/docs/stories/story-9.2.md',
        context
      );

      expect(docPath).toBe(
        resolve(projectRoot, 'docs/stories/story-9.2.md')
      );
    });
  });

  describe('Custom Variables (Extensibility)', () => {
    it('should support custom workflow-root variable', () => {
      const context: PathContext = {
        'bundle-root': testBundleRoot,
        'core-root': resolve(projectRoot, 'bmad/core'),
        'project-root': projectRoot,
        'workflow-root': `${testBundleRoot}/workflows`,
      };

      const result = resolvePath('{workflow-root}/intake/instructions.md', context);

      expect(result).toBe(
        resolve(testBundleRoot, 'workflows/intake/instructions.md')
      );
    });

    it('should support custom output-root variable', () => {
      const outputRoot = resolve(projectRoot, 'data/agent-outputs');
      const context: PathContext = {
        'bundle-root': testBundleRoot,
        'core-root': resolve(projectRoot, 'bmad/core'),
        'project-root': projectRoot,
        'output-root': outputRoot,
      };

      const result = resolvePath('{output-root}/session-123/report.md', context);

      expect(result).toBe(
        resolve(outputRoot, 'session-123/report.md')
      );
    });

    it('should support multiple custom variables in one path', () => {
      const context: PathContext = {
        'bundle-root': testBundleRoot,
        'core-root': resolve(projectRoot, 'bmad/core'),
        'project-root': projectRoot,
        'docs-root': `${projectRoot}/docs`,
        'stories-dir': 'stories',
      };

      const result = resolvePath('{docs-root}/{stories-dir}/story-9.2.md', context);

      expect(result).toBe(
        resolve(projectRoot, 'docs/stories/story-9.2.md')
      );
    });
  });

  describe('Performance', () => {
    it('should resolve paths quickly (single-pass is fast)', () => {
      const context = createPathContext('temp-integration-test-bundle');

      const start = Date.now();

      // Resolve 1000 paths (more than before since single-pass is faster)
      for (let i = 0; i < 1000; i++) {
        resolvePath('{bundle-root}/workflows/test-{core-root}.md', context);
      }

      const duration = Date.now() - start;

      // Should complete in under 100ms (0.1ms per resolution)
      // Single-pass is much faster than multi-pass nested resolution
      expect(duration).toBeLessThan(100);
    });

    it('should not have caching complexity (stateless resolution)', () => {
      const context1 = createPathContext('bundle-1');
      const context2 = createPathContext('bundle-2');

      // Each call is independent - no caching needed
      const path1 = resolvePath('{bundle-root}/test.yaml', context1);
      const path2 = resolvePath('{bundle-root}/test.yaml', context2);

      // Different bundles = different paths
      expect(path1).toContain('bundle-1');
      expect(path2).toContain('bundle-2');
    });
  });

  describe('Multiple Bundle Independence', () => {
    it('should resolve paths for multiple bundles independently', async () => {
      // Create second test bundle
      const bundle2Root = resolve(projectRoot, 'bmad/custom/bundles/temp-integration-test-bundle-2');
      await mkdir(resolve(bundle2Root, 'workflows'), { recursive: true });

      try {
        const context1 = createPathContext('temp-integration-test-bundle');
        const context2 = createPathContext('temp-integration-test-bundle-2');

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

  describe('Error Handling', () => {
    it('should throw clear error for unknown variables', () => {
      const context = createPathContext('temp-integration-test-bundle');

      expect(() => {
        resolvePath('{unknown-var}/test.yaml', context);
      }).toThrow('Unknown variable: {unknown-var}');
    });

    it('should handle special characters in paths', () => {
      const context = createPathContext('temp-integration-test-bundle');

      const result = resolvePath(
        '{bundle-root}/files/file-with-dashes_and_underscores.yaml',
        context
      );

      expect(result).toBe(
        resolve(testBundleRoot, 'files/file-with-dashes_and_underscores.yaml')
      );
    });

    it('should normalize paths with redundant separators', () => {
      const context = createPathContext('temp-integration-test-bundle');

      const result = resolvePath(
        '{bundle-root}//workflows///test.yaml',
        context
      );

      // Should normalize to single separators
      expect(result).toBe(resolve(testBundleRoot, 'workflows/test.yaml'));
      expect(result).not.toContain('//');
    });

    it('should reject paths with .. segments (security)', () => {
      const context = createPathContext('temp-integration-test-bundle');

      // After Story 9.2, .. segments are blocked as path traversal attempts
      expect(() => {
        resolvePath(
          '{bundle-root}/workflows/./subfolder/../test.yaml',
          context
        );
      }).toThrow('Security violation: Path traversal attempt detected');
    });
  });

  describe('Real-World Scenarios', () => {
    it('should support session-based output paths', () => {
      const sessionId = 'session-20251011-123456';
      const context: PathContext = {
        'bundle-root': testBundleRoot,
        'core-root': resolve(projectRoot, 'bmad/core'),
        'project-root': projectRoot,
        'session-folder': resolve(projectRoot, `data/agent-outputs/${sessionId}`),
      };

      const result = resolvePath('{session-folder}/report.md', context);

      expect(result).toBe(
        resolve(projectRoot, `data/agent-outputs/${sessionId}/report.md`)
      );
    });

    it('should support complex nested directory structures', () => {
      const context = createPathContext('temp-integration-test-bundle');

      const result = resolvePath(
        '{bundle-root}/workflows/intake/substeps/detailed/step-3/instructions.md',
        context
      );

      expect(result).toBe(
        resolve(testBundleRoot, 'workflows/intake/substeps/detailed/step-3/instructions.md')
      );
    });
  });
});
