---
title: AsimoConfig
description: API reference for AsimoConfig — global retry defaults and lifecycle hooks
---

Configuration object passed to `createContainer()` as the `config` parameter.

A common practice is to define a **global singleton config** in a shared module and pass it to every container in the application. This ensures consistent retry defaults and lifecycle hooks across all containers without duplicating the configuration:

```ts
// container-config.ts
import type { AsimoConfig } from "@asimojs/asimo";

export const config: AsimoConfig = {
    maxRetries: 3,
    retryDelayMs: 500,
    onLoad(iid, container) {
        console.log(`[${container.path}] ${iid.ns} loaded`);
    },
    onError(error, container) {
        reportError(error, container.path);
    },
};
```

```ts
// containers.ts
import { config } from "./container-config";

const app = createContainer({ name: "app", config, services: [...] });
const requestCtx = createContainer({ name: "req-42", config, extends: [app], services: [...] });
```

Individual containers can still override specific properties through per-service `factory()` or `bundle()` settings when needed.

## Type

```ts
interface AsimoConfig {
    maxRetries?: number;
    retryDelayMs?: number;
    onLoad?: (iid: InterfaceId<any, any>, container: Container<any>) => void;
    onError?: (error: AsimoError, container: Container<any>) => void;
}
```

## Properties

### `maxRetries`

| Attribute | Value |
|---|---|
| Type | `number` |
| Default | `2` |
| Scope | Container-level default |

Maximum number of retry attempts when an async factory or bundle `load()` throws (excluding `AsimoError`). Overridable per-service/per-bundle.

```ts
createContainer({
    name: "app",
    config: { maxRetries: 5 },  // global default: 5 retries
    services: [
        factory({
            provide: SVC_A,
            load: async () => mightFail(),
            maxRetries: 10,  // per-service override: 10 retries
        }),
    ],
});
```

### `retryDelayMs`

| Attribute | Value |
|---|---|
| Type | `number` |
| Default | `1000` |
| Scope | Container-level default |

Base delay in milliseconds between retry attempts. Doubles after each attempt (exponential backoff). Overridable per-service/per-bundle.

```
delay(n) = retryDelayMs * 2^n

retryDelayMs = 1000:
  Attempt 1: immediate
  Attempt 2: 1000ms
  Attempt 3: 2000ms
  Attempt 4: 4000ms
```

### `onLoad`

```ts
(iid: InterfaceId<any, any>, container: Container<any>) => void
```

Callback invoked when a service or bundle loads successfully. Fires at most once per `(iid, container)` pair.

```ts
const app = createContainer({
    name: "app",
    config: {
        onLoad(iid, container) {
            console.log(`[${container.path}] ${iid.ns} loaded`);
        },
    },
});
```

Use cases:
- Performance monitoring (track time-to-load per service)
- Logging for debugging
- Triggering side effects after a critical service initializes

### `onError`

```ts
(error: AsimoError, container: Container<any>) => void
```

Callback invoked when an `AsimoError` is thrown during service resolution. Receives the error and the container reference.

```ts
const app = createContainer({
    name: "app",
    config: {
        onError(error, container) {
            if (error instanceof AsimoLoadError) {
                reportToMonitoring(error.cause, {
                    service: error.message,
                    container: error.container,
                });
            }
        },
    },
});
```

Use cases:
- Error reporting (Sentry, Datadog, etc.)
- Graceful degradation (fall back to a default service)
- Alerting on persistent load failures

## Precedence

```
Per-service/per-bundle > Container config > Global defaults
```

Retry values set on individual `factory()`/`bundle()` calls override the container config, which overrides the hardcoded defaults (maxRetries: 2, retryDelayMs: 1000).

## Related

- [createContainer()](/api-reference/createContainer)
- [Core Concepts: Retry & Errors](/core-concepts/retry-and-errors)
- [AsimoError / AsimoLoadError](/api-reference/errors)
