---
title: factory
description: API reference for factory()
---

Declares a service with optional dependencies. The `load` function is invoked once — on first access — and its return value is cached.

## Signature

```ts
function factory<
    const IID extends InterfaceId<any, any>,
    const Deps extends ServiceDeps = [],
>(params: {
    provide: IID;
    dependencies?: Deps;
    load(context: Container<Deps[number]>): IID extends SyncIID<infer T, any> ? T
                                 : IID extends AsyncIID<infer T, any> ? Promise<T>
                                 : never;
    maxRetries?: IID extends SyncIID<any, any> ? RetryNotSupportedForSyncIID : number;
    retryDelayMs?: IID extends SyncIID<any, any> ? RetryNotSupportedForSyncIID : number;
}): ServiceFactory<IID, Deps>
```

## Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `provide` | `InterfaceId<T>` | Yes | — | The IID token this factory provides. |
| `dependencies` | `InterfaceId[]` | No | `[]` | IIDs this service depends on. Types `load`'s context. |
| `load` | `(context: Container<Deps>) => T \| Promise<T>` | Yes | — | Factory function, called once on first access. |
| `maxRetries` | `number` | No | `2` (from config) | Max retries on load failure. Only for async IIDs. |
| `retryDelayMs` | `number` | No | `1000` (from config) | Base delay in ms, doubled after each attempt. Only for async IIDs. |

## Return Value

A `ServiceFactory<IID, Deps>` branded object accepted by `createContainer()`.

## Examples

### Sync Factory

```ts
factory({
    provide: LOGGER,
    load: () => ({
        log: (msg: string) => console.log(msg),
    }),
});
```

### Async Factory

```ts
factory({
    provide: CONFIG,
    load: async () => {
        const resp = await fetch("/config.json");
        return resp.json();
    },
});
```

### Factory with Dependencies

```ts
factory({
    provide: CALCULATOR,
    dependencies: [MULTIPLIER, ADDER],
    load: (c) => {
        const multiply = c.get(MULTIPLIER);
        const add = c.get(ADDER);
        return { multiply, add };
    },
});
```

### Factory with Retry

```ts
factory({
    provide: UNSTABLE_SVC,
    load: async () => {
        const result = await unreliableCall();
        return result;
    },
    maxRetries: 5,
    retryDelayMs: 500,
});
```

## Runtime Behavior

1. On first `get()`/`fetch()` of the IID, `load` is invoked.
2. Sync factories: result is cached immediately and returned synchronously.
3. Async factories: a `Promise` is cached first, then replaced with the resolved value.
4. Cached values are returned on subsequent accesses — `load` is never called twice for the same IID + container pair.

## Compile-Time Constraints

| Constraint | Behavior |
|---|---|
| `provide` must be `SyncIID` or `AsyncIID` | Type error on invalid token |
| `dependencies` must be registered in container or parents | `ServiceDependencyNotRegistered` error |
| `maxRetries` on `SyncIID` | `RetryNotSupportedForSyncIID` error |
| `retryDelayMs` on `SyncIID` | `RetryNotSupportedForSyncIID` error |
| `load` return must match IID's `<T>` | Type error on mismatch |

## Related

- [bundle()](/api-reference/bundle) — Lazy-loading group of services
- [Container.get() / fetch()](/api-reference/container) — Retrieving services
- [Core Concepts: Factories](/core-concepts/factories)
