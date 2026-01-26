/**
 * Environment variable provider abstraction
 * 
 * Provides a unified interface for accessing environment variables that works in:
 * - Vite runtime (import.meta.env)
 * - Jest tests (process.env)
 * - Any other environment with custom provider
 * 
 * This allows config modules to be testable without Jest module mocking.
 */

export interface EnvProvider {
  /**
   * Get an environment variable value
   * @param key - The environment variable key (without VITE_ prefix)
   * @returns The value or undefined if not set
   */
  get(key: string): string | undefined;
}

/**
 * Vite environment provider
 * Uses import.meta.env which is available in Vite runtime
 */
class ViteEnvProvider implements EnvProvider {
  get(key: string): string | undefined {
    const viteKey = `VITE_${key}`;
    const value = import.meta.env[viteKey] as unknown;
    return typeof value === 'string' ? value : undefined;
  }
}

/**
 * Process environment provider
 * Uses process.env which is available in Node.js (Jest)
 */
class ProcessEnvProvider implements EnvProvider {
  get(key: string): string | undefined {
    const viteKey = `VITE_${key}`;
    return process.env[viteKey];
  }
}

/**
 * Static environment provider for testing
 * Allows injecting specific values for tests
 */
export class StaticEnvProvider implements EnvProvider {
  constructor(private values: Record<string, string>) {}

  get(key: string): string | undefined {
    return this.values[key];
  }
}

/**
 * Global environment provider instance
 * Automatically selects the appropriate provider based on runtime
 */
let envProvider: EnvProvider;

// Auto-detect runtime and set appropriate provider
if (typeof import.meta !== 'undefined' && import.meta.env) {
  // Vite runtime
  envProvider = new ViteEnvProvider();
} else if (typeof process !== 'undefined' && process.env) {
  // Node.js / Jest
  envProvider = new ProcessEnvProvider();
} else {
  // Fallback: empty provider
  envProvider = new StaticEnvProvider({});
}

/**
 * Set a custom environment provider
 * Useful for testing with specific values
 * 
 * @example
 * // In test setup:
 * setEnvProvider(new StaticEnvProvider({
 *   CORE_REMOTE_ENTRY_URL: 'http://test.example.com/core.js'
 * }));
 */
export function setEnvProvider(provider: EnvProvider): void {
  envProvider = provider;
}

/**
 * Get the current environment provider
 */
export function getEnvProvider(): EnvProvider {
  return envProvider;
}

/**
 * Get an environment variable value
 * Convenience function that uses the global provider
 * 
 * @param key - The environment variable key (without VITE_ prefix)
 * @returns The value or undefined if not set
 */
export function getEnv(key: string): string | undefined {
  return envProvider.get(key);
}
