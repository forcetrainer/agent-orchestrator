/**
 * Path Variable Resolution System Tests
 *
 * Minimal high-value tests:
 * - Resolve path variables (critical path)
 * - Resolve config variables with nesting (business logic)
 * - Detect circular references (edge case)
 * - Enforce max iteration limit (security)
 *
 * Note: Security tests (path traversal, etc.) are in pathResolver.security.test.ts
 */

import {
  resolvePath,
  createPathContext,
  type PathContext,
} from '@/lib/pathResolver';
import { resolve } from 'path';

describe('pathResolver', () => {
  const projectRoot = process.cwd();
  const testBundleRoot = resolve(projectRoot, 'bmad/custom/bundles/test-bundle');
  const coreRoot = resolve(projectRoot, 'bmad/core');

  it('should resolve all path variables correctly', () => {
    const context = createPathContext('test-bundle');

    const bundleResult = resolvePath('{bundle-root}/workflows/test.yaml', context);
    expect(bundleResult).toBe(resolve(testBundleRoot, 'workflows/test.yaml'));

    const coreResult = resolvePath('{core-root}/tasks/workflow.md', context);
    expect(coreResult).toBe(resolve(coreRoot, 'tasks/workflow.md'));

    const projectResult = resolvePath('{project-root}/output/test.md', context);
    expect(projectResult).toBe(resolve(projectRoot, 'output/test.md'));
  });

  it('should resolve config variables with nested path variables', () => {
    const context = createPathContext('test-bundle', {
      base_path: '{project-root}/docs',
      reports_path: '{config_source}:base_path/reports',
    });

    const result = resolvePath('{config_source}:reports_path/{date}/report.md', context);

    expect(result).toContain(resolve(projectRoot, 'docs/reports'));
    expect(result).toMatch(/\d{4}-\d{2}-\d{2}/); // Date pattern
  });

  it('should detect circular variable references', () => {
    const context = createPathContext('test-bundle', {
      var1: '{config_source}:var2',
      var2: '{config_source}:var1',
    });

    expect(() => {
      resolvePath('{config_source}:var1/test.md', context);
    }).toThrow('Circular variable reference detected');
  });

  it('should enforce max iteration limit to prevent infinite loops', () => {
    // Create a config with 12 levels of nesting (exceeds MAX_RESOLUTION_ITERATIONS = 10)
    const context = createPathContext('test-bundle', {
      v1: '{config_source}:v2',
      v2: '{config_source}:v3',
      v3: '{config_source}:v4',
      v4: '{config_source}:v5',
      v5: '{config_source}:v6',
      v6: '{config_source}:v7',
      v7: '{config_source}:v8',
      v8: '{config_source}:v9',
      v9: '{config_source}:v10',
      v10: '{config_source}:v11',
      v11: '{config_source}:v12',
      v12: '/final/path',
    });

    expect(() => {
      resolvePath('{config_source}:v1', context);
    }).toThrow('Maximum resolution iterations');
  });
});
