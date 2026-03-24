import type { MppConfig } from '../middleware/mpp.js';

/**
 * Authentication configuration interface
 */
export interface AuthConfig {
  apiKey: string;
  /** Optional MPP (Machine Payments Protocol) config. When set, requests can pay per-request instead of using an API key. */
  mpp?: MppConfig | undefined;
}