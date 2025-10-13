/**
 * Browser Identity Module Unit Tests
 *
 * Story 10.2 Task 5: Comprehensive test suite for browser identity management
 *
 * Tests cover:
 * - AC-10.2-1: UUID v4 generation
 * - AC-10.2-2: Cookie management (get, set)
 * - AC-10.2-3: Cookie expiration (1 year)
 * - AC-10.2-6: Security attributes (httpOnly, secure, sameSite)
 */

// Mock Next.js cookies API before importing browserIdentity
const mockGet = jest.fn();
const mockSet = jest.fn();

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: mockGet,
    set: mockSet,
  })),
}));

// Import after mocking
import { generateBrowserId, getBrowserId, setBrowserId, getOrCreateBrowserId } from '../utils/browserIdentity';

describe('browserIdentity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateBrowserId', () => {
    it('AC-10.2-1: generates valid UUID v4 format', () => {
      const id = generateBrowserId();

      // UUID v4 regex: 8-4-4-4-12 hex digits with version 4 in third group
      const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      expect(id).toMatch(uuidV4Regex);
    });

    it('generates unique IDs on each call', () => {
      const id1 = generateBrowserId();
      const id2 = generateBrowserId();
      const id3 = generateBrowserId();

      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id1).not.toBe(id3);
    });
  });

  describe('getBrowserId', () => {
    it('returns browser ID when cookie exists', () => {
      const testId = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
      mockGet.mockReturnValue({ name: 'agent_orchestrator_browser_id', value: testId });

      const result = getBrowserId();

      expect(result).toBe(testId);
      expect(mockGet).toHaveBeenCalledWith('agent_orchestrator_browser_id');
    });

    it('returns null when cookie does not exist', () => {
      mockGet.mockReturnValue(undefined);

      const result = getBrowserId();

      expect(result).toBeNull();
      expect(mockGet).toHaveBeenCalledWith('agent_orchestrator_browser_id');
    });

    it('returns null when cookie value is empty', () => {
      mockGet.mockReturnValue({ name: 'agent_orchestrator_browser_id', value: '' });

      const result = getBrowserId();

      expect(result).toBeNull();
    });
  });

  describe('setBrowserId', () => {
    it('AC-10.2-2: sets cookie with correct name and value', () => {
      const testId = 'test-browser-id-123';
      setBrowserId(testId);

      expect(mockSet).toHaveBeenCalledTimes(1);
      const callArgs = mockSet.mock.calls[0][0];

      expect(callArgs.name).toBe('agent_orchestrator_browser_id');
      expect(callArgs.value).toBe(testId);
    });

    it('AC-10.2-2, AC-10.2-6: sets httpOnly flag to prevent XSS', () => {
      setBrowserId('test-id');

      const callArgs = mockSet.mock.calls[0][0];
      expect(callArgs.httpOnly).toBe(true);
    });

    it('AC-10.2-6: sets sameSite to strict for CSRF protection', () => {
      setBrowserId('test-id');

      const callArgs = mockSet.mock.calls[0][0];
      expect(callArgs.sameSite).toBe('strict');
    });

    it('AC-10.2-3: sets maxAge to 31536000 seconds (1 year)', () => {
      setBrowserId('test-id');

      const callArgs = mockSet.mock.calls[0][0];
      const ONE_YEAR_SECONDS = 31536000;
      expect(callArgs.maxAge).toBe(ONE_YEAR_SECONDS);
    });

    it('sets path to root for application-wide availability', () => {
      setBrowserId('test-id');

      const callArgs = mockSet.mock.calls[0][0];
      expect(callArgs.path).toBe('/');
    });

    it('AC-10.2-6: sets secure flag in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      setBrowserId('test-id');

      const callArgs = mockSet.mock.calls[0][0];
      expect(callArgs.secure).toBe(true);

      process.env.NODE_ENV = originalEnv;
    });

    it('does not set secure flag in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      setBrowserId('test-id');

      const callArgs = mockSet.mock.calls[0][0];
      expect(callArgs.secure).toBe(false);

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('getOrCreateBrowserId', () => {
    it('returns existing browser ID when cookie exists', () => {
      const existingId = 'existing-browser-id';
      mockGet.mockReturnValue({ name: 'agent_orchestrator_browser_id', value: existingId });

      const result = getOrCreateBrowserId();

      expect(result).toBe(existingId);
      expect(mockSet).not.toHaveBeenCalled(); // Should not create new cookie
    });

    it('AC-10.2-1, AC-10.2-5: generates new ID when cookie does not exist', () => {
      mockGet.mockReturnValue(undefined);

      const result = getOrCreateBrowserId();

      // Verify UUID v4 format
      const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(result).toMatch(uuidV4Regex);

      // Verify cookie was set
      expect(mockSet).toHaveBeenCalledTimes(1);
      const callArgs = mockSet.mock.calls[0][0];
      expect(callArgs.name).toBe('agent_orchestrator_browser_id');
      expect(callArgs.value).toBe(result);
    });

    it('sets cookie with correct attributes when creating new ID', () => {
      mockGet.mockReturnValue(undefined);

      getOrCreateBrowserId();

      expect(mockSet).toHaveBeenCalledTimes(1);
      const callArgs = mockSet.mock.calls[0][0];

      expect(callArgs.httpOnly).toBe(true);
      expect(callArgs.sameSite).toBe('strict');
      expect(callArgs.maxAge).toBe(31536000);
      expect(callArgs.path).toBe('/');
    });
  });

  describe('Privacy & Security (AC-10.2-6)', () => {
    it('browser ID is opaque UUID with no PII', () => {
      // Generate multiple IDs to verify they are random UUIDs
      const ids = Array.from({ length: 10 }, () => generateBrowserId());

      ids.forEach(id => {
        // Verify UUID v4 format (random, no user information)
        const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        expect(id).toMatch(uuidV4Regex);

        // Verify no common PII patterns
        expect(id).not.toMatch(/user|name|email|phone|address/i);
      });

      // Verify all IDs are unique (no sequential patterns)
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(10);
    });

    it('cookie attributes prevent XSS attacks', () => {
      setBrowserId('test-id');

      const callArgs = mockSet.mock.calls[0][0];

      // httpOnly prevents JavaScript access via document.cookie
      expect(callArgs.httpOnly).toBe(true);
    });

    it('cookie attributes prevent CSRF attacks', () => {
      setBrowserId('test-id');

      const callArgs = mockSet.mock.calls[0][0];

      // sameSite=strict blocks cross-site requests
      expect(callArgs.sameSite).toBe('strict');
    });

    it('cookie attributes prevent MITM attacks in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      setBrowserId('test-id');

      const callArgs = mockSet.mock.calls[0][0];

      // secure flag ensures HTTPS-only transmission
      expect(callArgs.secure).toBe(true);

      process.env.NODE_ENV = originalEnv;
    });
  });
});
