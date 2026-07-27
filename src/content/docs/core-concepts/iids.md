---
title: IID Tokens
description: Understanding sync and async Interface ID tokens
---

IID tokens (Interface Identifier) are the backbone of asimo. They bind a TypeScript type to a unique namespace string, enabling fully typed service retrieval without manual type annotations.

## Creating an IID Token

```ts
import { syncIID, asyncIID } from "@asimojs/asimo";

// Sync IID — retrievable with container.get()
interface Logger { log(msg: string): void; }
const LOGGER = syncIID<Logger>()("app.services.Logger");

// Async IID — retrievable with container.fetch()
interface Config { apiUrl: string; }
const CONFIG = asyncIID<Config>()("app.services.Config");
```

## Sync vs Async Dependencies

asimo distinguishes two kinds of dependencies:

- **Sync dependencies** (`syncIID`) are services that are always available synchronously — things like loggers, configuration objects, or system API wrappers (e.g., a `DateProvider`). Their factories return a value directly, so they are retrieved with `container.get()`.
- **Async dependencies** (`asyncIID`) are services whose code should not be loaded until the moment they are actually needed — for instance, feature modules behind a `bundle()` that are fetched on demand with `container.fetch()`.

This split lets asimo enforce the boundary at compile time: trying to synchronously `get()` an async dependency is a type error. Conversely, you can always `fetch()` a sync dependency if needed, but the compiler reminds you which services truly require async handling.

| Feature | `syncIID<T>()` | `asyncIID<T>()` |
|---|---|---|
| **Retrieval method** | `container.get()` or `container.fetch()` | `container.fetch()` only |
| **Factory return** | `T` | `Promise<T>` |
| **Retry support** | No | Yes |
| **Allowed in `bundle().provide`** | No | Yes |

```ts
// AsyncIID cannot be used with get()
const config = container.get(CONFIG);           // ❌ TypeScript error

// Use fetch() for async IIDs
const config = await container.fetch(CONFIG);   // ✅

// Sync IIDs work with both
const logger = container.get(LOGGER);           // ✅ synchronous
const logger2 = await container.fetch(LOGGER);  // ✅ also works (wrapped in Promise)
```

## Namespace Convention

The namespace string (`"app.services.Config"`) must be **globally unique** within your application. Use a reverse-domain or dotted-path convention:

```
"app.services.Logger"        — app-level service
"app.features.auth.AuthSvc"  — feature-scoped service
"lib.utils.Fetch"            — shared library utility
```

The namespace is used as a runtime key for service lookup and appears in error messages and `container.dump()` output.

## Type Parameters

The `<T>` generic binds the TypeScript type to the token. When you retrieve the service, the return type is inferred from `T`:

```ts
const LOGGER = syncIID<Logger>()("app.logger");
const log = container.get(LOGGER);  // type: Logger — fully typed, no cast needed
```

## Choosing the Right IID

- Use **`syncIID`** when the service has to be loaded at application startup, or has a small code base: global logger, configuration services, system api wrappers...
- Use **`asyncIID`** when the service doesn't need to be loaded at application startup.

When in doubt, default to `asyncIID` — it's more flexible and works with both retrieval methods.

## Extracting the Interface Type

When you need to reference a service's type without importing its original interface, use the `InferType` helper:

```ts
import { InferType } from "@asimojs/asimo";

const LOGGER = syncIID<Logger>()("app.Logger");

class MyService {
    private logger: InferType<typeof LOGGER>;  // Logger
}
```

This is especially useful in class declarations, factory return types, or when the interface is defined alongside the IID token but not exported separately.
