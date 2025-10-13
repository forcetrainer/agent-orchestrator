/**
 * Path Resolver Security Tests
 *
 * Story 10.0: Updated for conversations directory migration
 * Story 5.1: Comprehensive security validation for write path restrictions
 *
 * Tests that validateWritePath ONLY allows writes to /data/conversations
 * and blocks ALL other paths including deprecated /data/agent-outputs.
 */

import { validateWritePath, createPathContext } from '@/lib/pathResolver';
import { resolve } from 'path';
import { env } from '@/lib/utils/env';

describe('validateWritePath - Story 5.1 Security', () => {
  let context: ReturnType<typeof createPathContext>;

  beforeEach(() => {
    context = createPathContext('test-bundle');
  });

  describe('✅ Allowed Writes (ONLY /data/conversations) - Story 10.0', () => {
    it('should allow write to /data/conversations root', () => {
      const conversationsPath = resolve(env.PROJECT_ROOT, 'data/conversations');
      expect(() => validateWritePath(conversationsPath, context)).not.toThrow();
    });

    it('should allow write to /data/conversations/session-123/file.txt', () => {
      const sessionPath = resolve(env.PROJECT_ROOT, 'data/conversations/session-123/file.txt');
      expect(() => validateWritePath(sessionPath, context)).not.toThrow();
    });

    it('should allow write to /data/conversations/abc-123/conversation.json', () => {
      const conversationPath = resolve(env.PROJECT_ROOT, 'data/conversations/abc-123/conversation.json');
      expect(() => validateWritePath(conversationPath, context)).not.toThrow();
    });

    it('should allow write to /data/conversations/nested/deep/path/output.json', () => {
      const nestedPath = resolve(env.PROJECT_ROOT, 'data/conversations/nested/deep/path/output.json');
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
    it('should block path traversal from conversations to project root', () => {
      const traversalPath = resolve(env.PROJECT_ROOT, 'data/conversations/../../../etc/passwd');
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
      const relativePath = resolve(env.PROJECT_ROOT, 'data/conversations/../../lib/exploit.ts');
      expect(() => validateWritePath(relativePath, context)).toThrow('Security violation');
    });
  });

  describe('❌ Blocked Writes (Deprecated agent-outputs path) - Story 10.0', () => {
    it('should block write to deprecated /data/agent-outputs root', () => {
      const agentOutputsPath = resolve(env.PROJECT_ROOT, 'data/agent-outputs');
      expect(() => validateWritePath(agentOutputsPath, context)).toThrow('deprecated');
    });

    it('should block write to deprecated /data/agent-outputs/session-123/file.txt', () => {
      const sessionPath = resolve(env.PROJECT_ROOT, 'data/agent-outputs/session-123/file.txt');
      expect(() => validateWritePath(sessionPath, context)).toThrow('deprecated');
    });
  });

  describe('❌ Blocked Writes (Other Data Directories)', () => {
    it('should block write to /data root (not conversations)', () => {
      const dataPath = resolve(env.PROJECT_ROOT, 'data/sensitive.json');
      expect(() => validateWritePath(dataPath, context)).toThrow('Security violation');
    });

    it('should block write to /data/logs (sibling of conversations)', () => {
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
    it('should block write to conversations lookalike: /data/conversations-fake', () => {
      const fakePath = resolve(env.PROJECT_ROOT, 'data/conversations-fake/file.txt');
      expect(() => validateWritePath(fakePath, context)).toThrow('Security violation');
    });

    it('should block write with similar prefix: /data/convers/file.txt', () => {
      const similarPath = resolve(env.PROJECT_ROOT, 'data/convers/file.txt');
      expect(() => validateWritePath(similarPath, context)).toThrow('Security violation');
    });

    it('should allow write to properly formed conversation path with special chars', () => {
      const sessionPath = resolve(env.PROJECT_ROOT, 'data/conversations/session-abc-123_test/output.json');
      expect(() => validateWritePath(sessionPath, context)).not.toThrow();
    });

    it('should allow write to conversation.json in session folder', () => {
      const conversationJsonPath = resolve(env.PROJECT_ROOT, 'data/conversations/abc-123-def/conversation.json');
      expect(() => validateWritePath(conversationJsonPath, context)).not.toThrow();
    });
  });
});
