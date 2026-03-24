import type { Context, Next, MiddlewareHandler } from 'hono';
import type { Authenticator } from '../auth/authenticator.js';

export interface MppConfig {
  /** Recipient wallet address (0x...) */
  payTo: string;
  /** TIP-20 token contract address for payment currency */
  currency?: string | undefined;
  /** Secret key for HMAC-bound challenge IDs */
  secretKey: string;
  /** Use testnet (Tempo Moderato) instead of mainnet */
  testnet?: boolean | undefined;
  /** Amount to charge per request (in human-readable units, e.g. "0.001" = 0.1 cents) */
  pricePerRequest?: string | undefined;
  /** Server realm for challenges */
  realm?: string | undefined;
}

/**
 * Creates middleware that accepts either Bearer token auth OR MPP payment.
 * Bearer tokens are checked first. If no valid Bearer token, falls through to MPP.
 */
export function createMppAuthMiddleware(
  authenticator: Authenticator,
  mppConfig: MppConfig,
): MiddlewareHandler {
  // Lazy-initialize mppx to avoid top-level async and heavy imports when MPP is disabled
  let mppxChargeHandler: ((req: Request) => Promise<any>) | null = null;
  let initPromise: Promise<void> | null = null;

  async function ensureInitialized() {
    if (mppxChargeHandler) return;
    if (initPromise) {
      await initPromise;
      return;
    }
    initPromise = (async () => {
      const { Mppx, tempo } = await import('mppx/server');
      const mppx = Mppx.create({
        methods: [
          tempo.charge({
            currency: mppConfig.currency as `0x${string}` | undefined,
            recipient: mppConfig.payTo as `0x${string}`,
            testnet: mppConfig.testnet ?? false,
          }),
        ],
        secretKey: mppConfig.secretKey,
        realm: mppConfig.realm ?? 'teenytiny-api',
      });
      const price = mppConfig.pricePerRequest ?? '0.001';
      mppxChargeHandler = mppx.charge({
        amount: price,
        description: `TeenyTiny AI API request ($${price})`,
      });
    })();
    await initPromise;
  }

  return async (c: Context, next: Next) => {
    // Skip auth for health check
    if (c.req.path === '/health') {
      await next();
      return;
    }

    // Try Bearer token auth first
    const authHeader = c.req.header('Authorization');
    if (authHeader) {
      const bearerPrefix = 'Bearer ';
      if (authHeader.startsWith(bearerPrefix)) {
        const token = authHeader.slice(bearerPrefix.length);
        const isValid = await authenticator.validateApiKey(token);
        if (isValid) {
          await next();
          return;
        }
        // Invalid Bearer token — fall through to MPP payment below
      }

      // If it's a Payment credential, handle via MPP below
      // If it's neither Bearer nor Payment, also fall through to MPP
      // (MPP will reject with 402 challenge, which is more helpful than 401)
    }

    // No valid Bearer token — use MPP payment
    await ensureInitialized();
    const result = await mppxChargeHandler!(c.req.raw);

    if (result.status === 402) {
      // Return the 402 challenge response directly
      return result.challenge;
    }

    // Payment verified — proceed with the request
    await next();

    // Attach Payment-Receipt header to the response
    c.res = result.withReceipt(c.res);
  };
}
