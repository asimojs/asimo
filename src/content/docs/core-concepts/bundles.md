---
title: Bundles
description: Lazy-loading groups of services with bundle()
---

Bundles group related services that load together lazily — on first access, not at container creation. They are the key to code splitting and progressive loading with asimo.

## Why Bundles?

Without bundles, all services in a container are registered eagerly. With bundles, you defer loading until the service is actually needed:

```ts
// Without bundles: analytics loads at startup even if never used
factory({ provide: ANALYTICS, load: () => createAnalytics() })

// With bundles: analytics loads only when first accessed
bundle({ provide: [ANALYTICS], load: () => import("./analytics") })
```

## Creating a Bundle

```ts
import { bundle } from "@asimojs/asimo";

const analyticsBundle = bundle({
    provide: [ANALYTICS, TELEMETRY],
    load: async () => {
        const mod = await import("./analytics-bundle");
        return mod;  // returns Container<any>
    },
});
```

### Bundle Rules

- **`provide` must be `AsyncIID[]`** — `SyncIID` tokens are rejected at compile time.
- **`load` is async** — returns a `Promise<Container<any>>` containing the sub-services.
- **A bundle loads once** — concurrent requests for the same bundle wait for the first load to complete.

## Bundle with Dependencies

Bundles can declare dependencies on the parent container, typing the `load` context:

```ts
bundle({
    provide: [DASHBOARD_SERVICE],
    dependencies: [DB, CONFIG],
    load: async (c) => {
        const db = c.get(DB);        // from parent container
        const config = c.get(CONFIG); // from parent container
        const mod = await import("./dashboard");
        return createContainer({
            name: "dashboard",
            services: mod.createServices(db, config),
        });
    },
});
```

## Nested Bundles

A bundle's `load()` can return a container that itself contains bundles:

```ts
bundle({
    provide: [HEAVY_FEATURE],
    load: async () => {
        const mod = await import("./feature");
        return createContainer({
            name: "feature",
            services: [
                // Sub-bundles load lazily within the parent bundle's scope
                bundle({
                    provide: [SUB_SERVICE],
                    load: () => import("./sub-service"),
                }),
                factory({ provide: CORE, load: () => mod.core }),
            ],
        });
    },
});
```

When `HEAVY_FEATURE` is fetched, the top-level bundle loads. `SUB_SERVICE` loads later, on its own first access.

## How Bundles Work Internally

1. On `container.fetch(SOME_IID)`, asimo looks up the service map.
2. If the entry is marked as a bundle (status: `"pending"`), `loadBundleAndResolve()` is called.
3. **Concurrent access guard**: if the bundle is already loading, the second caller waits for the existing load promise.
4. **Circular detection**: if a bundle's own `load` call re-enters the same bundle, an `AsimoError` is thrown.
5. **Merge**: the sub-container's service entries are merged into the parent's service map.
6. The requested service is resolved from the now-merged entries.

## Scope Filtering

Only IIDs listed in the bundle's `provide` array are exposed to the parent container. Services in the sub-container that are **not** listed in `provide` are silently dropped:

```ts
bundle({
    provide: [ANALYTICS],                   // only ANALYTICS is accessible
    load: async () => {
        const mod = await import("./analytics");
        return createContainer({
            name: "analytics",
            services: [
                factory({ provide: ANALYTICS, load: () => mod.analytics }),
                factory({ provide: TELEMETRY, load: () => mod.telemetry }),
                // ↑ TELEMETRY is created but NOT exposed to the parent
            ],
        });
    },
});

// ✅ ANALYTICS is accessible
const a = await container.fetch(ANALYTICS);

// ❌ TELEMETRY is not in provide — throws Service not found
const t = await container.fetch(TELEMETRY);
```

This scoping is intentional — the bundle's `provide` array is the authoritative list of what the bundle exports. The sub-container may contain additional internal services (helpers, shared dependencies, etc.) that should not leak into the parent. Use `provide` to control exactly which IIDs are made available.

## Bundle Retry

Bundles support the same retry mechanism as async factories:

```ts
bundle({
    provide: [UNRELIABLE_SERVICE],
    load: async () => import("./unreliable"),
    maxRetries: 3,
    retryDelayMs: 2000,
});
```

## Code Splitting Pattern

The canonical use case for bundles is code splitting with dynamic `import()`:

```
src/
├── services/
│   ├── core-bundle.ts        # Always loaded (config, logger, DB)
│   ├── auth-bundle.ts        # Loaded on first auth action
│   ├── analytics-bundle.ts   # Loaded on first track() call
│   └── dashboard-bundle.ts   # Loaded when user opens dashboard
```

```ts
// app.ts — minimal startup, everything else lazy
const app = createContainer({
    name: "app",
    services: [
        // Core: loaded eagerly
        factory({ provide: CONFIG, load: () => loadConfig() }),
        factory({ provide: LOGGER, load: () => createLogger() }),

        // Feature bundles: loaded on demand
        bundle({ provide: [AUTH_SVC], load: () => import("./auth-bundle") }),
        bundle({ provide: [ANALYTICS], load: () => import("./analytics-bundle") }),
        bundle({ provide: [DASHBOARD], load: () => import("./dashboard-bundle") }),
    ],
});
```

The browser downloads `app.js` (~3 KB + core services) and loads feature code as users interact with the application.

## Decoupling Declaration from Strategy

Bundle creation is separate from service code — service authors declare their dependency as an `asyncIID`, and bundle authors define the loading strategy independently:

```ts
// auth-service.ts — service author declares the IID
export const AUTH_SVC = asyncIID<AuthService>()("app.services.Auth");

// auth-bundle.ts — bundle author defines loading strategy
export const authBundle = bundle({
    provide: [AUTH_SVC],
    load: () => import("./auth-service-impl"),
});
```

This separation means you can change how services are grouped, split, and loaded without touching the service implementations or their consumers. A service that starts as a standalone bundle can be merged into a larger bundle, split across multiple bundles, or have its retry policy adjusted — all by editing the bundle definition, not the application code.
