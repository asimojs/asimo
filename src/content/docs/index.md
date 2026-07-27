---
title: asimo
description: Type-safe asynchronous IoC for browser and server runtimes
---

**asimo** is a zero-dependency, fully type-safe Inversion of Control (IoC) container for TypeScript. It lets you declare typed service interfaces, wire dependencies with automatic type inference, and lazy-load code bundles on demand — all with compile-time safety guarantees.

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

## Why asimo?

### Zero Dependencies

No decorators, no `reflect-metadata`, no class registration. Pure TypeScript functions and inference. Adds ~2KB gzipped with no supply chain risk.

### Full Compile-Time Safety

asimo's type system catches wiring mistakes before your code runs:

- **Wrong dependency** → compile error with the namespace in the message
- **Sync IID on `get()` → ok**. Async IID on `get()` → compile error
- **Retry params on a sync factory** → compile error
- **Missing brand symbol** → compile error (no inline object literals)

### Automatic Dependency Inference

Declare what a service needs and the `load` context is typed automatically — no manual annotations:

```ts
factory({
    provide: CALCULATOR,
    dependencies: [MULTIPLIER, ADDER],
    load: (c) => {
        // c is Container<typeof MULTIPLIER | typeof ADDER>
        const multiply = c.get(MULTIPLIER); // type: (a,b) => number
        const add = c.get(ADDER);           // type: (a,b) => number
    },
})
```

### Sync and Async dependencies ###

asimo distinguishes two kinds of dependencies:
- **Sync dependencies** (`syncIID`) are services that are always available synchronously — things like loggers, configuration objects, or system API wrappers (e.g., a `DateProvider`). Their factories return a value directly, so they are retrieved with container.get().
- **Async dependencies** (`asyncIID`) are services whose code should not be loaded until the moment they are actually needed — for instance, feature modules behind a bundle() that are fetched on demand with container.fetch().
This split lets asimo enforce the boundary at compile time: trying to synchronously get() an async dependency is a type error. Conversely, you can always fetch() a sync dependency if needed, but the compiler reminds you which services truly require async handling.

### Lazy Bundles for Code Splitting

Services wrapped in `bundle()` load only when first accessed — perfect for progressive loading and dynamic `import()`:

```ts
bundle({
    provide: [ANALYTICS, TELEMETRY],
    load: () => import("./heavy-module"),
})
```

### Hierarchical Containers

Request-scoped child containers that inherit shared app-level singletons:

```ts
const reqCtx = createContainer({
    name: "request-123",
    extends: [app],            // inherits DB, Config, Logger
    services: [/* request-scoped services */],
});
```

### Test and Lazy-Loading

**Built for Testability.** Every test creates its own isolated container. No global registries, no DI framework reset between tests, no teardown boilerplate:

```ts
describe("UserService", () => {
    it("fetches user by ID", async () => {
        const container = createContainer({
            name: "test",
            services: [
                factory({
                    provide: DB,
                    load: () => ({ query: vi.fn().mockResolvedValue([{ id: 1 }]) }),
                }),
                factory({
                    provide: USER_SVC,
                    dependencies: [DB],
                    load: (c) => new UserService(c.get(DB)),
                }),
            ],
        });
        const svc = container.get(USER_SVC);
        expect(await svc.getUser(1)).toEqual({ id: 1 });
    });
});
```

- **Zero setup/teardown** — containers are garbage-collected when tests go out of scope
- **Mock any service** — replace a factory's `load` with a test double; no mocking framework required
- **Partial overrides via `extends`** — create a test container that inherits real services and overrides only what needs mocking
- **Optional dependencies with `getOptional`** — gracefully handle services that may not exist in a given test context - or optional configuration objects (e.g.
a widget library may have its default configuration defined through an optional Configuration Service)
- **Lifecycle hooks** — verify and optimize your application loading behavior with `config.onLoad` assertions

For applications with dozens of interdependent services, asimo eliminates the manual wiring and fragile global state that make tests hard to write and maintain.

**Progressive Code Loading.** In production, asimo's `bundle()` wraps dynamic `import()` so that features load only when the user needs them — not at startup:

```
Initial load (~2 KB + core services)
    ├── User navigates to /dashboard → dashboard bundle loads
    ├── User clicks "Export report" → report bundle loads
    └── User never visits /admin → admin bundle never loads
```

- **Smaller initial payload** — ship the core and defer everything else
- **Lazy by default** — a bundle's `load` is called once, on first `fetch()` of any provided service
- **Concurrent access safe** — concurrent requests for the same bundle wait for a single load
- **Nested bundles** — a loaded bundle can itself contain sub-bundles that load progressively deeper
- **Retry with backoff** — flaky bundle loads (network-bound dynamic imports) retry automatically

The same modular structure that makes testing easy — isolated containers per scope, services declared as factories with typed dependencies — is what enables progressive loading in production. You test features the same way they load: on demand, in isolation, with explicit boundaries.

### Retry with Exponential Backoff

Async services automatically retry on failure. Configurable per-service, per-container, or globally.

### Runs Everywhere

Works identically in the browser, Node.js, Bun, Deno, and Cloudflare Workers. Zero environment-specific code.

## How It Compares

|  | asimo | Manual DI | Decorator-based (Inversify/TSyringe) |
|---|---|---|---|
| **Dependencies** | 0 | 0 | reflect-metadata + decorators |
| **Bundle size** | ~3 KB | N/A | ~15–50 KB |
| **Lazy loading** | Built-in `bundle()` | Manual | Limited |
| **Type safety** | Full compile-time | Partial | Partial |
| **Learning curve** | Low (3 concepts) | N/A | High (decorators, containers) |
| **Framework agnostic** | Yes | Yes | Yes |


## Next Steps

- [Getting Started](/getting-started) — Your first container in 5 minutes
- [Core Concepts](/core-concepts/iids) — IID tokens, containers, factories, bundles
- [Guides](/guides/testing) — Testing, progressive loading, server-side usage
- [API Reference](/api-reference/createcontainer) — Complete API documentation
- [Agent Documentation](/agent-docs) — Guidelines for LLM code generation
