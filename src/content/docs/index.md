---
title: asimo
description: Type-safe asynchronous IoC for browser and server runtimes
---

**asimo** is a zero-dependency, fully type-safe Inversion of Control (IoC) container for TypeScript. It lets you declare typed service interfaces, wire dependencies with automatic type inference, and lazy-load code bundles on demand — all with compile-time safety guarantees.

**asimo** can be used both on the server and in the browser
- on the client-side, asimo allows to keep the application load time minimal by progressively loading application modules on-demand through dynamic imports.
- on the server-side, asimo allows to also reduce the application bootstrap time - especially when combined with fast node engines like bun - which allows to completely unload services when the traffic is non-existent.

```ts
import { syncIID, factory, createContainer } from "@asimojs/asimo";

interface Logger { log(msg: string): void; }
const LOGGER = syncIID<Logger>()("app.services.Logger");

const app = createContainer({
    name: "app",
    services: [
        factory({
            provide: LOGGER,
            load: () => ({ log: (msg) => console.log(`[app] ${msg}`) }),
        }),
    ],
});

const logger = app.get(LOGGER);  // type: Logger
logger.log("hello world");
```

## What Is an IoC Container?

An **Inversion of Control container** is a registry that wires up your application's services — you declare *what* each component needs, and the container handles *how* and *when* those dependencies are created and provided. Instead of scattering `new Something()` calls across your codebase (coupling every module to every dependency's implementation), you hand control to the container:

```
Without IoC:     Module A → imports Module B → constructs Module C
With IoC:        Module A → declares "I need B and C" → container injects them
```

This matters for three reasons:

1. **Testability** — swap real implementations for mocks by changing a single factory, no code changes elsewhere
2. **Decoupling** — modules depend on interfaces (IID tokens), not concrete classes or import paths
3. **Lifecycle control** — the container decides whether services are singletons, lazy-loaded, or request-scoped, independently of the modules themselves

asimo takes this further by making the container **type-safe at compile time** — a missing or miswired dependency is a TypeScript error, not a runtime crash — and adding **asynchronous lazy loading** as a first-class concept via bundles.


## Asimo key features

~2KB, zero dependencies, **full compile-time type safety**, lazy code-splitting bundles.


### Sync and Async Dependencies

asimo lets you declare whether a service is always-available or loaded on demand:

- **Sync services** (`syncIID`) are always ready — think loggers, config objects, date providers. Their factories return a value immediately, and you fetch them with `container.get()`.
- **Async services** (`asyncIID`) represent code that should only load when actually needed — typically feature modules behind a `bundle()` that wraps a dynamic `import()`. You fetch them with `container.fetch()`, which returns a Promise.

This split is enforced by the compiler: calling `get()` on an async IID is a TypeScript error, so you can't accidentally block on something that isn't loaded yet. The editor tells you which dependencies need async handling before you run the code.

### Full Compile-Time Safety

Dependency wiring mistakes don't have to be runtime bugs. asimo's type system catches them at build time:

- **Wrong dependency** — if a factory requests a service that isn't registered, you get a TypeScript error with the missing service name
- **Sync vs async mismatch** — calling `get()` on an async-only dependency or using retry options on a sync factory are flagged by the compiler
- **Invalid IID tokens** — inline object literals are rejected; only properly branded `syncIID()`/`asyncIID()` tokens are accepted

Your editor catches wiring errors as you type, before tests or users ever hit them.

### Automatic Dependency Inference

Declare what a service needs and the `load` context is typed automatically:

```ts
factory({
    provide: CALCULATOR,
    dependencies: [MULTIPLIER, ADDER],
    load: (c) => {
        const multiply = c.get(MULTIPLIER); // type: (a,b) => number
        const add = c.get(ADDER);           // type: (a,b) => number
    },
})
```

### Lazy Bundles for Code Splitting

Services in `bundle()` load only on first access, wrapping dynamic `import()` for progressive loading:

```ts
bundle({
    provide: [ANALYTICS, TELEMETRY],
    load: () => import("./heavy-module"),
})
```

```
Initial load (~2 KB + core services)
    ├── User navigates to /dashboard → dashboard bundle loads
    ├── User clicks "Export report" → report bundle loads
    └── User never visits /admin → admin bundle never loads
```

Concurrent-access safe, nested bundles supported, retry with exponential backoff. 

Note: **Bundle strategy is decoupled from service code** — you declare `asyncIID` tokens in your services and define or update loading groups separately without impacting the application code.

### Hierarchical Containers

Child containers inherit shared app-level singletons via `extends`:

```ts
const reqCtx = createContainer({
    name: "request-123",
    extends: [app],
    services: [/* request-scoped services */],
});
```

### Built for Testing

Every test creates its own isolated container — no global registries, no framework reset, zero setup/teardown. Mock any service by replacing a factory's `load` with a test double. Override only what needs mocking with `extends`. Handle optional services with `getOptional()`.

### Retry with Exponential Backoff

Async services automatically retry on failure — configurable per-service, per-container, or globally.

### Runs Everywhere

Works identically in browser, Node.js, Bun, Deno, and Cloudflare Workers.

## How It Compares

|  | asimo | Manual DI | Decorator-based (Inversify/TSyringe) |
|---|---|---|---|
| **Dependencies** | 0 | 0 | reflect-metadata + decorators |
| **Bundle size** | ~2 KB | N/A | ~15–50 KB |
| **Lazy loading** | Built-in `bundle()` | Manual | Limited |
| **Type safety** | Full compile-time | Partial | Partial |
| **Learning curve** | Low (3 concepts) | N/A | High (decorators, containers) |
| **Framework agnostic** | Yes | Yes | Yes |

## Asimo assessments

> This is a well-engineered, production-quality TypeScript IoC container. ~2KB gzipped, zero dependencies, runs everywhere. The type system design is its standout feature — compile-time dependency validation using branded error types is genuinely impressive.
> 
> **Overall Assessment: Excellent**
>
> — DeepSeek V4 Pro

> A focused, well-thought-out micro-IoC with a genuinely novel angle: pushing DI-correctness checks into the type system (sync/async split, dependency-registration branded errors, retry-only-on-async). Code quality is high and tests are serious — including type-level assertions, which most TS libraries neglect. Runtime logic is correct for the common paths; bundle de-duplication and parent-chain caching are handled carefully.
>
> — GLM-5.2

> The type-safety story is the standout feature — it pushes what would normally be runtime errors into the compiler, which is exactly what an IoC container should do.
>
> **Overall: A high-quality, well-engineered TypeScript IoC library**
> 
> — Minimax-M3

## Next Steps

- [Getting Started](/getting-started) — Your first container in 5 minutes
- [Core Concepts](/core-concepts/iids) — IID tokens, containers, factories, bundles
- [Guides](/guides/testing) — Testing, progressive loading, server-side usage
- [API Reference](/api-reference/createcontainer) — Complete API documentation
- [Agent Documentation](/agent-docs) — Guidelines for LLM code generation
