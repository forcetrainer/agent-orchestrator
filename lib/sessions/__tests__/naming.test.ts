/**
 * Session Naming Utilities Tests
 *
 * Minimal high-value tests:
 * - Generate display name with userSummary (critical path)
 * - Truncate long strings correctly (edge case)
 */

import {
  generateDisplayName,
  truncate,
} from '../naming';
import type { SessionManifest } from '@/lib/agents/sessionDiscovery';

describe('Session Naming', () => {
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

  it('should generate display name with userSummary (Priority 1)', () => {
    const manifest: SessionManifest = {
      ...baseManifest,
      userSummary: 'I need to purchase 10 laptops for the marketing team',
    };

    const result = generateDisplayName(manifest);
    expect(result).toContain(' - I need to purchase 10 laptops');
    expect(result.length).toBeLessThanOrEqual(50);
  });

  it('should truncate long strings at 35 characters with ellipsis', () => {
    const long = 'I need detailed guidance on the complete procurement process for purchasing workstations';
    const result = truncate(long, 35);

    expect(result).toBe('I need detailed guidance on the ...');
    expect(result.length).toBe(35);
  });
});
