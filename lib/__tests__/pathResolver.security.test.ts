/**
 * Path Resolver Security Tests
 *
 * Story 5.1: Comprehensive security validation for write path restrictions
 *
 * Tests that validateWritePath ONLY allows writes to /data/agent-outputs
 * and blocks ALL other paths including source code directories.
 */

import { validateWritePath, createPathContext } from '@/lib/pathResolver';
import { resolve } from 'path';
import { env } from '@/lib/utils/env';

describe('validateWritePath - Story 5.1 Security', () => {
  let context: ReturnType<typeof createPathContext>;

  beforeEach(() => {
    context = createPathContext('test-bundle');
  });

  describe('✅ Allowed Writes (ONLY /data/agent-outputs)', () => {
    it('should allow write to /data/agent-outputs root', () => {
      const agentOutputsPath = resolve(env.PROJECT_ROOT, 'data/agent-outputs');
      expect(() => validateWritePath(agentOutputsPath, context)).not.toThrow();
    });

    it('should allow write to /data/agent-outputs/session-123/file.txt', () => {
      const sessionPath = resolve(env.PROJECT_ROOT, 'data/agent-outputs/session-123/file.txt');
      expect(() => validateWritePath(sessionPath, context)).not.toThrow();
    });

    it('should allow write to /data/agent-outputs/nested/deep/path/output.json', () => {
      const nestedPath = resolve(env.PROJECT_ROOT, 'data/agent-outputs/nested/deep/path/output.json');
      expect(() => validateWritePath(nestedPath, context)).not.toThrow();
    });
  });

  describe('❌ Blocked Writes (Source Code Directories)', () => {
    it('should block write to /agents directory', () => {
      const agentsPath = resolve(env.PROJECT_ROOT, 'agents/custom-agent/config.yaml');
      expect(() => validateWritePath(agentsPath, context)).toThrow('Security violation');
    });

    it('should block write to /bmad directory', () => {
      const bmadPath = resolve(env.PROJECT_ROOT, 'bmad/core/workflow.yaml');
      expect(() => validateWritePath(bmadPath, context)).toThrow('Security violation');
    });

    it('should block write to /lib directory', () => {
      const libPath = resolve(env.PROJECT_ROOT, 'lib/malicious.ts');
      expect(() => validateWritePath(libPath, context)).toThrow('Security violation');
    });

    it('should block write to /app directory', () => {
      const appPath = resolve(env.PROJECT_ROOT, 'app/page.tsx');
      expect(() => validateWritePath(appPath, context)).toThrow('Security violation');
    });

    it('should block write to /docs directory', () => {
      const docsPath = resolve(env.PROJECT_ROOT, 'docs/malicious.md');
      expect(() => validateWritePath(docsPath, context)).toThrow('Security violation');
    });

    it('should block write to /components directory', () => {
      const componentsPath = resolve(env.PROJECT_ROOT, 'components/Backdoor.tsx');
      expect(() => validateWritePath(componentsPath, context)).toThrow('Security violation');
    });
  });

  describe('❌ Blocked Writes (Path Traversal)', () => {
    it('should block path traversal from agent-outputs to project root', () => {
      const traversalPath = resolve(env.PROJECT_ROOT, 'data/agent-outputs/../../../etc/passwd');
      expect(() => validateWritePath(traversalPath, context)).toThrow('Security violation');
    });

    it('should block path traversal to /etc/passwd', () => {
      const etcPath = '/etc/passwd';
      expect(() => validateWritePath(etcPath, context)).toThrow('Security violation');
    });

    it('should block path traversal to /tmp', () => {
      const tmpPath = '/tmp/malicious.sh';
      expect(() => validateWritePath(tmpPath, context)).toThrow('Security violation');
    });

    it('should block relative path traversal ../../lib/exploit.ts', () => {
      const relativePath = resolve(env.PROJECT_ROOT, 'data/agent-outputs/../../lib/exploit.ts');
      expect(() => validateWritePath(relativePath, context)).toThrow('Security violation');
    });
  });

  describe('❌ Blocked Writes (Other Data Directories)', () => {
    it('should block write to /data root (not agent-outputs)', () => {
      const dataPath = resolve(env.PROJECT_ROOT, 'data/sensitive.json');
      expect(() => validateWritePath(dataPath, context)).toThrow('Security violation');
    });

    it('should block write to /data/logs (sibling of agent-outputs)', () => {
      const logsPath = resolve(env.PROJECT_ROOT, 'data/logs/system.log');
      expect(() => validateWritePath(logsPath, context)).toThrow('Security violation');
    });

    it('should block write to /public directory', () => {
      const publicPath = resolve(env.PROJECT_ROOT, 'public/malicious.html');
      expect(() => validateWritePath(publicPath, context)).toThrow('Security violation');
    });
  });

  describe('❌ Blocked Writes (Project Configuration)', () => {
    it('should block write to package.json', () => {
      const packagePath = resolve(env.PROJECT_ROOT, 'package.json');
      expect(() => validateWritePath(packagePath, context)).toThrow('Security violation');
    });

    it('should block write to .env files', () => {
      const envPath = resolve(env.PROJECT_ROOT, '.env');
      expect(() => validateWritePath(envPath, context)).toThrow('Security violation');
    });

    it('should block write to tsconfig.json', () => {
      const tsconfigPath = resolve(env.PROJECT_ROOT, 'tsconfig.json');
      expect(() => validateWritePath(tsconfigPath, context)).toThrow('Security violation');
    });

    it('should block write to next.config.js', () => {
      const nextConfigPath = resolve(env.PROJECT_ROOT, 'next.config.js');
      expect(() => validateWritePath(nextConfigPath, context)).toThrow('Security violation');
    });
  });

  describe('❌ Blocked Writes (Hidden Directories)', () => {
    it('should block write to /.git directory', () => {
      const gitPath = resolve(env.PROJECT_ROOT, '.git/config');
      expect(() => validateWritePath(gitPath, context)).toThrow('Security violation');
    });

    it('should block write to /.github workflows', () => {
      const githubPath = resolve(env.PROJECT_ROOT, '.github/workflows/malicious.yml');
      expect(() => validateWritePath(githubPath, context)).toThrow('Security violation');
    });

    it('should block write to /node_modules', () => {
      const nodeModulesPath = resolve(env.PROJECT_ROOT, 'node_modules/malicious-package/index.js');
      expect(() => validateWritePath(nodeModulesPath, context)).toThrow('Security violation');
    });
  });

  describe('Edge Cases', () => {
    it('should block write to agent-outputs lookalike: /data/agent-outputs-fake', () => {
      const fakePath = resolve(env.PROJECT_ROOT, 'data/agent-outputs-fake/file.txt');
      expect(() => validateWritePath(fakePath, context)).toThrow('Security violation');
    });

    it('should block write with similar prefix: /data/agent-out/file.txt', () => {
      const similarPath = resolve(env.PROJECT_ROOT, 'data/agent-out/file.txt');
      expect(() => validateWritePath(similarPath, context)).toThrow('Security violation');
    });

    it('should allow write to properly formed session path with special chars', () => {
      const sessionPath = resolve(env.PROJECT_ROOT, 'data/agent-outputs/session-abc-123_test/output.json');
      expect(() => validateWritePath(sessionPath, context)).not.toThrow();
    });
  });
});
