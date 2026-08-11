---
title: factory
description: API reference for factory()
---

Declares a service with optional dependencies. The `load` function is invoked once — on first access — and its return value is cached. `provide` is an array of IIDs — the service must implement all of them (multiple IIDs must be used when a service implements multiple interfaces).

## Signature

```ts
function factory<
    const IIDs extends InterfaceId<any, any>[],
    const Deps extends ServiceDeps = [],
>(params: {
    provide: IIDs;
    dependencies?: Deps;
    load(context: Container<Deps[number]>):
        Extract<IIDs[number], AsyncIID<any, any>> extends never
            ? IIDs[number] extends InterfaceId<infer T> ? UnionToIntersection<T> : never
            : Promise<...UnionToIntersection...>;
    maxRetries?: Extract<IIDs[number], AsyncIID<any, any>> extends never ? RetryNotSupportedForSyncIID : number;
    retryDelayMs?: Extract<IIDs[number], AsyncIID<any, any>> extends never ? RetryNotSupportedForSyncIID : number;
}): ServiceFactory<IIDs, Deps>
```

## Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `provide` | `InterfaceId[]` | Yes | — | Array of IID tokens this factory provides. Must be an array, even for a single IID. |
| `dependencies` | `InterfaceId[]` | No | `[]` | IIDs this service depends on. Types `load`'s context. |
| `load` | `(context: Container<Deps>) => T \| Promise<T>` | Yes | — | Factory function, called once on first access. The return value must implement all provided IIDs. |
| `maxRetries` | `number` | No | `2` (from config) | Max retries on load failure. Only for factories with at least one async IID. |
| `retryDelayMs` | `number` | No | `1000` (from config) | Base delay in ms, doubled after each attempt. Only for factories with at least one async IID. |

## Return Value

A `ServiceFactory<IIDs, Deps>` branded object accepted by `createContainer()`.

## Examples

### Sync Factory

```ts
factory({
    provide: [LOGGER],
    load: () => ({
        log: (msg: string) => console.log(msg),
    }),
});
```

### Async Factory

```ts
factory({
    provide: [CONFIG],
    load: async () => {
        const resp = await fetch("/config.json");
        return resp.json();
    },
});
```

### Factory with Dependencies

```ts
factory({
    provide: [CALCULATOR],
    dependencies: [MULTIPLIER, ADDER],
    load: (c) => {
        const multiply = c.get(MULTIPLIER);
        const add = c.get(ADDER);
        return { multiply, add };
    },
});
```

### Factory with Multiple IIDs

When a single service implements several interfaces:

```ts
factory({
    provide: [MULTIPLIER, DIVIDER],
    dependencies: [],
    load: () => ({
        multiply: (a, b) => a * b,
        divide: (a, b) => a / b,
    }),
});
```

### Factory with Retry

```ts
factory({
    provide: [UNSTABLE_SVC],
    load: async () => {
        const result = await unreliableCall();
        return result;
    },
    maxRetries: 5,
    retryDelayMs: 500,
});
```

## Runtime Behavior

1. On first `get()`/`fetch()` of any provided IID, `load` is invoked once.
2. The same instance is cached for all IIDs provided by the factory.
3. Sync factories: result is cached immediately and returned synchronously.
4. Async factories: a `Promise` is cached first, then replaced with the resolved value.
5. Cached values are returned on subsequent accesses — `load` is never called twice for the same factory.

## Compile-Time Constraints

| Constraint | Behavior |
|---|---|
| `provide` must be `SyncIID` or `AsyncIID` | Type error on invalid token |
| `dependencies` must be registered in container or parents | `ServiceDependencyNotRegistered` error |
| `maxRetries` when all IIDs are sync | `RetryNotSupportedForSyncIID` error |
| `retryDelayMs` when all IIDs are sync | `RetryNotSupportedForSyncIID` error |
| `load` return must match the intersection of all IID types | Type error on mismatch |

## Related

- [bundle()](/api-reference/bundle) — Lazy-loading group of services
- [Container.get() / fetch()](/api-reference/container) — Retrieving services
- [Core Concepts: Factories](/core-concepts/factories)
