# Analytics System

The shell provides centralized analytics tracking for all remote applications using **Pattern 1**: MFEs emit events, shell owns transport.

## Architecture

### Pattern 1: Shell-Owned Transport

- **Shell Responsibilities:**
  - Event transport (batching, sending, retries)
  - Envelope fields (eventId, occurredAt, source, actor, context, consent)
  - Session management (sessionId generation and storage)
  - Authentication state (userId from auth store)
  - Consent management
  - Endpoint configuration

- **MFE Responsibilities:**
  - Emit domain events via `analytics.track(name, properties)`
  - Event names must be from the SKU registry (`AllowedEventName`)
  - Event properties must be snake_case

## Usage for MFEs

### Accessing Analytics

All remote apps have access to the analytics client via React Context:

```typescript
import { useAnalytics } from '@/analytics';

function MyComponent() {
  const analytics = useAnalytics();
  
  const handleClick = () => {
    analytics.track('web.link_clicked', {
      link_url: '/about',
      link_text: 'Learn More',
    });
  };
  
  return <button onClick={handleClick}>Learn More</button>;
}
```

### Available Methods

```typescript
interface AnalyticsClient {
  // Track a domain event
  track<Name extends AllowedEventName>(
    name: Name,
    properties: PropertiesFor<Name>
  ): void;
  
  // Track a page view (auto-tracked by shell)
  pageViewed(args: {
    toPath: string;
    fromPath?: string | null;
    title?: string;
  }): void;
  
  // Identify the current user
  identify(traits?: Record<string, unknown>): void;
  
  // Update consent preferences
  setConsent(consent: Partial<Consent>): void;
}
```

### Event Registry

Events must be defined in the SKU registry. Current allowed events:

- `web.session_started` - Emitted once per session by shell
- `web.page_viewed` - Auto-tracked by shell on route changes
- `web.link_clicked` - Track link clicks
- `web.form_submitted` - Track form submissions
- `web.error_occurred` - Track errors
- `app.feature_used` - Track feature usage
- `app.action_completed` - Track completed actions

### Property Naming

**All event properties MUST be snake_case:**

```typescript
// ✅ Correct
analytics.track('app.feature_used', {
  feature_name: 'campaign_builder',
  user_role: 'admin',
});

// ❌ Wrong - will fail validation
analytics.track('app.feature_used', {
  featureName: 'campaign_builder',  // camelCase not allowed
  userRole: 'admin',
});
```

## Shell Auto-Tracking

The shell automatically tracks:

### 1. Session Started

Emitted once per browser session on shell boot:

```typescript
{
  type: 'track',
  name: 'web.session_started',
  properties: {
    utm_source?: string,
    utm_medium?: string,
    utm_campaign?: string,
    utm_term?: string,
    utm_content?: string,
    gclid?: string,
    fbclid?: string,
    landing_path: string,
    referrer_host?: string,
  }
}
```

### 2. Page Viewed

Emitted on every route change:

```typescript
{
  type: 'page',
  name: 'web.page_viewed',
  properties: {
    from_path?: string | null,
    to_path: string,
    nav_type: 'initial_load' | 'client_route' | 'browser_back' | 'browser_forward',
  }
}
```

## Event Envelope

All events are wrapped in a standard envelope before sending:

```typescript
{
  schemaVersion: '1.0.0',
  eventId: string,  // UUID v4
  type: 'track' | 'page' | 'identify',
  occurredAt: string,  // ISO 8601
  name: string,  // Event name from SKU
  properties: Record<string, unknown>,
  source: {
    appId: 'react-app-shell',
    platform: 'web',
    environment: 'dev' | 'staging' | 'prod',
    appVersion: string,
  },
  actor: {
    anonymousId: string,  // sessionId
    userId?: string,  // when authenticated
  },
  context: {
    sessionId: string,
    page: {
      path: string,  // pathname only, no query string
      title?: string,
      referrer?: string,  // hostname only
    },
    device: {
      device_class: 'mobile' | 'tablet' | 'desktop',
      viewport_width: number,
      viewport_height: number,
    },
    locale: string,
    timezone: string,
  },
  consent: {
    analytics: boolean,
    experimentation: boolean,
    personalization: boolean,
    timestamp: string,
  }
}
```

## Privacy & Compliance

### Privacy-Minimized Context

The shell collects only privacy-safe context:

- ✅ **Included:** pathname, page title, referrer hostname, device class, viewport size, locale, timezone
- ❌ **NOT Included:** full URLs, query strings, user agent, IP address, cookies

### Consent Management

Default consent state:
- `analytics: true` - Basic analytics enabled by default
- `experimentation: false` - Requires opt-in
- `personalization: false` - Requires opt-in

Update consent:

```typescript
const analytics = useAnalytics();

analytics.setConsent({
  experimentation: true,
  personalization: true,
});
```

## Transport & Batching

### Batching Strategy

Events are queued and sent in batches:

- **Batch size:** 10 events
- **Flush interval:** 1500ms (1.5 seconds)
- **Flush triggers:**
  - Queue reaches 10 events
  - 1.5 seconds elapsed since last flush
  - Page hide (tab close, navigation away)
  - Visibility change (tab becomes hidden)

### Retry Logic

Failed batches are retried with exponential backoff:

- **Max retries:** 2
- **Backoff:** 250ms, 750ms
- **After retries:** Events are dropped (logged in dev)

### Endpoint Configuration

Configure the ingest endpoint via environment variable:

```bash
# .env.local
VITE_ANALYTICS_INGEST_URL=https://analytics-service.example.com/ingest

# Or use default
# Default: /analytics/ingest (relative to shell domain)
```

## Session Management

### Session ID

- Generated once per browser tab session (UUID v4)
- Stored in `sessionStorage` (key: `analytics_session_id`)
- Persists across page refreshes in same tab
- Cleared when tab closes
- Used as `actor.anonymousId` in all events

### User ID

- Provided by shell's auth store
- Set as `actor.userId` when user is authenticated
- Undefined for anonymous users

## Development

### Debug Logging

In development mode, all analytics operations are logged:

```
[Analytics] Session started { landing_path: '/', referrer_host: 'google.com', ... }
[Analytics] Tracked: web.link_clicked { link_url: '/about', link_text: 'Learn More' }
[Analytics] Page viewed: /campaigns
[Analytics] Sent batch of 5 events to /analytics/ingest
```

### Testing

Analytics is mocked in tests:

```typescript
import { useAnalytics } from '@/analytics';

// In tests, useAnalytics returns a mock client
const analytics = useAnalytics();
analytics.track('web.link_clicked', { ... });

// Verify tracking was called
expect(analytics.track).toHaveBeenCalledWith('web.link_clicked', { ... });
```

## Configuration

### Environment Variables

- `VITE_ANALYTICS_INGEST_URL` - Analytics ingest endpoint (default: `/analytics/ingest`)

### Source Configuration

Override source configuration in `AnalyticsProvider`:

```typescript
<AnalyticsProvider
  source={{
    appId: 'custom-app-id',
    appVersion: '2.0.0',
  }}
>
  <App />
</AnalyticsProvider>
```

## Troubleshooting

### Events not sending

1. Check consent: `analytics: true` is required
2. Check browser console for validation errors
3. Verify ingest endpoint is accessible
4. Check network tab for failed requests

### Validation errors

Events must pass validation:
- Event name must be in SKU registry
- Properties must be snake_case
- Required properties must be present

### Session not persisting

- SessionStorage may be disabled (private browsing)
- Falls back to in-memory session ID
- New session ID on each page refresh
