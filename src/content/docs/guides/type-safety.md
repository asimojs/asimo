---
title: Type Safety
description: Compile-time guarantees provided by asimo's type system
---

asimo's type system enforces correctness at compile time rather than runtime. This page catalogs every compile-time error the library produces and explains what each one means.

## IID Token Type Safety

### Async IID Rejected by `get()`

```ts
const CONFIG = asyncIID<Config>()("app.Config");

// ❌ TypeScript error: AsyncIID is not assignable to SyncIID
const config = container.get(CONFIG);
```

**Fix**: Use `container.fetch(CONFIG)` or `await container.fetch(CONFIG)`.

### Sync IID Accepted by Both

```ts
const LOGGER = syncIID<Logger>()("app.Logger");

// ✅ Both work
const logger = container.get(LOGGER);
const logger2 = await container.fetch(LOGGER);
```

## Dependency Registration

### Missing Dependency at Compile Time

When a `dependencies` entry is not registered in the container or its parents, asimo produces a descriptive compile error:

```ts
factory({
    provide: SERVICE,
    dependencies: [NEVER_REGISTERED],
    load: (c) => { ... },
});

// ❌ TypeScript error:
// ServiceDependencyNotRegistered<"myapp.services.NeverRegistered">
// "Declared dependency not registered in this container or its parents"
```

The error message includes the **exact namespace** of the missing IID, making it easy to identify which dependency needs to be registered.

### Dependency Scope Enforcement

The `load` context is typed with exactly the listed dependencies:

```ts
factory({
    provide: SERVICE,
    dependencies: [MULTIPLIER, ADDER],
    load: (c) => {
        c.get(MULTIPLIER);  // ✅ type: (a,b) => number
        c.get(ADDER);       // ✅ type: (a,b) => number
        c.get(DIVIDER);     // ❌ TypeScript error: DIVIDER is not accessible
    },
});
```

Accessing an unlisted dependency from the `load` context produces a type error. This prevents implicit (undeclared) dependencies.

## Brand Symbol Enforcement

### Inline Object Literals Rejected

`createContainer()` only accepts services produced by `factory()` or `bundle()`. Inline object literals are rejected at compile time:

```ts
// ❌ TypeScript error: missing __asimoServiceFactory brand
createContainer({
    name: "app",
    services: [
        { provide: LOGGER, load: () => ({ log: console.log }) },
    ],
});
```

**Fix**: Always wrap services with `factory()`:

```ts
createContainer({
    name: "app",
    services: [
        factory({ provide: LOGGER, load: () => ({ log: console.log }) }),
    ],
});
```

## Retry Parameter Constraints

### Retry on Sync IID

Retry parameters (`maxRetries`, `retryDelayMs`) are only valid on async IIDs:

```ts
const ID = syncIID<SomeType>()("app.SomeType");

factory({
    provide: ID,
    maxRetries: 3,  // ❌ TypeScript error: RetryNotSupportedForSyncIID
});
```

**Fix**: Remove retry params or switch to `asyncIID`.

## Bundle Constraints

### Sync IID in Bundle

Bundles can only provide `AsyncIID` tokens:

```ts
const SYNC = syncIID<SomeType>()("app.Sync");
const ASYNC = asyncIID<SomeType>()("app.Async");

bundle({
    provide: [ASYNC],      // ✅
});

bundle({
    provide: [SYNC, ASYNC], // ❌ TypeScript error: SYNC is not an AsyncIID
});
```

**Fix**: Only use `AsyncIID` tokens in `bundle().provide`.

### Bundle Dependencies Must Be Registered

Same rule as factories — bundle dependencies must exist in the parent container:

```ts
bundle({
    provide: [FEATURE],
    dependencies: [MISSING_DEP],  // ❌ TypeScript error
});
```

## Return Type Enforcement

The `load` return type is checked against the IID's type parameter:

```ts
interface Calculator { compute(a: number, b: number): number; }
const CALC = syncIID<Calculator>()("app.Calc");

factory({
    provide: CALC,
    load: () => ({ wrong: true }),  // ❌ not assignable to Calculator
});
```

## Container Name Constraints

Names containing `/` are rejected at runtime (not compile time):

```ts
createContainer({ name: "my/container" });  // throws at runtime
```

## Summary

| Error | Level | Message |
|---|---|---|
| AsyncIID on `get()` | Compile | Not assignable to SyncIID |
| Missing dependency | Compile | `ServiceDependencyNotRegistered<"ns">` |
| Undeclared dep in factory | Compile | Property not on Container |
| Inline object literal | Compile | Missing `__asimoServiceFactory` brand |
| Retry on sync IID | Compile | `RetryNotSupportedForSyncIID` |
| SyncIID in bundle | Compile | Not assignable to AsyncIID |
| Wrong return type | Compile | Not assignable to interface type |
| Name with `/` | Runtime | Container name must not contain forward slashes |
| Service not found (`AsimoError`) | Runtime | Indicates types were bypassed — see [Retry & Errors](/core-concepts/retry-and-errors#asimoerror) |
