/**
 * Tests for Chat Session Management
 *
 * Covers:
 * - Session creation
 * - Message count increment
 * - Session finalization
 * - Abandoned session cleanup
 */

import { createChatSession, incrementMessageCount, finalizeChatSession, cleanupAbandonedSessions } from '../chatSessions';
import { writeFile, mkdir, readFile, readdir, rm } from 'fs/promises';
import { resolve, join } from 'path';
import { env } from '@/lib/utils/env';

// Mock fs/promises
jest.mock('fs/promises');
jest.mock('crypto', () => ({
  randomUUID: jest.fn(() => 'test-uuid-123'),
}));

const mockWriteFile = writeFile as jest.MockedFunction<typeof writeFile>;
const mockMkdir = mkdir as jest.MockedFunction<typeof mkdir>;
const mockReadFile = readFile as jest.MockedFunction<typeof readFile>;
const mockReaddir = readdir as jest.MockedFunction<typeof readdir>;
const mockRm = rm as jest.MockedFunction<typeof rm>;

describe('Chat Session Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('cleanupAbandonedSessions', () => {
    it('should remove abandoned sessions older than 1 hour with no outputs', async () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

      const abandonedManifest = JSON.stringify({
        version: '1.0.0',
        session_id: 'abandoned-1',
        agent: { name: 'alex', title: 'Alex', bundle: 'chat' },
        workflow: { name: 'chat', description: 'Chat' },
        execution: {
          started_at: twoHoursAgo,
          status: 'running',
          user: 'Bryan',
        },
        outputs: [],
      });

      mockReaddir.mockResolvedValueOnce(['abandoned-1', 'active-session'] as any);

      // First session - abandoned
      mockReadFile.mockResolvedValueOnce(abandonedManifest);
      mockReaddir.mockResolvedValueOnce(['manifest.json'] as any);

      const cleanedCount = await cleanupAbandonedSessions('Bryan');

      expect(cleanedCount).toBe(1);
      expect(mockRm).toHaveBeenCalledWith(
        expect.stringContaining('abandoned-1'),
        { recursive: true, force: true }
      );
    });

    it('should NOT remove sessions less than 1 hour old', async () => {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

      const recentManifest = JSON.stringify({
        version: '1.0.0',
        session_id: 'recent-1',
        agent: { name: 'alex', title: 'Alex', bundle: 'chat' },
        workflow: { name: 'chat', description: 'Chat' },
        execution: {
          started_at: thirtyMinutesAgo,
          status: 'running',
          user: 'Bryan',
        },
        outputs: [],
      });

      mockReaddir.mockResolvedValueOnce(['recent-1'] as any);
      mockReadFile.mockResolvedValueOnce(recentManifest);

      const cleanedCount = await cleanupAbandonedSessions('Bryan');

      expect(cleanedCount).toBe(0);
      expect(mockRm).not.toHaveBeenCalled();
    });

    it('should NOT remove sessions with output files', async () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

      const sessionWithOutputs = JSON.stringify({
        version: '1.0.0',
        session_id: 'has-outputs',
        agent: { name: 'alex', title: 'Alex', bundle: 'chat' },
        workflow: { name: 'chat', description: 'Chat' },
        execution: {
          started_at: twoHoursAgo,
          status: 'running',
          user: 'Bryan',
        },
        outputs: [],
      });

      mockReaddir.mockResolvedValueOnce(['has-outputs'] as any);
      mockReadFile.mockResolvedValueOnce(sessionWithOutputs);
      // Session has additional files
      mockReaddir.mockResolvedValueOnce(['manifest.json', 'output.md'] as any);

      const cleanedCount = await cleanupAbandonedSessions('Bryan');

      expect(cleanedCount).toBe(0);
      expect(mockRm).not.toHaveBeenCalled();
    });

    it('should NOT remove completed sessions', async () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

      const completedManifest = JSON.stringify({
        version: '1.0.0',
        session_id: 'completed-1',
        agent: { name: 'alex', title: 'Alex', bundle: 'chat' },
        workflow: { name: 'chat', description: 'Chat' },
        execution: {
          started_at: twoHoursAgo,
          completed_at: new Date().toISOString(),
          status: 'completed',
          user: 'Bryan',
        },
        outputs: [],
      });

      mockReaddir.mockResolvedValueOnce(['completed-1'] as any);
      mockReadFile.mockResolvedValueOnce(completedManifest);

      const cleanedCount = await cleanupAbandonedSessions('Bryan');

      expect(cleanedCount).toBe(0);
      expect(mockRm).not.toHaveBeenCalled();
    });

    it('should NOT remove sessions belonging to other users', async () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

      const otherUserManifest = JSON.stringify({
        version: '1.0.0',
        session_id: 'other-user-1',
        agent: { name: 'alex', title: 'Alex', bundle: 'chat' },
        workflow: { name: 'chat', description: 'Chat' },
        execution: {
          started_at: twoHoursAgo,
          status: 'running',
          user: 'Alice',
        },
        outputs: [],
      });

      mockReaddir.mockResolvedValueOnce(['other-user-1'] as any);
      mockReadFile.mockResolvedValueOnce(otherUserManifest);
      // Don't mock the second readdir - it won't be called since session is skipped

      const cleanedCount = await cleanupAbandonedSessions('Bryan');

      expect(cleanedCount).toBe(0);
      expect(mockRm).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully and continue processing', async () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

      const validManifest = JSON.stringify({
        version: '1.0.0',
        session_id: 'valid-1',
        agent: { name: 'alex', title: 'Alex', bundle: 'chat' },
        workflow: { name: 'chat', description: 'Chat' },
        execution: {
          started_at: twoHoursAgo,
          status: 'running',
          user: 'Bryan',
        },
        outputs: [],
      });

      // Mock sequence:
      // 1. readdir for session list → ['corrupted-1', 'valid-1']
      // 2. readFile for corrupted-1 manifest → Error
      // 3. readFile for valid-1 manifest → Success
      // 4. readdir for files in valid-1 folder → ['manifest.json']
      // 5. rm for valid-1 folder → Success

      mockReaddir.mockResolvedValueOnce(['corrupted-1', 'valid-1'] as any);
      mockReadFile.mockRejectedValueOnce(new Error('Corrupted file'));
      mockReadFile.mockResolvedValueOnce(validManifest);
      mockReaddir.mockResolvedValueOnce(['manifest.json'] as any);
      mockRm.mockResolvedValueOnce(undefined);

      const cleanedCount = await cleanupAbandonedSessions('Bryan');

      expect(cleanedCount).toBe(1);
      expect(mockRm).toHaveBeenCalledTimes(1);
      expect(mockRm).toHaveBeenCalledWith(
        expect.stringContaining('valid-1'),
        { recursive: true, force: true }
      );
    });
  });
});
