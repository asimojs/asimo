---
title: Errors
description: API reference for AsimoError and AsimoLoadError
---

asimo provides two error classes for structured error handling.

## AsimoError

Thrown for runtime errors — primarily "service not found" and circular bundle detection.

```ts
import { AsimoError } from "@asimojs/asimo";
```

> **"Service not found" is caught at compile time** when types are used properly. With IIDs declared in `dependencies` and no `any` casts, TypeScript surfaces missing services as `ServiceDependencyNotRegistered` compile errors. A runtime `AsimoError` for "Service not found" only occurs when types are bypassed (e.g., `Container<any>`, `any`-typed IID tokens, or `getOptional`/`fetchOptional` without a fallback).

### Constructor

```ts
new AsimoError(message: string, container: string)
```

| Parameter | Type | Description |
|---|---|---|
| `message` | `string` | Error description (without prefix or path). |
| `container` | `string` | The container path where the error occurred. |

### Properties

| Property | Type | Description |
|---|---|---|
| `message` | `string` | Full error message: `"[Asimo] {message} at {container}"` |
| `name` | `string` | Always `"AsimoError"` |
| `container` | `string` | The container path where the error occurred. |
| `messagePrefix` | `string` | Always `"[Asimo] "` |

### Example

```ts
try {
    await container.fetch(FLAKY_SVC);
} catch (err) {
    if (err instanceof AsimoError) {
        // Structural error — circular bundle, invalid name, etc.
        console.log(err.container); // "/app"
    }
    if (err instanceof AsimoLoadError) {
        // Load failed after retries — err.cause has the original error
    }
}
```

### Common Messages

| Scenario | Message |
|---|---|
| Service not found | `"Service not found: {ns}"` |
| Circular bundle | `"Circular bundle loading detected for: {ns}"` |
| Invalid container name | `"Container name must not contain forward slashes"` |
| Corrupt service entry | `"Corrupt service entry in serviceMap"` |
| Missing brand symbol | `"is not assignable to type 'ServiceDependencyNotRegistered<...>'"` |

## AsimoLoadError

```ts
import { AsimoLoadError } from "@asimojs/asimo";
```

A subclass of `AsimoError` thrown when a service or bundle load fails after exhausting all retry attempts.

### Constructor

```ts
new AsimoLoadError(message: string, container: string, cause?: unknown)
```

| Parameter | Type | Description |
|---|---|---|
| `message` | `string` | Error description with attempt count. |
| `container` | `string` | The container path. |
| `cause` | `unknown` | The original error that caused the load failure. |

### Properties

| Property | Type | Description |
|---|---|---|
| `message` | `string` | Full error message with retry count: `"[Asimo] Load failed for \"{ns}\" after {n} attempts at {path}"` |
| `name` | `string` | Always `"AsimoLoadError"` |
| `container` | `string` | The container path. |
| `cause` | `unknown` | The original thrown value from the factory/bundle `load()` call. |
| `messagePrefix` | `string` | Always `"[Asimo] "` (inherited from `AsimoError`). |

### Example

```ts
try {
    await container.fetch(FLAKY_SVC);
} catch (err) {
    if (err instanceof AsimoLoadError) {
        // err.message   = "[Asimo] Load failed for \"app.FlakySvc\" after 4 attempts at /app"
        // err.container = "/app"
        // err.cause     = Error("something went wrong") — the original error
        // err.name      = "AsimoLoadError"
    }
}
```

## Error Hierarchy

```
Error
 └── AsimoError
      ├── message: "[Asimo] {msg} at {container}"
      ├── container: string
      ├── name: "AsimoError"
      └── AsimoLoadError
           ├── cause: unknown
           └── name: "AsimoLoadError"
```

## Using onError Hook

Instead of try/catch around every resolution, use `config.onError` for centralized error handling:

```ts
const app = createContainer({
    name: "app",
    config: {
        onError(error, container) {
            // All AsimoError instances flow through here
            console.error(`${error.name} in ${container.path}: ${error.message}`);

            if (error instanceof AsimoLoadError && error.cause) {
                console.error("Caused by:", error.cause);
            }
        },
    },
    services: [...],
});
```

## Related

- [Core Concepts: Retry & Errors](/core-concepts/retry-and-errors)
- [AsimoConfig](/api-reference/config)
