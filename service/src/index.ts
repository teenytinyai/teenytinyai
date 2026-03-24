// Cloudflare Worker entry point
import { createApp } from './app.js';

// Environment interface for Cloudflare Workers
export interface Env {
  API_KEY?: string;
  MPP_PAY_TO?: string;
  MPP_SECRET_KEY?: string;
  MPP_CURRENCY?: string;
  MPP_TESTNET?: string;
  MPP_PRICE?: string;
  MPP_REALM?: string;
}

// Create the app instance
const app = createApp({
  auth: {
    apiKey: 'will-be-replaced-by-env', // This will be replaced by the actual handler
  },
});

// Export the fetch handler for Cloudflare Workers
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Build MPP config from environment if available
    const mppConfig = env.MPP_PAY_TO && env.MPP_SECRET_KEY ? {
      payTo: env.MPP_PAY_TO,
      secretKey: env.MPP_SECRET_KEY,
      currency: env.MPP_CURRENCY || undefined,
      testnet: env.MPP_TESTNET === 'true',
      pricePerRequest: env.MPP_PRICE || '0.001',
      realm: env.MPP_REALM || undefined,
    } : undefined;

    // Update the auth config with the environment variable
    const appWithEnv = createApp({
      auth: {
        apiKey: env.API_KEY || 'tt-1234567890abcdef',
        mpp: mppConfig,
      },
    });

    return appWithEnv.fetch(request, env, ctx);
  },
};

// Export the app for other use cases
export { app };