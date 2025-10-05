/**
 * Tests for GET /api/agents endpoint
 * Story 4.6: Refactor Agent Discovery for Bundle Structure
 *
 * Test Coverage:
 * - AC-4.6.1: Endpoint returns bundled agent list
 * - AC-4.6.7: Malformed bundles logged but don't crash
 *
 * @jest-environment node
 */

import { GET } from '../route';
import { NextRequest } from 'next/server';
import * as bundleScanner from '@/lib/agents/bundleScanner';

// Mock the bundle scanner module
jest.mock('@/lib/agents/bundleScanner');

describe('GET /api/agents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return agent list from bundle discovery (AC-4.6.1)', async () => {
    // Arrange
    const mockAgents = [
      {
        id: 'alex-facilitator',
        name: 'Alex',
        title: 'Requirements Facilitator',
        description: 'Gathers initial requirements',
        icon: '📝',
        bundleName: 'requirements-workflow',
        bundlePath: 'bmad/custom/bundles/requirements-workflow',
        filePath: 'bmad/custom/bundles/requirements-workflow/agents/alex-facilitator.md',
      },
      {
        id: 'casey-analyst',
        name: 'Casey',
        title: 'Technical Analyst',
        description: 'Performs deep technical analysis',
        icon: '🔍',
        bundleName: 'requirements-workflow',
        bundlePath: 'bmad/custom/bundles/requirements-workflow',
        filePath: 'bmad/custom/bundles/requirements-workflow/agents/casey-analyst.md',
      },
    ];

    (bundleScanner.discoverBundles as jest.Mock).mockResolvedValue(mockAgents);

    const request = new NextRequest('http://localhost:3000/api/agents', {
      method: 'GET',
    });

    // Act
    const response = await GET(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockAgents);
    expect(data.data).toHaveLength(2);
    expect(data.data[0]).toHaveProperty('bundleName');
    expect(data.data[0]).toHaveProperty('bundlePath');
    expect(data.data[0]).toHaveProperty('filePath');
  });

  it('should return empty array when no bundles found', async () => {
    // Arrange
    (bundleScanner.discoverBundles as jest.Mock).mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/agents', {
      method: 'GET',
    });

    // Act
    const response = await GET(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual([]);
  });

  it('should handle bundle scanner errors gracefully (AC-4.6.7)', async () => {
    // Arrange
    const mockError = new Error('Failed to read bundles directory');
    (bundleScanner.discoverBundles as jest.Mock).mockRejectedValue(mockError);

    const request = new NextRequest('http://localhost:3000/api/agents', {
      method: 'GET',
    });

    // Act
    const response = await GET(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });

  it('should call discoverBundles with correct path', async () => {
    // Arrange
    (bundleScanner.discoverBundles as jest.Mock).mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/agents', {
      method: 'GET',
    });

    // Act
    await GET(request);

    // Assert
    expect(bundleScanner.discoverBundles).toHaveBeenCalledWith(
      expect.stringContaining('bmad/custom/bundles')
    );
  });

  it('should use BUNDLES_ROOT environment variable if set', async () => {
    // Arrange
    const originalEnv = process.env.BUNDLES_ROOT;
    process.env.BUNDLES_ROOT = 'custom/bundles/path';
    (bundleScanner.discoverBundles as jest.Mock).mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/agents', {
      method: 'GET',
    });

    // Act
    await GET(request);

    // Assert
    expect(bundleScanner.discoverBundles).toHaveBeenCalledWith(
      expect.stringContaining('custom/bundles/path')
    );

    // Cleanup
    process.env.BUNDLES_ROOT = originalEnv;
  });

  it('should return agents with all required metadata fields', async () => {
    // Arrange
    const mockAgent = {
      id: 'test-agent',
      name: 'Test',
      title: 'Test Agent',
      bundleName: 'test-bundle',
      bundlePath: 'bundles/test-bundle',
      filePath: 'bundles/test-bundle/agents/test-agent.md',
    };

    (bundleScanner.discoverBundles as jest.Mock).mockResolvedValue([mockAgent]);

    const request = new NextRequest('http://localhost:3000/api/agents', {
      method: 'GET',
    });

    // Act
    const response = await GET(request);
    const data = await response.json();

    // Assert
    const agent = data.data[0];
    expect(agent.id).toBe('test-agent');
    expect(agent.name).toBe('Test');
    expect(agent.title).toBe('Test Agent');
    expect(agent.bundleName).toBe('test-bundle');
    expect(agent.bundlePath).toBe('bundles/test-bundle');
    expect(agent.filePath).toBe('bundles/test-bundle/agents/test-agent.md');
  });
});
