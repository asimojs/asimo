---
title: Getting Started
description: Install asimo and create your first container
---

## Installation

```sh
npm install @asimojs/asimo
# or
pnpm add @asimojs/asimo
# or
yarn add @asimojs/asimo
```

## Your First Container

asimo is built around three concepts: **IID tokens** (typed service identifiers), **factories** (how a service is created), and **containers** (where services live).

### 1. Define an Interface and Its IID Token

```ts
// types.ts
import { syncIID } from "@asimojs/asimo";

interface Greeter {
    greet(name: string): string;
}

const GREETER = syncIID<Greeter>()("app.services.Greeter");
```

The namespace string `"app.services.Greeter"` must be unique within your application. Use a dotted path convention for clarity.

### 2. Create a Container with a Factory

```ts
import { factory, createContainer } from "@asimojs/asimo";

const app = createContainer({
    name: "app",
    services: [
        factory({
            provide: GREETER,
            load: () => ({
                greet: (name) => `Hello, ${name}!`,
            }),
        }),
    ],
});
```

### 3. Retrieve and Use the Service

```ts
const greeter = app.get(GREETER);  // type: Greeter
greeter.greet("World");            // "Hello, World!"
```

## Adding an Async Service

Some services need asynchronous initialization (fetching config, opening a DB connection):

```ts
import { asyncIID } from "@asimojs/asimo";

interface Config { apiUrl: string; }
const CONFIG = asyncIID<Config>()("app.services.Config");

const app = createContainer({
    name: "app",
    services: [
        factory({
            provide: CONFIG,
            load: async () => {
                const resp = await fetch("/config.json");
                return resp.json();  // returns Promise<Config>
            },
        }),
    ],
});

// Async IIDs must use fetch(), not get()
const config = await app.fetch(CONFIG);  // type: Config
```

## Services with Dependencies

When a service depends on others, list them in `dependencies`:

```ts
factory({
    provide: GREETER,
    dependencies: [CONFIG],
    load: (c) => {
        // c is Container<typeof CONFIG>
        const config = c.get(CONFIG);  // type: Config — sync retrieval of sync IIDs
        return {
            greet: (name) => `Hello, ${name}! API at ${config.apiUrl}`,
        };
    },
})
```

The `dependencies` array types the `load` context automatically — no manual type annotations needed.

## Lazy Loading with Bundles

Wrap services you don't need at startup with `bundle()`:

```ts
import { bundle } from "@asimojs/asimo";

const app = createContainer({
    name: "app",
    services: [
        // Core services loaded eagerly
        factory({ provide: LOGGER, load: () => createLogger() }),

        // Analytics loads lazily — only when first accessed
        bundle({
            provide: [ANALYTICS],
            load: () => import("./analytics-bundle"),
        }),
    ],
});

// Analytics module loads now, on first access
const analytics = await app.fetch(ANALYTICS);
```

## Hierarchical Containers

Create child containers that inherit from a parent:

```ts
const parentApp = createContainer({
    name: "core",
    services: [
        factory({ provide: DB, load: () => createPool() }),
    ],
});

const requestCtx = createContainer({
    name: "request-42",
    extends: [parentApp],  // inherits DB from parent
    services: [
        factory({ provide: REQUEST, load: () => currentRequest }),
    ],
});

// DB comes from parent, REQUEST is scoped to this request
const db = requestCtx.get(DB);
```

## Next Steps

- [Core Concepts: IID Tokens](/core-concepts/iids) — Deep dive into sync vs async IIDs
- [Core Concepts: Containers](/core-concepts/containers) — Container hierarchy and multiple parents
- [API Reference](/api-reference/createcontainer) — Complete API documentation
