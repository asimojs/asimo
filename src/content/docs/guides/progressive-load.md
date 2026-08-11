---
title: Progressive Loading
description: Code splitting and lazy service activation with asimo bundles
---

Progressive loading means shipping the minimum code needed for initial render, then loading additional services on demand. asimo's `bundle()` makes this idiomatic.

## The Pattern

```
Initial load (~3 KB + core)
    ↓
User interacts
    ↓
Feature bundle loaded on first access
    ↓
Deferred services activate
```

## Basic Code Splitting

Structure your application so that each feature lives in its own chunk:

```ts
// app.ts — entry point, only core services
import { createContainer, factory, bundle } from "@asimojs/asimo";

const app = createContainer({
    name: "app",
    services: [
        // Eager: always needed
        factory({ provide: [CONFIG], load: () => loadConfig() }),
        factory({ provide: [LOGGER], load: () => createLogger() }),

        // Lazy: loaded on first access
        bundle({ provide: [ANALYTICS], load: () => import("./analytics-bundle") }),
        bundle({ provide: [AUTH], load: () => import("./auth-bundle") }),
        bundle({ provide: [DASHBOARD], load: () => import("./dashboard-bundle") }),
    ],
});
```

Each `import()` call creates a separate code-split chunk. Vite, webpack, and other bundlers handle this automatically.

## Feature Bundle Structure

A bundle module exports an `Container` with services registered:

```ts
// analytics-bundle.ts
import { createContainer, factory } from "@asimojs/asimo";
import { ANALYTICS, TRACKER } from "./types";

export default createContainer({
    name: "analytics",
    services: [
        factory({
            provide: [ANALYTICS],
            load: async () => {
                const lib = await import("expensive-analytics-lib");
                return new Analytics(lib.init());
            },
        }),
        factory({
            provide: [TRACKER],
            dependencies: [ANALYTICS],
            load: (c) => new Tracker(c.get(ANALYTICS)),
        }),
    ],
});
```

## Skeleton + Progressive Hydration

Render a functional UI immediately, then progressively enhance as services load:

```tsx
function App() {
    return (
        <Suspense fallback={<Skeleton />}>
            <HydratedDashboard />
        </Suspense>
    );
}

function HydratedDashboard() {
    // Triggers bundle load — shows skeleton until ready
    const analytics = useService(ANALYTICS); // custom hook wrapping fetch()
    return <Dashboard analytics={analytics} />;
}
```

The user sees the skeleton immediately. The analytics bundle loads in the background. When ready, the skeleton is replaced.

## Route-Based Splitting

Load feature bundles based on routes:

```ts
// router.ts
async function loadRoute(route: string) {
    switch (route) {
        case "/dashboard":
            return app.fetch(DASHBOARD_SERVICE); // triggers dashboard bundle
        case "/settings":
            return app.fetch(SETTINGS_SERVICE);  // triggers settings bundle
        default:
            return app.fetch(HOME_SERVICE);
    }
}
```

## Conditional Bundle Loading

Load heavy services only when needed:

```ts
async function trackEvent(event: Event) {
    // Analytics bundle loads on first tracked event — not at startup
    const analytics = await app.fetch(ANALYTICS);
    analytics.track(event);
}

async function exportReport() {
    // Report bundle loads only when user clicks "Export"
    const reporter = await app.fetch(REPORT_EXPORTER);
    return reporter.exportPDF();
}
```

## Measuring Impact

Use `config.onLoad` to track when services activate:

```ts
const metrics: Array<{ ns: string; time: number }> = [];

const app = createContainer({
    name: "app",
    config: {
        onLoad(iids) {
            iids.forEach(i => metrics.push({ ns: i.ns, time: Date.now() }));
        },
    },
    services: [...],
});

// Later: analyze which services loaded, when, and their impact on TTI
console.table(metrics);
```

## Bundle Dependencies

Bundles can depend on eagerly-loaded services to avoid circular import chains:

```ts
// Core: loaded at startup
factory({ provide: [DB], load: () => createPool() })
factory({ provide: [AUTH], load: () => createAuth() })

// Feature: loaded on demand, gets DB and AUTH from the parent
bundle({
    provide: [DASHBOARD],
    dependencies: [DB, AUTH],
    load: async (c) => {
        const db = c.get(DB);
        const auth = c.get(AUTH);
        return import("./dashboard").then(m => m.createContainer(db, auth));
    },
});
```

## Trade-offs

| Approach | Pros | Cons |
|---|---|---|
| **Eager loading** | All services immediately available | Larger initial bundle, slower startup |
| **Per-feature bundles** | Minimal startup, code split by feature | Small delay on first feature access |
| **Fine-grained bundles** | Smallest chunks, most granular loading | More HTTP requests, more bundle coordination |
