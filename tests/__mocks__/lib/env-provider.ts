/**
 * Mock env-provider for Jest
 * Avoids import.meta parsing issues by using process.env only
 */

export interface EnvProvider {
  get(key: string): string | undefined;
}

class ProcessEnvProvider implements EnvProvider {
  get(key: string): string | undefined {
    const viteKey = `VITE_${key}`;
    return process.env[viteKey];
  }
}

export class StaticEnvProvider implements EnvProvider {
  constructor(private values: Record<string, string>) {}

  get(key: string): string | undefined {
    return this.values[key];
  }
}

let envProvider: EnvProvider = new ProcessEnvProvider();

export function setEnvProvider(provider: EnvProvider): void {
  envProvider = provider;
}

export function getEnvProvider(): EnvProvider {
  return envProvider;
}

export function getEnv(key: string): string | undefined {
  return envProvider.get(key);
}
