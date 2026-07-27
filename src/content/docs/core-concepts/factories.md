---
title: Factories
description: Declaring services with the factory() helper
---

Factories declare how a service is created. They are the building blocks of every asimo container.

## Basic Factory

```ts
import { factory } from "@asimojs/asimo";

factory({
    provide: LOGGER,
    load: () => ({ log: (msg: string) => console.log(msg) }),
});
```

The `provide` field accepts any IID token. The return type of `load` is type-checked against the IID's `<T>` generic.

## Sync vs Async Factory

The return type of `load` determines whether the service resolves synchronously or asynchronously:

```ts
// Sync factory — load returns T directly
factory({
    provide: MULTIPLIER,
    load: () => (a: number, b: number) => a * b,
});

// Async factory — load returns Promise<T>
factory({
    provide: CONFIG,
    load: async () => {
        const resp = await fetch("/config.json");
        return resp.json();
    },
});
```

## Factories with Dependencies

When a service needs other services, list them in `dependencies`. The `load` context is automatically typed:

```ts
factory({
    provide: CALCULATOR,
    dependencies: [MULTIPLIER, ADDER, DIVIDER],
    load: (c) => {
        // c is Container<typeof MULTIPLIER | typeof ADDER | typeof DIVIDER>
        const multiply = c.get(MULTIPLIER);  // type: (a,b) => number
        const add = c.get(ADDER);            // type: (a,b) => number
        const divide = c.get(DIVIDER);       // type: (a,b) => number

        return {
            multiply,
            add,
            divide,
            compute: (a, b) => divide(multiply(a, 2), add(b, 1)),
        };
    },
});
```

### Dependency Typing Rules

- **Dependencies must be registered** in the container or its parents — otherwise a compile-time error with the missing namespace is emitted.
- **The `load` context is scoped** — it only exposes the listed dependencies. Accessing an unlisted IID from the context produces a type error.
- **Optional dependencies** — if a dependency may not always be available, use `getOptional()` / `fetchOptional()` inside the factory body (but note: optional deps can't be type-checked at the `dependencies` level).

### Async Dependencies

Factories can mix sync and async dependencies. The `load` function chooses the right method:

```ts
factory({
    provide: SERVICE,
    dependencies: [SYNC_DEP, ASYNC_DEP],
    load: (c) => {
        const syncDep = c.get(SYNC_DEP);          // sync retrieval
        // Use fetch() inline for async deps:
    },
});
```

For fully async dependency resolution, make `load` async and use `fetch()`:

```ts
factory({
    provide: SERVICE,
    dependencies: [DB, CONFIG],
    load: async (c) => {
        const db = await c.fetch(DB);
        const config = await c.fetch(CONFIG);
        return new Service(db, config);
    },
});
```

## Retry Configuration

Async factories support automatic retry with exponential backoff:

```ts
factory({
    provide: FLICKERING_SERVICE,
    load: async () => unstableInit(),
    maxRetries: 5,        // default: 2 (from container config)
    retryDelayMs: 500,    // default: 1000 (from container config)
});
```

The delay doubles after each attempt: 500ms → 1000ms → 2000ms → 4000ms → 8000ms.

Retry parameters are **rejected at compile time** for sync IIDs:

```ts
factory({
    provide: syncID,         // SyncIID
    maxRetries: 3,           // ❌ TypeScript error: RetryNotSupportedForSyncIID
});
```

Retry defaults can be set at the container level via `AsimoConfig`.

## Brand Symbol

Factories produced by `factory()` carry a unique `Symbol` brand (`__asimoServiceFactory`). This prevents inline object literals from being accepted by `createContainer()`:

```ts
// ❌ Compile error: missing brand symbol
createContainer({
    name: "app",
    services: [
        { provide: LOGGER, load: () => ({ log: console.log }) },
    ],
});

// ✅ Correct: always use factory()
createContainer({
    name: "app",
    services: [
        factory({ provide: LOGGER, load: () => ({ log: console.log }) }),
    ],
});
```
