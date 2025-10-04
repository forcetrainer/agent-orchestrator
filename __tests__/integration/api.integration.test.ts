/**
 * Integration tests for Epic 1 - Backend Foundation & Infrastructure
 * Tests all API routes end-to-end
 *
 * @jest-environment node
 */

describe('API Integration Tests', () => {
  const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

  describe('GET /api/health', () => {
    it('should return 200 OK with health status', async () => {
      const response = await fetch(`${BASE_URL}/api/health`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('status', 'ok');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('uptime');
      expect(data).toHaveProperty('environment');
      expect(typeof data.uptime).toBe('number');
    });

    it('should respond quickly (< 100ms)', async () => {
      const start = Date.now();
      await fetch(`${BASE_URL}/api/health`);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });
  });

  describe('GET /api/agents', () => {
    it('should return 200 OK with agents array', async () => {
      const response = await fetch(`${BASE_URL}/api/agents`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('data');
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('should return agents with correct structure', async () => {
      const response = await fetch(`${BASE_URL}/api/agents`);
      const data = await response.json();

      if (data.data.length > 0) {
        const agent = data.data[0];
        expect(agent).toHaveProperty('id');
        expect(agent).toHaveProperty('name');
        expect(agent).toHaveProperty('description');
        expect(agent).toHaveProperty('path');
      }
    });
  });

  describe('GET /api/files', () => {
    it('should return 200 OK with files array', async () => {
      const response = await fetch(`${BASE_URL}/api/files`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('data');
      expect(Array.isArray(data.data)).toBe(true);
    });
  });

  describe('POST /api/chat', () => {
    it('should return 200 OK with chat response when valid data provided', async () => {
      const response = await fetch(`${BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId: 'test-agent',
          message: 'Hello, world!',
        }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('data');
      expect(data.data).toHaveProperty('conversationId');
      expect(data.data).toHaveProperty('message');
      expect(data.data.message).toHaveProperty('id');
      expect(data.data.message).toHaveProperty('role', 'assistant');
      expect(data.data.message).toHaveProperty('content');
      expect(data.data.message).toHaveProperty('timestamp');
    });

    it('should return 400 when agentId is missing', async () => {
      const response = await fetch(`${BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Hello, world!',
        }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('success', false);
      expect(data).toHaveProperty('error');
      expect(data.error).toBe('Agent ID is required');
    });

    it('should return 400 when message is missing', async () => {
      const response = await fetch(`${BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId: 'test-agent',
        }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('success', false);
      expect(data).toHaveProperty('error');
      expect(data.error).toBe('Message is required');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await fetch(`${BASE_URL}/api/unknown-route`);

      expect(response.status).toBe(404);
    });

    it('should return proper JSON error format', async () => {
      const response = await fetch(`${BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      const data = await response.json();

      expect(data).toHaveProperty('success', false);
      expect(data).toHaveProperty('error');
      expect(typeof data.error).toBe('string');
      expect(data).toHaveProperty('code');
    });
  });

  describe('Environment Configuration', () => {
    it('should be running in development mode', async () => {
      const response = await fetch(`${BASE_URL}/api/health`);
      const data = await response.json();

      expect(data.environment).toBe('development');
    });
  });

  describe('TypeScript Validation', () => {
    it('should enforce type safety on API responses', async () => {
      const response = await fetch(`${BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId: 'test',
          message: 'test',
        }),
      });
      const data = await response.json();

      // Verify response matches ApiResponse<ChatResponse> type
      expect(typeof data.success).toBe('boolean');
      if (data.success) {
        expect(data.data.message.role).toMatch(/^(user|assistant)$/);
      }
    });
  });
});
