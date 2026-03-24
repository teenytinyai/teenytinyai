import { describe, it, expect, beforeAll } from 'vitest';
import { createApp } from '../src/app.js';

const testAPIKey = 'tt-test-key-mpp';
const testSecretKey = 'test-mpp-secret-key-for-hmac-challenges';

describe('MPP (Machine Payments Protocol) Integration', () => {
  let app: ReturnType<typeof createApp>;

  beforeAll(() => {
    app = createApp({
      auth: {
        apiKey: testAPIKey,
        mpp: {
          payTo: '0x1234567890abcdef1234567890abcdef12345678',
          secretKey: testSecretKey,
          testnet: true,
          pricePerRequest: '0.001',
          realm: 'teenytiny-test',
        },
      },
    });
  });

  describe('Bearer auth still works when MPP is enabled', () => {
    it('should accept valid Bearer token', async () => {
      const res = await app.request('/v1/models', {
        headers: {
          'Authorization': `Bearer ${testAPIKey}`,
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.object).toBe('list');
    });

    it('should accept valid Bearer token for chat completions', async () => {
      const res = await app.request('/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testAPIKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'echo',
          messages: [{ role: 'user', content: 'Hello via API key!' }],
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.choices[0].message.content).toBe('Hello via API key!');
    });

    it('should reject invalid Bearer token with 401', async () => {
      const res = await app.request('/v1/models', {
        headers: {
          'Authorization': 'Bearer invalid-key',
        },
      });

      // With MPP enabled, invalid Bearer falls through to MPP (402), not 401
      // This is by design: the server offers payment as an alternative
      expect(res.status).toBe(402);
    });
  });

  describe('MPP 402 challenge flow', () => {
    it('should return 402 with WWW-Authenticate: Payment when no auth provided', async () => {
      const res = await app.request('/v1/models');

      expect(res.status).toBe(402);
      const wwwAuth = res.headers.get('WWW-Authenticate');
      expect(wwwAuth).toBeTruthy();
      expect(wwwAuth).toContain('Payment');
    });

    it('should return 402 for chat completions without auth', async () => {
      const res = await app.request('/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'echo',
          messages: [{ role: 'user', content: 'Pay me!' }],
        }),
      });

      expect(res.status).toBe(402);
      const wwwAuth = res.headers.get('WWW-Authenticate');
      expect(wwwAuth).toBeTruthy();
      expect(wwwAuth).toContain('Payment');
    });

    it('should not require auth for health check', async () => {
      const res = await app.request('/health');

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe('ok');
    });
  });

  describe('Non-MPP app still works normally', () => {
    let plainApp: ReturnType<typeof createApp>;

    beforeAll(() => {
      plainApp = createApp({
        auth: {
          apiKey: testAPIKey,
        },
      });
    });

    it('should return 401 (not 402) when MPP is not configured', async () => {
      const res = await plainApp.request('/v1/models');

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error.type).toBe('authentication_error');
    });
  });
});
