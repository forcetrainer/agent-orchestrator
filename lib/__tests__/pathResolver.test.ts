/**
 * Unit Tests for Path Variable Resolution System
 *
 * Tests cover:
 * - Path variables ({bundle-root}, {core-root}, {project-root})
 * - Config variables ({config_source}:variable_name)
 * - System variables ({date}, {user_name})
 * - Nested variable resolution
 * - Security validation (path traversal, out-of-bounds paths)
 * - Error handling (undefined variables, circular references)
 */

import {
  resolvePath,
  createPathContext,
  loadBundleConfig,
  validatePathSecurity,
  clearConfigCache,
  type PathContext,
} from '@/lib/pathResolver';
import { resolve } from 'path';
import { writeFile, mkdir, rm, symlink } from 'fs/promises';

describe('pathResolver', () => {
  const projectRoot = process.cwd();
  const testBundleRoot = resolve(projectRoot, 'bmad/custom/bundles/test-bundle');
  const coreRoot = resolve(projectRoot, 'bmad/core');

  describe('createPathContext', () => {
    it('should create PathContext with correct directory paths', () => {
      const context = createPathContext('test-bundle');

      expect(context.bundleRoot).toBe(testBundleRoot);
      expect(context.coreRoot).toBe(coreRoot);
      expect(context.projectRoot).toBe(projectRoot);
      expect(context.bundleConfig).toBeUndefined();
    });

    it('should include bundleConfig if provided', () => {
      const config = { output_folder: '/custom/output' };
      const context = createPathContext('test-bundle', config);

      expect(context.bundleConfig).toEqual(config);
    });
  });

  describe('Path Variables (AC-4.2.1, AC-4.2.2, AC-4.2.3)', () => {
    let context: PathContext;

    beforeEach(() => {
      context = createPathContext('test-bundle');
    });

    it('should resolve {bundle-root} to bundle directory (AC-4.2.1)', () => {
      const result = resolvePath('{bundle-root}/workflows/test.yaml', context);

      expect(result).toBe(resolve(testBundleRoot, 'workflows/test.yaml'));
    });

    it('should resolve {core-root} to bmad/core (AC-4.2.2)', () => {
      const result = resolvePath('{core-root}/tasks/workflow.md', context);

      expect(result).toBe(resolve(coreRoot, 'tasks/workflow.md'));
    });

    it('should resolve {project-root} to application root (AC-4.2.3)', () => {
      const result = resolvePath('{project-root}/output/test.md', context);

      expect(result).toBe(resolve(projectRoot, 'output/test.md'));
    });

    it('should resolve multiple path variables in single path', () => {
      const context1 = createPathContext('bundle1');
      const context2 = createPathContext('bundle2');

      const result1 = resolvePath('{bundle-root}/workflows/test.yaml', context1);
      const result2 = resolvePath('{bundle-root}/workflows/test.yaml', context2);

      // Same template but different contexts = different results
      expect(result1).not.toBe(result2);
      expect(result1).toContain('bundle1');
      expect(result2).toContain('bundle2');
    });

    it('should resolve path variables with subdirectories', () => {
      const result = resolvePath(
        '{bundle-root}/workflows/intake/phase1/step.md',
        context
      );

      expect(result).toBe(
        resolve(testBundleRoot, 'workflows/intake/phase1/step.md')
      );
    });
  });

  describe('Config Variables (AC-4.2.4)', () => {
    it('should resolve {config_source}:variable from bundleConfig', () => {
      const context = createPathContext('test-bundle', {
        output_folder: '{project-root}/custom/output',
      });

      const result = resolvePath('{config_source}:output_folder/test.md', context);

      expect(result).toBe(resolve(projectRoot, 'custom/output/test.md'));
    });

    it('should throw error when config variable not found', () => {
      const context = createPathContext('test-bundle', {
        some_var: 'value',
      });

      expect(() => {
        resolvePath('{config_source}:missing_var/test.md', context);
      }).toThrow('Config variable not found: missing_var');
    });

    it('should throw error when bundleConfig is undefined', () => {
      const context = createPathContext('test-bundle');

      expect(() => {
        resolvePath('{config_source}:output_folder/test.md', context);
      }).toThrow('Config variable not found: output_folder');
    });

    it('should combine config variable with path variables', () => {
      const context = createPathContext('test-bundle', {
        subfolder: 'reports',
      });

      const result = resolvePath(
        '{bundle-root}/{config_source}:subfolder/report.md',
        context
      );

      expect(result).toBe(resolve(testBundleRoot, 'reports/report.md'));
    });
  });

  describe('System Variables (AC-4.2.5)', () => {
    it('should resolve {date} to YYYY-MM-DD format', () => {
      const context = createPathContext('test-bundle');
      const result = resolvePath('{project-root}/output/{date}/report.md', context);

      // Verify format: YYYY-MM-DD
      const datePattern = /\/\d{4}-\d{2}-\d{2}\//;
      expect(result).toMatch(datePattern);
    });

    it('should resolve {user_name} from bundleConfig', () => {
      const context = createPathContext('test-bundle', {
        user_name: 'TestUser',
      });

      const result = resolvePath('{project-root}/users/{user_name}/file.md', context);

      expect(result).toContain('/users/TestUser/');
    });

    it('should resolve {user_name} from environment if not in config', () => {
      const context = createPathContext('test-bundle');
      const result = resolvePath('{project-root}/users/{user_name}/file.md', context);

      // Should use process.env.USER or default to 'user' (may include dots in username)
      expect(result).toMatch(/\/users\/[\w.-]+\/file\.md$/);
    });
  });

  describe('Nested Variable Resolution (AC-4.2.5)', () => {
    it('should resolve nested variables (config value contains path variable)', () => {
      const context = createPathContext('test-bundle', {
        output_folder: '{project-root}/output',
      });

      const result = resolvePath('{config_source}:output_folder/test.md', context);

      expect(result).toBe(resolve(projectRoot, 'output/test.md'));
    });

    it('should resolve multiple levels of nesting', () => {
      const context = createPathContext('test-bundle', {
        base_path: '{project-root}/docs',
        reports_path: '{config_source}:base_path/reports',
      });

      const result = resolvePath('{config_source}:reports_path/{date}/report.md', context);

      expect(result).toContain(resolve(projectRoot, 'docs/reports'));
      expect(result).toMatch(/\d{4}-\d{2}-\d{2}/);
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

    it('should enforce max iteration limit', () => {
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

  describe('Security Validation (AC-4.2.7)', () => {
    let context: PathContext;

    beforeEach(() => {
      context = createPathContext('test-bundle');
    });

    it('should block path traversal attempts with ../', () => {
      expect(() => {
        resolvePath('{bundle-root}/../../etc/passwd', context);
      }).toThrow('Security violation');
    });

    it('should block absolute paths outside allowed directories', () => {
      expect(() => {
        validatePathSecurity('/etc/passwd', context);
      }).toThrow('Security violation: Access denied');
    });

    it('should block paths with null bytes', () => {
      expect(() => {
        validatePathSecurity('/valid/path\0/../../etc/passwd', context);
      }).toThrow('Security violation');
    });

    it('should allow paths within bundleRoot', () => {
      const validPath = resolve(testBundleRoot, 'workflows/test.yaml');

      expect(() => {
        validatePathSecurity(validPath, context);
      }).not.toThrow();
    });

    it('should allow paths within coreRoot', () => {
      const validPath = resolve(coreRoot, 'tasks/workflow.md');

      expect(() => {
        validatePathSecurity(validPath, context);
      }).not.toThrow();
    });

    it('should allow paths within projectRoot', () => {
      const validPath = resolve(projectRoot, 'output/test.md');

      expect(() => {
        validatePathSecurity(validPath, context);
      }).not.toThrow();
    });

    it('should block symbolic links that escape allowed directories', async () => {
      // Create a temp directory OUTSIDE projectRoot for testing symlinks
      const tempDir = '/tmp/pathresolver-symlink-test-outside';
      const linkPath = resolve(testBundleRoot, 'malicious-link');

      try {
        await mkdir(tempDir, { recursive: true });
        await mkdir(testBundleRoot, { recursive: true });

        // Create a symlink from bundle to outside directory
        await symlink(tempDir, linkPath, 'dir');

        // Validation should fail - symlink target is outside allowed dirs (projectRoot)
        expect(() => {
          validatePathSecurity(linkPath, context);
        }).toThrow('Security violation: Access denied');
      } finally {
        // Cleanup
        await rm(linkPath, { force: true });
        await rm(tempDir, { recursive: true, force: true });
      }
    });

    it('should allow symbolic links that stay within allowed directories', async () => {
      // Create symlink within bundle that points to another location in bundle
      const targetDir = resolve(testBundleRoot, 'workflows');
      const linkPath = resolve(testBundleRoot, 'workflow-link');

      try {
        await mkdir(targetDir, { recursive: true });
        await symlink(targetDir, linkPath, 'dir');

        // Validation should succeed - symlink target is within bundleRoot
        expect(() => {
          validatePathSecurity(linkPath, context);
        }).not.toThrow();
      } finally {
        // Cleanup
        await rm(linkPath, { force: true });
        await rm(targetDir, { recursive: true, force: true });
      }
    });

    it('should handle non-existent paths (for files to be created)', () => {
      const nonExistentPath = resolve(testBundleRoot, 'new-file.yaml');

      // Should not throw - allows validation of paths for new files
      expect(() => {
        validatePathSecurity(nonExistentPath, context);
      }).not.toThrow();
    });
  });

  describe('Error Handling (AC-4.2.7)', () => {
    it('should throw clear error for undefined path variables', () => {
      const context = createPathContext('test-bundle');

      expect(() => {
        resolvePath('{undefined-variable}/test.md', context);
      }).toThrow('Unable to resolve variables in path');
    });

    it('should include variable context in error messages', () => {
      const context = createPathContext('test-bundle', {
        var1: 'value1',
      });

      try {
        resolvePath('{config_source}:missing_var/test.md', context);
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).toContain('missing_var');
        expect(error.message).toContain('var1'); // Shows available variables
      }
    });

    it('should provide helpful error for typos in variable names', () => {
      const context = createPathContext('test-bundle');

      expect(() => {
        resolvePath('{projecct-root}/test.md', context); // Typo: projecct
      }).toThrow('Unable to resolve variables in path');
    });
  });

  describe('loadBundleConfig', () => {
    const tempBundleRoot = resolve(projectRoot, 'temp-test-bundle');
    const configPath = resolve(tempBundleRoot, 'config.yaml');

    beforeEach(async () => {
      // Clear cache before each test
      clearConfigCache();
      // Create temp directory for testing
      await mkdir(tempBundleRoot, { recursive: true });
    });

    afterEach(async () => {
      // Clean up temp directory
      await rm(tempBundleRoot, { recursive: true, force: true });
    });

    it('should load and parse config.yaml', async () => {
      const yamlContent = `
project_name: Test Project
output_folder: /custom/output
user_name: TestUser
`;
      await writeFile(configPath, yamlContent, 'utf-8');

      const config = await loadBundleConfig(tempBundleRoot);

      expect(config).toEqual({
        project_name: 'Test Project',
        output_folder: '/custom/output',
        user_name: 'TestUser',
      });
    });

    it('should return empty object when config.yaml does not exist', async () => {
      const config = await loadBundleConfig(tempBundleRoot);

      expect(config).toEqual({});
    });

    it('should cache parsed config to avoid repeated reads', async () => {
      const yamlContent = 'project_name: Test\n';
      await writeFile(configPath, yamlContent, 'utf-8');

      const config1 = await loadBundleConfig(tempBundleRoot);
      const config2 = await loadBundleConfig(tempBundleRoot);

      // Should return same object (cached)
      expect(config1).toBe(config2);
    });

    it('should throw error for invalid YAML syntax', async () => {
      const invalidYaml = 'invalid: yaml: syntax: :\n  - bad:\nindent';
      await writeFile(configPath, invalidYaml, 'utf-8');

      await expect(loadBundleConfig(tempBundleRoot)).rejects.toThrow(
        'Failed to load bundle config'
      );
    });
  });

  describe('Resolution Order (AC-4.2.5, AC-4.2.6)', () => {
    it('should resolve in order: config → system → path', () => {
      const context = createPathContext('test-bundle', {
        output_base: '{project-root}/output',
        report_path: '{config_source}:output_base/{date}',
      });

      const result = resolvePath('{config_source}:report_path/report.md', context);

      // Should resolve: config var → project-root → date → normalize
      expect(result).toContain(resolve(projectRoot, 'output'));
      expect(result).toMatch(/\d{4}-\d{2}-\d{2}/);
    });

    it('should support config variables referencing system variables', () => {
      const context = createPathContext('test-bundle', {
        daily_folder: '/reports/{date}',
      });

      const result = resolvePath(
        '{project-root}{config_source}:daily_folder/report.md',
        context
      );

      expect(result).toMatch(/\/reports\/\d{4}-\d{2}-\d{2}\/report\.md$/);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle realistic agent workflow path', () => {
      const context = createPathContext('requirements-workflow', {
        workflow_name: 'intake',
      });

      const result = resolvePath(
        '{bundle-root}/workflows/{config_source}:workflow_name/workflow.yaml',
        context
      );

      expect(result).toBe(
        resolve(
          projectRoot,
          'bmad/custom/bundles/requirements-workflow/workflows/intake/workflow.yaml'
        )
      );
    });

    it('should handle output file paths with date stamps', () => {
      const context = createPathContext('test-bundle', {
        output_folder: '{project-root}/docs/output',
      });

      const result = resolvePath(
        '{config_source}:output_folder/{date}/story-4.2.md',
        context
      );

      expect(result).toContain(resolve(projectRoot, 'docs/output'));
      expect(result).toMatch(/\d{4}-\d{2}-\d{2}/);
      expect(result).toContain('story-4.2.md');
    });

    it('should handle core task references', () => {
      const context = createPathContext('test-bundle');

      const result = resolvePath('{core-root}/tasks/workflow.md', context);

      expect(result).toBe(resolve(coreRoot, 'tasks/workflow.md'));
    });
  });

  describe('Core Root Path Security (AC-4.11.2, AC-4.11.5)', () => {
    let context: PathContext;

    beforeEach(() => {
      context = createPathContext('test-bundle');
    });

    it('should resolve {core-root} to correct path (AC-4.11.2)', () => {
      const result = resolvePath('{core-root}/tasks/workflow.md', context);

      expect(result).toBe(resolve(coreRoot, 'tasks/workflow.md'));
      expect(result).toContain('bmad/core/tasks/workflow.md');
    });

    it('should block path traversal from core-root (AC-4.11.5)', () => {
      expect(() => {
        resolvePath('{core-root}/../../../etc/passwd', context);
      }).toThrow('Security violation');
    });

    it('should block path traversal using .. segments (AC-4.11.5)', () => {
      expect(() => {
        resolvePath('{core-root}/tasks/../../bmad/custom/bundles/evil/config.yaml', context);
      }).toThrow('Security violation');
    });

    it('should allow nested paths within core-root', () => {
      const result = resolvePath('{core-root}/workflows/test/deep/nested/file.md', context);

      expect(result).toBe(resolve(coreRoot, 'workflows/test/deep/nested/file.md'));
      expect(() => {
        validatePathSecurity(result, context);
      }).not.toThrow();
    });

    it('should validate core-root paths are within coreRoot directory', () => {
      const validCorePath = resolve(coreRoot, 'tasks/workflow.md');

      expect(() => {
        validatePathSecurity(validCorePath, context);
      }).not.toThrow();
    });
  });
});
