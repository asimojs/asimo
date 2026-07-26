---
title: Retry & Errors
description: Understanding asimo's retry mechanism and error types
---

asimo provides automatic retry with exponential backoff for asynchronous service loading, plus a structured error API for debugging.

## Retry Mechanism

Retry applies to async factories and bundles — not sync factories (sync factories execute once and their result is cached).

### Configuration Levels

Retry can be configured at two levels, in order of precedence:

1. **Per-service** (highest priority)
2. **Per-container** via `AsimoConfig`

If none of these configurations are provided, the **built-in default** will be used: 2 retries, 1000ms base delay

```ts
// 1. Per-service
factory({
    provide: UNSTABLE_SVC,
    load: async () => mightFail(),
    maxRetries: 5,
    retryDelayMs: 500,
});

// 2. Per-container
const app = createContainer({
    name: "app",
    config: {
        maxRetries: 3,
        retryDelayMs: 2000,
    },
    services: [...],
});
```

Note: to share the same configuration across the application, the standard practice 
is to define a global `config` singleton and inject it in each container:

```ts
import { config } from "./container-config";

const app = createContainer({
    name: "app",
    config,
    services: [...],
});
```

### Exponential Backoff Formula

```
delay(n) = baseDelay * 2^n

Example with baseDelay = 1000ms, maxRetries = 3:
  Attempt 1: immediate
  Attempt 2: 1000ms delay
  Attempt 3: 2000ms delay
  Attempt 4: 4000ms delay
  → Total: 4 attempts (1 + 3 retries)
```

### What Gets Retried

- Async factory `load()` that throws a non-`AsimoError`.
- Bundle `load()` that throws a non-`AsimoError`.

### What Does NOT Get Retried

- **`AsimoError`** — these are structural errors (service not found, circular bundle) and retrying would not help.
- **Sync factories** — retry params on a sync factory produce a compile-time error.

```ts
factory({
    provide: SYNC_IID,
    maxRetries: 3,  // ❌ TypeScript error: RetryNotSupportedForSyncIID
});
```

## Error Types

### `AsimoError`

Thrown for runtime configuration errors — primarily "service not found" and circular bundle detection.

```ts
import { AsimoError } from "@asimojs/asimo";
```

> **"Service not found" is not a normal runtime concern.**  
> If types are properly used (IIDs declared in `dependencies`, no `any` casts), TypeScript catches missing services at compile time via `ServiceDependencyNotRegistered`. An `AsimoError` for "Service not found" at runtime means types were bypassed — for instance by calling `container.get()` with an unregistered IID through a `Container<any>` reference, or by using `getOptional`/`fetchOptional` without a proper fallback.

```ts
// This compiles — but will throw at runtime because the IID is not registered.
// The compiler only protects you when dependencies are declared in factory()/bundle().
const c: Container<any> = createContainer({ name: "empty" });
c.get(SOME_IID); // throws AsimoError at runtime
```

In contrast, **circular bundle detection** is always a runtime concern (bundles depend on dynamic `import()` chains that can't be validated at compile time).

Properties:
- `message` — prefixed with `[Asimo]`, includes the container path
- `container` — the container path where the error occurred
- `name` — `"AsimoError"`

### `AsimoLoadError`

A subclass of `AsimoError` thrown when a service load fails after exhausting retries:

```ts
import { AsimoLoadError } from "@asimojs/asimo";

try {
    await container.fetch(UNSTABLE_SVC);
} catch (err) {
    if (err instanceof AsimoLoadError) {
        console.log(err.message);  // "[Asimo] Load failed for ... after 4 attempts at /app"
        console.log(err.container); // "/app"
        console.log(err.cause);    // The original error that caused the failure
        console.log(err.name);     // "AsimoLoadError"
    }
}
```

## Lifecycle Hooks

`AsimoConfig` provides two hooks for observing service loading:

```ts
const app = createContainer({
    name: "app",
    config: {
        onLoad(iid, container) {
            // Called when a service loads successfully (factory or bundle)
            console.log(`Service loaded: ${iid.ns} in ${container.path}`);
        },
        onError(error, container) {
            // Called when an AsimoError occurs during loading
            console.error(`Error in ${container.path}: ${error.message}`);
        },
    },
    services: [...],
});
```

- **`onLoad`** — fires at most once per `(iid, container)` pair on successful load. Useful for instrumentation, logging, or performance tracking.
- **`onError`** — fires whenever an `AsimoError` is thrown during service resolution. Use for error reporting or graceful degradation.

## Error Messages

All asimo errors include the failing container path, making them easy to trace in complex hierarchies:

```
[Asimo] Service not found: app.services.Missing at /app/feature-a/request-42
```

This tells you:
- The service `app.services.Missing` could not be found
- The error occurred in the container at path `/app/feature-a/request-42`
- The full parent chain: root `app` → child `feature-a` → child `request-42`

> A "Service not found" error at runtime means the type system was bypassed (e.g., `Container<any>`, `any`-typed IIDs, or `getOptional` without a null check). With proper typing, the compiler catches missing services before the code runs.
