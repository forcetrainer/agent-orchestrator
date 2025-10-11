/**
 * Path Variable Resolution System Tests (Simplified)
 *
 * Story 9.2: After simplification, the path resolver only handles:
 * - Generic variable resolution: {variable-name} → context[variable-name]
 * - Single-pass resolution (no nested variables, no multi-pass)
 * - Standard variables: {bundle-root}, {core-root}, {project-root}
 * - Extensibility: Any {variable-name} can be added to PathContext
 *
 * REMOVED (handled by LLM now):
 * - {config_source}:variable_name resolution
 * - {date} and {user_name} resolution
 * - Multi-pass nested variable resolution
 * - Circular reference detection
 *
 * Note: Security tests (path traversal, etc.) are in pathResolver.security.test.ts
 */

import {
  resolvePath,
  createPathContext,
  type PathContext,
} from '@/lib/pathResolver';
import { resolve } from 'path';

describe('pathResolver - Simplified (Story 9.2)', () => {
  const projectRoot = process.cwd();
  const testBundleRoot = resolve(projectRoot, 'bmad/custom/bundles/test-bundle');
  const coreRoot = resolve(projectRoot, 'bmad/core');

  describe('Standard Variables', () => {
    it('should resolve {bundle-root} variable', () => {
      const context = createPathContext('test-bundle');
      const result = resolvePath('{bundle-root}/workflows/test.yaml', context);
      expect(result).toBe(resolve(testBundleRoot, 'workflows/test.yaml'));
    });

    it('should resolve {core-root} variable', () => {
      const context = createPathContext('test-bundle');
      const result = resolvePath('{core-root}/tasks/workflow.md', context);
      expect(result).toBe(resolve(coreRoot, 'tasks/workflow.md'));
    });

    it('should resolve {project-root} variable', () => {
      const context = createPathContext('test-bundle');
      const result = resolvePath('{project-root}/output/test.md', context);
      expect(result).toBe(resolve(projectRoot, 'output/test.md'));
    });

    it('should resolve multiple variables in one path', () => {
      const context = createPathContext('test-bundle');
      // Note: This creates a path like "/path/to/bundle/workflows//path/to/core/tasks.yaml"
      // which is technically valid (multiple slashes are normalized)
      const result = resolvePath('{bundle-root}/workflows/{core-root}/tasks.yaml', context);
      expect(result).toContain(testBundleRoot);
      expect(result).toContain(coreRoot);
    });
  });

  describe('Generic Variable Resolution', () => {
    it('should resolve custom variables from PathContext', () => {
      // Use project-relative paths to pass security validation
      const outputRoot = resolve(projectRoot, 'data/agent-outputs');
      const context: PathContext = {
        'bundle-root': testBundleRoot,
        'core-root': coreRoot,
        'project-root': projectRoot,
        'output-root': outputRoot,
        'workflow-root': `${testBundleRoot}/workflows`,
      };

      const result1 = resolvePath('{output-root}/session-123/file.txt', context);
      expect(result1).toContain('/data/agent-outputs/session-123/file.txt');

      const result2 = resolvePath('{workflow-root}/intake.yaml', context);
      expect(result2).toBe(resolve(`${testBundleRoot}/workflows/intake.yaml`));
    });

    it('should throw error for unknown variables', () => {
      const context = createPathContext('test-bundle');

      expect(() => {
        resolvePath('{unknown-variable}/test.yaml', context);
      }).toThrow('Unknown variable: {unknown-variable}');
    });

    it('should list available variables in error message', () => {
      const context = createPathContext('test-bundle');

      try {
        resolvePath('{missing-var}/test.yaml', context);
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).toContain('Available variables:');
        expect(error.message).toContain('bundle-root');
        expect(error.message).toContain('core-root');
        expect(error.message).toContain('project-root');
      }
    });
  });

  describe('Single-Pass Resolution', () => {
    it('should NOT resolve nested variables (simplified behavior)', () => {
      // In old system: {custom-var} would resolve to {bundle-root}/workflows,
      // then {bundle-root} would resolve to actual path (multi-pass)
      // In new system: Single-pass only, no nested resolution
      const context: PathContext = {
        'bundle-root': testBundleRoot,
        'core-root': coreRoot,
        'project-root': projectRoot,
        'custom-var': '{bundle-root}/workflows', // Contains a variable
      };

      const result = resolvePath('{custom-var}/intake.yaml', context);

      // Result will still contain the literal string "{bundle-root}"
      // because we only do single-pass resolution
      expect(result).toContain('{bundle-root}/workflows/intake.yaml');
    });
  });

  describe('Path Normalization', () => {
    it('should normalize paths with extra slashes', () => {
      const context = createPathContext('test-bundle');
      const result = resolvePath('{bundle-root}//workflows///test.yaml', context);

      // Should normalize multiple slashes to single slash
      expect(result).not.toContain('//');
      expect(result).toBe(resolve(testBundleRoot, 'workflows/test.yaml'));
    });

    it('should resolve relative path segments correctly', () => {
      const context = createPathContext('test-bundle');
      const result = resolvePath('{bundle-root}/workflows/./test.yaml', context);

      // Should resolve . to current directory
      expect(result).toBe(resolve(testBundleRoot, 'workflows/test.yaml'));
    });
  });
});
