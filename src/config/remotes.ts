/**
 * Remote application configuration
 *
 * This module provides environment-driven configuration for remote micro-frontend URLs.
 *
 * Configuration Strategy:
 * - Build-time injection via Vite environment variables
 * - Environment variables are prefixed with VITE_ to be exposed to the client
 * - Safe defaults for local development
 * - Per-environment configuration without code changes
 * - Testable without Jest module mocking via env provider abstraction
 *
 * Usage:
 * 1. Set environment variables in .env files (.env.development, .env.staging, .env.production)
 * 2. Or set them in CI/CD pipeline for each environment
 * 3. Access via getRemoteConfig() function
 */

import { getEnv } from '@/lib/env-provider';

export interface RemoteConfig {
  coreRemoteEntryUrl: string;
  campaignsRemoteEntryUrl: string;
}

/**
 * Default URLs for local development
 * These assume remote apps are running locally on standard ports
 */
const DEFAULT_CONFIG: RemoteConfig = {
  // Core app runs on port 3002 in local dev
  coreRemoteEntryUrl: 'http://localhost:3002/remoteEntry.js',

  // Campaigns app runs on port 3003 in local dev
  campaignsRemoteEntryUrl: 'http://localhost:3003/remoteEntry.js',
};

/**
 * Get remote application configuration
 *
 * Reads from environment variables with fallback to safe defaults.
 * Environment variables are injected at build time by Vite or set in Jest via process.env.
 *
 * Environment Variables:
 * - VITE_CORE_REMOTE_ENTRY_URL: URL for core remote app entry point
 * - VITE_CAMPAIGNS_REMOTE_ENTRY_URL: URL for campaigns remote app entry point
 *
 * @returns RemoteConfig object with URLs for all remote applications
 */
export function getRemoteConfig(): RemoteConfig {
  return {
    coreRemoteEntryUrl:
      getEnv('CORE_REMOTE_ENTRY_URL') || DEFAULT_CONFIG.coreRemoteEntryUrl,

    campaignsRemoteEntryUrl:
      getEnv('CAMPAIGNS_REMOTE_ENTRY_URL') || DEFAULT_CONFIG.campaignsRemoteEntryUrl,
  };
}

/**
 * Validate that a remote URL is properly configured
 *
 * @param url - The remote entry URL to validate
 * @returns true if URL is valid, false otherwise
 */
export function isValidRemoteUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Get configuration for a specific remote application
 *
 * @param remoteName - Name of the remote app ('core' or 'campaigns')
 * @returns The remote entry URL for the specified app
 * @throws Error if remote name is invalid
 */
export function getRemoteUrl(remoteName: 'core' | 'campaigns'): string {
  const config = getRemoteConfig();

  switch (remoteName) {
    case 'core':
      return config.coreRemoteEntryUrl;
    case 'campaigns':
      return config.campaignsRemoteEntryUrl;
    default:
      throw new Error(`Unknown remote application: ${remoteName as string}`);
  }
}
