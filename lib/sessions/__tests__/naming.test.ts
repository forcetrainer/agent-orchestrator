/**
 * Unit Tests for Session Naming Utilities
 * Story 6.3: Session Display Names & Chat Context
 */

import {
  formatSmartTimestamp,
  generateDisplayName,
  truncate,
} from '../naming';
import type { SessionManifest } from '@/lib/agents/sessionDiscovery';

describe('formatSmartTimestamp', () => {
  // Mock current date for consistent testing (using local time)
  const mockNow = new Date('2025-10-07T10:30:00'); // Local time, not UTC

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(mockNow);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  test('formats today timestamp correctly', () => {
    // Create a date "today" in local time
    const timestamp = new Date('2025-10-07T14:30:00').toISOString();
    expect(formatSmartTimestamp(timestamp)).toContain(':30p');
  });

  test('formats morning time correctly', () => {
    const timestamp = new Date('2025-10-07T09:15:00').toISOString();
    expect(formatSmartTimestamp(timestamp)).toContain('a');
  });

  test('formats yesterday timestamp correctly', () => {
    const timestamp = new Date('2025-10-06T16:45:00').toISOString(); // Yesterday
    expect(formatSmartTimestamp(timestamp)).toContain('Yday');
  });

  test('formats this week timestamp correctly', () => {
    // Oct 6 is Monday in 2025
    const timestamp = new Date('2025-10-06T14:30:00').toISOString();
    const result = formatSmartTimestamp(timestamp);
    // Should either be "Mon" (if within this week) or "Yday" (if yesterday)
    expect(result).toMatch(/Mon|Yday/);
  });

  test('formats older timestamp correctly', () => {
    const timestamp = new Date('2025-09-28T09:30:00').toISOString(); // Sept 28 (older)
    expect(formatSmartTimestamp(timestamp)).toBe('Sep 28');
  });

  test('handles midnight edge case', () => {
    const timestamp = new Date('2025-10-07T00:00:00').toISOString();
    expect(formatSmartTimestamp(timestamp)).toContain('12:00');
  });

  test('handles noon edge case', () => {
    const timestamp = new Date('2025-10-07T12:00:00').toISOString();
    expect(formatSmartTimestamp(timestamp)).toContain('12:00');
  });
});

describe('truncate', () => {
  test('truncates long strings correctly', () => {
    const long = 'I need detailed guidance on the complete procurement process for purchasing workstations';
    const result = truncate(long, 35);
    // Should be 32 chars + "..." = 35 total
    expect(result).toBe('I need detailed guidance on the ...');
    expect(result.length).toBe(35);
  });

  test('does not truncate short strings', () => {
    const short = 'Help me write story 6.4';
    expect(truncate(short, 35)).toBe('Help me write story 6.4');
  });

  test('handles exact length strings', () => {
    const exact = '12345678901234567890123456789012345'; // 35 chars
    expect(truncate(exact, 35)).toBe(exact);
  });

  test('handles empty strings', () => {
    expect(truncate('', 35)).toBe('');
  });

  test('uses default maxLength of 35', () => {
    const long = 'This is a very long string that exceeds thirty-five characters by quite a bit';
    const result = truncate(long);
    expect(result.length).toBe(35);
    expect(result).toContain('...');
  });
});

describe('generateDisplayName', () => {
  const baseManifest: SessionManifest = {
    version: '1.0.0',
    session_id: 'test-uuid',
    agent: {
      name: 'alex',
      title: 'Alex - Requirements Facilitator',
      bundle: 'chat',
    },
    workflow: {
      name: 'chat',
      description: 'Interactive chat',
    },
    execution: {
      started_at: '2025-10-07T14:30:00Z',
      status: 'running',
      user: 'Bryan',
    },
    outputs: [],
  };

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-10-07T14:30:00Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  test('Priority 1: uses userSummary for chat sessions', () => {
    const manifest: SessionManifest = {
      ...baseManifest,
      userSummary: 'I need to purchase 10 laptops for the marketing team',
    };

    const result = generateDisplayName(manifest);
    expect(result).toContain(' - I need to purchase 10 laptops');
    expect(result.length).toBeLessThanOrEqual(50); // Smart timestamp + " - " + 35 chars
  });

  test('Priority 2: uses workflow name + input summary', () => {
    const manifest: SessionManifest = {
      ...baseManifest,
      workflow: {
        name: 'intake-app',
        description: 'Application intake',
      },
      inputs: {
        project_name: 'Time Tracking System',
        category: 'Application',
      },
    };

    const result = generateDisplayName(manifest);
    expect(result).toContain('intake-app: Time Tracking System');
  });

  test('Priority 3: uses workflow name only', () => {
    const manifest: SessionManifest = {
      ...baseManifest,
      workflow: {
        name: 'deep-dive-itsm',
        description: 'ITSM deep dive',
      },
    };

    const result = generateDisplayName(manifest);
    expect(result).toContain(' - deep-dive-itsm');
  });

  test('Priority 4: falls back to agent title', () => {
    const manifest: SessionManifest = {
      ...baseManifest,
      workflow: {
        name: '',
        description: '',
      },
    };

    const result = generateDisplayName(manifest);
    expect(result).toContain('Alex - Requirements Facilitator');
  });

  test('truncates long summaries at 35 characters', () => {
    const manifest: SessionManifest = {
      ...baseManifest,
      userSummary: 'This is an extremely long user message that should definitely be truncated to fit the display',
    };

    const result = generateDisplayName(manifest);
    const summary = result.split(' - ')[1];
    expect(summary?.length).toBeLessThanOrEqual(38); // 35 + "..."
  });

  test('handles empty userSummary gracefully', () => {
    const manifest: SessionManifest = {
      ...baseManifest,
      userSummary: '',
    };

    const result = generateDisplayName(manifest);
    expect(result).toContain(' - chat'); // Falls back to workflow name
  });

  test('formats with yesterday timestamp', () => {
    const manifest: SessionManifest = {
      ...baseManifest,
      execution: {
        ...baseManifest.execution,
        started_at: new Date('2025-10-06T16:45:00').toISOString(),
      },
      userSummary: 'Looking for procurement approval',
    };

    const result = generateDisplayName(manifest);
    expect(result).toContain('Yday');
  });

  test('formats with older timestamp', () => {
    const manifest: SessionManifest = {
      ...baseManifest,
      execution: {
        ...baseManifest.execution,
        started_at: new Date('2025-09-28T09:30:00').toISOString(),
      },
      userSummary: 'Database schema validation needed',
    };

    const result = generateDisplayName(manifest);
    expect(result).toContain('Sep 28');
  });
});
