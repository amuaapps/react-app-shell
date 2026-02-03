/**
 * Session management for analytics
 *
 * Generates and persists a session ID in sessionStorage for the duration of the browser session.
 */

const SESSION_STORAGE_KEY = 'analytics_session_id';

/**
 * Generate a UUID v4
 */
function generateUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Validate that a string is a valid UUID
 */
function isValidUuid(value: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Get or create a session ID
 *
 * Retrieves the session ID from sessionStorage if valid, otherwise creates a new one.
 * The session ID persists across page refreshes within the same tab but is cleared when the tab closes.
 *
 * @returns Session ID (UUID v4)
 */
export function getOrCreateSessionId(): string {
  try {
    // Try to retrieve existing session ID
    const existingId = sessionStorage.getItem(SESSION_STORAGE_KEY);

    if (existingId && isValidUuid(existingId)) {
      return existingId;
    }

    // Generate new session ID
    const newId = generateUuid();
    sessionStorage.setItem(SESSION_STORAGE_KEY, newId);
    return newId;
  } catch {
    // If sessionStorage is not available (e.g., private browsing), generate in-memory ID
    console.warn('sessionStorage not available, using in-memory session ID');
    return generateUuid();
  }
}

/**
 * Get the current session ID (or undefined if not yet initialized)
 */
export function getSessionId(): string | undefined {
  try {
    const id = sessionStorage.getItem(SESSION_STORAGE_KEY);
    return id && isValidUuid(id) ? id : undefined;
  } catch {
    return undefined;
  }
}
