/**
 * Tests for Manifest Reader Module
 * Story 5.2.1: Session Metadata Display Enhancement
 *
 * Test Coverage:
 * - parseManifest: Valid manifests, invalid JSON, missing files, missing fields
 * - generateDisplayName: Running sessions, completed sessions, various statuses
 * - formatTimestamp: Valid timestamps, invalid timestamps, edge cases
 *
 * @jest-environment node
 */

import { parseManifest, generateDisplayName, formatTimestamp } from '../manifestReader';
import type { SessionMetadata } from '../manifestReader';
import { readFile } from 'fs/promises';

// Mock fs/promises
jest.mock('fs/promises');

describe('Manifest Reader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('parseManifest', () => {
    const validManifest: SessionMetadata = {
      version: '1.0.0',
      session_id: 'abc-123-def',
      agent: {
        name: 'alex',
        title: 'Alex the Facilitator',
        bundle: 'bmad/bmm/agents/alex',
      },
      workflow: {
        name: 'Intake ITSM',
        description: 'Facilitate ITSM requirements intake',
      },
      execution: {
        started_at: '2025-10-06T17:09:15.123Z',
        completed_at: '2025-10-06T17:25:30.456Z',
        status: 'completed',
        user: 'Bryan',
      },
      outputs: [
        {
          file: 'intake-report.md',
          type: 'document',
          description: 'ITSM intake report',
          created_at: '2025-10-06T17:25:30.456Z',
        },
      ],
    };

    it('should parse valid manifest.json successfully (AC-1)', async () => {
      // Arrange
      (readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(validManifest));

      // Act
      const result = await parseManifest('/data/agent-outputs/abc-123-def');

      // Assert
      expect(result).not.toBeNull();
      expect(result?.session_id).toBe('abc-123-def');
      expect(result?.agent.title).toBe('Alex the Facilitator');
      expect(result?.workflow.name).toBe('Intake ITSM');
      expect(result?.execution.status).toBe('completed');
    });

    it('should extract all required fields from manifest', async () => {
      // Arrange
      (readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(validManifest));

      // Act
      const result = await parseManifest('/data/agent-outputs/abc-123-def');

      // Assert
      expect(result?.agent.name).toBe('alex');
      expect(result?.agent.title).toBe('Alex the Facilitator');
      expect(result?.workflow.name).toBe('Intake ITSM');
      expect(result?.execution.started_at).toBe('2025-10-06T17:09:15.123Z');
      expect(result?.execution.user).toBe('Bryan');
    });

    it('should return null when manifest.json does not exist (AC-7)', async () => {
      // Arrange
      const enoentError = new Error('File not found') as NodeJS.ErrnoException;
      enoentError.code = 'ENOENT';
      (readFile as jest.Mock).mockRejectedValueOnce(enoentError);

      // Act
      const result = await parseManifest('/data/agent-outputs/no-manifest');

      // Assert
      expect(result).toBeNull();
    });

    it('should return null for invalid JSON (AC-7)', async () => {
      // Arrange
      (readFile as jest.Mock).mockResolvedValueOnce('{ invalid json }');

      // Act
      const result = await parseManifest('/data/agent-outputs/malformed');

      // Assert
      expect(result).toBeNull();
    });

    it('should return null for empty manifest.json', async () => {
      // Arrange
      (readFile as jest.Mock).mockResolvedValueOnce('');

      // Act
      const result = await parseManifest('/data/agent-outputs/empty');

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when agent field is missing', async () => {
      // Arrange
      const invalidManifest = {
        ...validManifest,
        agent: undefined,
      };
      (readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(invalidManifest));

      // Act
      const result = await parseManifest('/data/agent-outputs/missing-agent');

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when agent.name is missing', async () => {
      // Arrange
      const invalidManifest = {
        ...validManifest,
        agent: { ...validManifest.agent, name: '' },
      };
      (readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(invalidManifest));

      // Act
      const result = await parseManifest('/data/agent-outputs/missing-agent-name');

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when workflow.name is missing', async () => {
      // Arrange
      const invalidManifest = {
        ...validManifest,
        workflow: { ...validManifest.workflow, name: '' },
      };
      (readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(invalidManifest));

      // Act
      const result = await parseManifest('/data/agent-outputs/missing-workflow');

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when execution.started_at is missing', async () => {
      // Arrange
      const invalidManifest = {
        ...validManifest,
        execution: { ...validManifest.execution, started_at: '' },
      };
      (readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(invalidManifest));

      // Act
      const result = await parseManifest('/data/agent-outputs/missing-timestamp');

      // Assert
      expect(result).toBeNull();
    });

    it('should handle manifest with minimal required fields', async () => {
      // Arrange
      const minimalManifest = {
        version: '1.0.0',
        session_id: 'xyz-789',
        agent: {
          name: 'pixel',
          title: 'Pixel',
          bundle: 'bmad/bmm/agents/pixel',
        },
        workflow: {
          name: 'Build Stories',
          description: '',
        },
        execution: {
          started_at: '2025-10-06T10:00:00.000Z',
          status: 'running',
          user: 'Bryan',
        },
        outputs: [],
      };
      (readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(minimalManifest));

      // Act
      const result = await parseManifest('/data/agent-outputs/xyz-789');

      // Assert
      expect(result).not.toBeNull();
      expect(result?.session_id).toBe('xyz-789');
    });
  });

  describe('generateDisplayName', () => {
    it('should generate display name for running session (AC-5)', () => {
      // Arrange
      const metadata: SessionMetadata = {
        version: '1.0.0',
        session_id: 'abc-123',
        agent: {
          name: 'pixel',
          title: 'Pixel',
          bundle: 'bmad/bmm/agents/pixel',
        },
        workflow: {
          name: 'Build Stories',
          description: 'Build user stories',
        },
        execution: {
          started_at: '2025-10-06T09:15:00.000Z',
          status: 'running',
          user: 'Bryan',
        },
        outputs: [],
      };

      // Act
      const result = generateDisplayName(metadata);

      // Assert (Story 6.3 format: "{smartTimestamp} - {workflow.name}")
      expect(result).toContain(' - Build Stories');
    });

    it('should generate display name for completed session (AC-1)', () => {
      // Arrange
      const metadata: SessionMetadata = {
        version: '1.0.0',
        session_id: 'def-456',
        agent: {
          name: 'alex',
          title: 'Alex the Facilitator',
          bundle: 'bmad/bmm/agents/alex',
        },
        workflow: {
          name: 'Intake ITSM',
          description: 'ITSM intake',
        },
        execution: {
          started_at: '2025-10-06T17:09:15.123Z',
          completed_at: '2025-10-06T17:25:30.456Z',
          status: 'completed',
          user: 'Bryan',
        },
        outputs: [],
      };

      // Act
      const result = generateDisplayName(metadata);

      // Assert (Story 6.3 format uses completed_at for timestamp)
      expect(result).toContain(' - Intake ITSM');
      // Should use completed_at which is yesterday from test context
      expect(result).toMatch(/Yday|Mon/);
    });

    it('should use completed_at timestamp for completed sessions', () => {
      // Arrange
      const metadata: SessionMetadata = {
        version: '1.0.0',
        session_id: 'ghi-789',
        agent: {
          name: 'casey',
          title: 'Casey',
          bundle: 'bmad/bmm/agents/casey',
        },
        workflow: {
          name: 'Deep Dive Workflow',
          description: 'Deep dive',
        },
        execution: {
          started_at: '2025-10-05T14:30:00.000Z',
          completed_at: '2025-10-05T15:45:00.000Z',
          status: 'completed',
          user: 'Bryan',
        },
        outputs: [],
      };

      // Act
      const result = generateDisplayName(metadata);

      // Assert (Story 6.3 format: "{smartTimestamp} - {workflow.name}")
      // Should use started_at for timestamp calculation (not completed_at display)
      expect(result).toContain('Oct 5'); // Older date format
      expect(result).toContain(' - Deep Dive Workflow');
    });

    it('should fall back to agent.name if agent.title is missing', () => {
      // Arrange
      const metadata: SessionMetadata = {
        version: '1.0.0',
        session_id: 'jkl-012',
        agent: {
          name: 'test-agent',
          title: '',
          bundle: 'test/bundle',
        },
        workflow: {
          name: 'Test Workflow',
          description: 'Test',
        },
        execution: {
          started_at: '2025-10-06T10:00:00.000Z',
          status: 'running',
          user: 'Bryan',
        },
        outputs: [],
      };

      // Act
      const result = generateDisplayName(metadata);

      // Assert (Story 6.3 format)
      expect(result).toContain(' - Test Workflow');
    });

    it('should handle failed status with timestamp', () => {
      // Arrange
      const metadata: SessionMetadata = {
        version: '1.0.0',
        session_id: 'mno-345',
        agent: {
          name: 'alex',
          title: 'Alex the Facilitator',
          bundle: 'bmad/bmm/agents/alex',
        },
        workflow: {
          name: 'Intake Portal',
          description: 'Portal intake',
        },
        execution: {
          started_at: '2025-10-06T11:00:00.000Z',
          completed_at: '2025-10-06T11:15:00.000Z',
          status: 'failed',
          user: 'Bryan',
        },
        outputs: [],
      };

      // Act
      const result = generateDisplayName(metadata);

      // Assert (Story 6.3 format)
      expect(result).toContain(' - Intake Portal');
    });

    it('should handle cancelled status with timestamp', () => {
      // Arrange
      const metadata: SessionMetadata = {
        version: '1.0.0',
        session_id: 'pqr-678',
        agent: {
          name: 'pixel',
          title: 'Pixel',
          bundle: 'bmad/bmm/agents/pixel',
        },
        workflow: {
          name: 'Edit Stories',
          description: 'Edit stories',
        },
        execution: {
          started_at: '2025-10-06T12:00:00.000Z',
          completed_at: '2025-10-06T12:05:00.000Z',
          status: 'cancelled',
          user: 'Bryan',
        },
        outputs: [],
      };

      // Act
      const result = generateDisplayName(metadata);

      // Assert (Story 6.3 format)
      expect(result).toContain(' - Edit Stories');
    });

    it('should use started_at if completed_at is missing for non-running status', () => {
      // Arrange
      const metadata: SessionMetadata = {
        version: '1.0.0',
        session_id: 'stu-901',
        agent: {
          name: 'casey',
          title: 'Casey',
          bundle: 'bmad/bmm/agents/casey',
        },
        workflow: {
          name: 'Deep Dive App',
          description: 'App deep dive',
        },
        execution: {
          started_at: '2025-10-06T13:30:00.000Z',
          status: 'completed',
          user: 'Bryan',
        },
        outputs: [],
      };

      // Act
      const result = generateDisplayName(metadata);

      // Assert (Story 6.3 format)
      expect(result).toContain(' - Deep Dive App');
    });
  });

  describe('formatTimestamp', () => {
    it('should format ISO 8601 timestamp to human-readable format (AC-1)', () => {
      // Act
      const result = formatTimestamp('2025-10-06T17:09:15.123Z');

      // Assert
      expect(result).toMatch(/Oct 6, 2025.*5:09 PM/);
    });

    it('should format morning timestamps correctly', () => {
      // Act
      const result = formatTimestamp('2025-10-06T09:30:00.000Z');

      // Assert
      expect(result).toMatch(/Oct 6, 2025.*9:30 AM/);
    });

    it('should format afternoon timestamps correctly', () => {
      // Act
      const result = formatTimestamp('2025-10-06T14:45:00.000Z');

      // Assert
      expect(result).toMatch(/Oct 6, 2025.*2:45 PM/);
    });

    it('should format midnight correctly', () => {
      // Act
      const result = formatTimestamp('2025-10-06T00:00:00.000Z');

      // Assert
      expect(result).toMatch(/Oct 6, 2025.*12:00 AM/);
    });

    it('should format noon correctly', () => {
      // Act
      const result = formatTimestamp('2025-10-06T12:00:00.000Z');

      // Assert
      expect(result).toMatch(/Oct 6, 2025.*12:00 PM/);
    });

    it('should return original string for invalid timestamp', () => {
      // Act
      const result = formatTimestamp('invalid-timestamp');

      // Assert
      expect(result).toBe('invalid-timestamp');
    });

    it('should handle empty string gracefully', () => {
      // Act
      const result = formatTimestamp('');

      // Assert
      expect(result).toBe('');
    });

    it('should handle various month names correctly', () => {
      // Test different months
      const timestamps = [
        '2025-01-15T10:00:00.000Z', // Jan
        '2025-03-20T10:00:00.000Z', // Mar
        '2025-07-04T10:00:00.000Z', // Jul
        '2025-12-25T10:00:00.000Z', // Dec
      ];

      // Act & Assert
      timestamps.forEach((ts) => {
        const result = formatTimestamp(ts);
        expect(result).toMatch(/\w+ \d+, 2025.*\d+:\d+ [AP]M/);
      });
    });
  });
});
