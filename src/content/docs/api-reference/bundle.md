---
title: bundle
description: API reference for bundle()
---

Declares a group of services that load lazily on first access. Designed for code splitting via dynamic `import()`.

## Signature

```ts
function bundle<
    const IIDs extends AsyncIID<any, any>[],
    const Deps extends ServiceDeps = [],
>(params: {
    provide: IIDs;
    dependencies?: Deps;
    load(context: Container<Deps[number]>): Promise<Container<any>>;
    maxRetries?: number;
    retryDelayMs?: number;
}): ServiceBundle<IIDs[number], Deps>
```

## Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|---|
| `provide` | `AsyncIID[]` | Yes | — | IIDs this bundle provides. **Only these IIDs are exposed to the parent** — sub-services not listed here are silently dropped. Must all be `AsyncIID`. |
| `dependencies` | `InterfaceId[]` | No | `[]` | IIDs this bundle depends on from the parent container. |
| `load` | `(context: Container<Deps>) => Promise<Container>` | Yes | — | Async function returning a container with sub-services. |
| `maxRetries` | `number` | No | `2` (from config) | Max retries on bundle load failure. |
| `retryDelayMs` | `number` | No | `1000` (from config) | Base delay in ms, doubled after each attempt. |

## Return Value

A `ServiceBundle` branded object accepted by `createContainer()`.

## Examples

### Basic Bundle

```ts
bundle({
    provide: [ANALYTICS, TELEMETRY],
    load: async () => {
        const mod = await import("./analytics-bundle");
        return mod;  // returns Container<any>
    },
});
```

### Bundle with Dependencies

```ts
bundle({
    provide: [DASHBOARD_SVC],
    dependencies: [DB, CONFIG],
    load: async (c) => {
        const db = c.get(DB);
        const config = c.get(CONFIG);
        const mod = await import("./dashboard");
        return createContainer({
            name: "dashboard",
            services: mod.createServices(db, config),
        });
    },
});
```

### Bundle with Retry

```ts
bundle({
    provide: [REMOTE_SVC],
    load: async () => {
        const resp = await fetch("/remote-bundle.js");
        const code = await resp.text();
        return evalModule(code);
    },
    maxRetries: 3,
    retryDelayMs: 2000,
});
```

### Nested Bundles

```ts
bundle({
    provide: [FEATURE_GROUP],
    load: async () => createContainer({
        name: "feature-group",
        services: [
            factory({ provide: CORE_SVC, load: () => new CoreSvc() }),
            bundle({
                provide: [SUB_FEATURE],
                load: () => import("./sub-feature"),
            }),
        ],
    }),
});
```

## Runtime Behavior

1. All `provide` IIDs are registered in the parent container's service map with status `"pending"`.
2. On first `fetch()` of any provided IID, `load` is invoked.
3. **Concurrent guard**: if another `fetch()` arrives while the bundle is loading, it waits for the same promise.
4. **Circular detection**: if the bundle's `load` re-enters itself, an `AsimoError` is thrown.
5. **Scope filtering**: only sub-service entries whose namespace matches an IID in `provide` are merged into the parent's service map. Other entries in the sub-container are silently dropped and remain inaccessible from the parent.
6. The requested IID is resolved using the now-merged factory/bundle entry.

## Compile-Time Constraints

| Constraint | Behavior |
|---|---|
| `provide` must be `AsyncIID[]` | `SyncIID` rejected |
| `dependencies` must be registered in parent | `ServiceDependencyNotRegistered` error |
| `load` must return `Promise<Container<any>>` | Type error on mismatch |

## Bundle vs Factory

|  | `factory()` | `bundle()` |
|---|---|---|
| **Loading** | Single service | Group of services |
| **Timing** | On first access | On first access to any provided IID |
| **IID types** | Sync or Async | Async only |
| **Use case** | Individual services | Code splitting, lazy feature loading |
| **Return from `load`** | `T` or `Promise<T>` | `Promise<Container<any>>` |

## Related

- [factory()](/api-reference/factory) — Single-service declaration
- [Core Concepts: Bundles](/core-concepts/bundles)
- [Progressive Loading Guide](/guides/progressive-load)
