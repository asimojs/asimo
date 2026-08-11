---
title: Agent Documentation
description: Guidelines for LLMs and code agents generating code with asimo
---

This page is designed for LLMs and automated code generators. It provides the minimum knowledge required to produce correct asimo code.

## Quick Reference

### Creating IID tokens

```ts
import { syncIID, asyncIID } from "@asimojs/asimo";

// Sync IID — used with container.get()
const ID = syncIID<MyInterface>()("domain.module.InterfaceName");

// Async IID — used with container.fetch()
const ID = asyncIID<MyInterface>()("domain.module.InterfaceName");
```

### Creating a factory

```ts
import { factory } from "@asimojs/asimo";

factory({
    provide: [ID],                          // required: IID token - a service can implement multiple interfaces
    dependencies: [DEP1, DEP2],             // optional: types the load context
    load: (c) => { /* c is Container<DEP1 | DEP2> */ },
    maxRetries: 3,                          // optional, async IIDs only
    retryDelayMs: 500,                      // optional, async IIDs only
});
```

### Creating a bundle

```ts
import { bundle } from "@asimojs/asimo";

bundle({
    provide: [IDA, IDB],                    // required: AsyncIID[] only
    dependencies: [DEP1],                   // optional
    load: async (c) => { return container; }, // required: returns Promise<Container<any>>
    maxRetries: 3,                          // optional
    retryDelayMs: 500,                      // optional
});
```

### Creating a container

```ts
import { createContainer } from "@asimojs/asimo";

createContainer({
    name: "mycontainer",                    // required: no "/" allowed
    extends: [parentContainer],             // optional: multiple parents supported
    config: { maxRetries: 3 },              // optional: AsimoConfig
    services: [factory1, bundle1],          // optional: array of services
});
```

### Retrieving services

```ts
// Sync IID: use get()
const svc = container.get(SYNC_ID);                    // single
const [a, b] = container.get(SYNC_A, SYNC_B);          // multiple

// Async IID: use fetch()
const svc = await container.fetch(ASYNC_ID);           // single
const [a, b] = await container.fetch(ASYNC_A, SYNC_B); // multiple (mixing ok)

// Optional: returns null instead of throwing
const svc = container.getOptional(ANY_ID);             // T | null (or Promise<T> | null)
const svc = await container.fetchOptional(ANY_ID);     // T | null
```

## Patterns

### Pattern: Service with dependencies

```ts
// types.ts
interface Logger { log(msg: string): void; }
const LOGGER = syncIID<Logger>()("app.Logger");

interface Database { query(sql: string): Promise<any[]>; }
const DB = asyncIID<Database>()("app.Database");

interface UserRepo { getUser(id: number): Promise<User>; }
const USER_REPO = syncIID<UserRepo>()("app.UserRepo");

// app.ts
const app = createContainer({
    name: "app",
    services: [
        factory({ provide: [LOGGER], load: () => createLogger() }),
        factory({
            provide: [DB],
            dependencies: [LOGGER],
            load: async (c) => {
                const log = c.get(LOGGER);
                log.log("Connecting to DB...");
                return connectToDb();
            },
        }),
        factory({
            provide: [USER_REPO],
            dependencies: [DB, LOGGER],
            load: (c) => new PostgresUserRepo(c.get(DB), c.get(LOGGER)),
        }),
    ],
});

const repo = app.get(USER_REPO);  // type: UserRepo
```

### Pattern: Lazy bundle with dynamic import

```ts
// Only loaded when ANALYTICS or TELEMETRY is first accessed
bundle({
    provide: [ANALYTICS, TELEMETRY],
    load: async () => {
        const mod = await import("./analytics-bundle");
        return mod.container;
    },
});
```

### Pattern: Child container for request scope

```ts
function handleRequest(req: Request) {
    const ctx = createContainer({
        name: `req-${randomId()}`,
        extends: [app],         // inherit DB, Logger, Config from app
        services: [
            factory({ provide: [REQUEST], load: () => req }),
            factory({ provide: [SESSION], load: () => loadSession(req) }),
        ],
    });
    // ctx has all app services + REQUEST + SESSION
    return processRequest(ctx);
}
```

### Pattern: Mocking services in tests

```ts
const container = createContainer({
    name: "test",
    services: [
        // Override with mock
        factory({
            provide: [DB],
            load: () => ({ query: vi.fn().mockResolvedValue([{ id: 1 }]) }),
        }),
        // Service under test uses the mock DB
        factory({
            provide: [USER_REPO],
            dependencies: [DB],
            load: (c) => new UserRepo(c.get(DB)),
        }),
    ],
});
```

## Rules

### DO

| Rule | Example |
|---|---|
| Use `get()` for sync IIDs | `container.get(SYNC_ID)` |
| Use `fetch()` for async IIDs | `await container.fetch(ASYNC_ID)` |
| Use `getOptional()` / `fetchOptional()` for optional services | Optional global config object |
| Always wrap services with `factory()` or `bundle()` | Never pass inline objects to `services` |
| List all direct dependencies explicitly | `dependencies: [A, B]` |
| Name containers without `/` | `name: "my-container"` |
| Use `AsyncIID` for services that may fail or are async | Network, DB, config, bundle-provided |
| Use `SyncIID` for pure synchronous services that need to be loaded at application startup | Logger, application config, system api wrappers (e.g. DateProvider) |
| Create fresh containers for tests | No global state between tests |

### DON'T

| Rule | Why |
|---|---|
| Use `get()` on async IIDs | Compile error |
| Pass `maxRetries` to sync IID factories | Compile error |
| Put `SyncIID` in `bundle().provide` | Compile error |
| Access unlisted dependencies from factory `load` | Type error — context is scoped |
| Skip `factory()` wrapper | Compile error — missing brand symbol |
| Use `/` in container names | Runtime error |
| Assume services are loaded at container creation | Loading is lazy — on first access |

## Type Constraints

### IID token resolution flow

```
syncIID<T>()("ns")  →  SyncIID<T, "ns">
asyncIID<T>()("ns") → AsyncIID<T, "ns">
```

### `get()` type constraint

```
container.get(iid) where:
  - iid must be in IIDs (registered in container or parents)
  - iid.sync must be true (SyncIID only)
  - returns T (the type bound to the IID)
```

### `fetch()` type constraint

```
container.fetch(iid) where:
  - iid must be in IIDs
  - iid.sync can be true or false
  - returns Promise<T>
```

### Dependency inference

```
factory({ provide: [IID], dependencies: [A, B], load: (c) => ... }) where:
  - c is typed as Container<A | B>
  - c.get(A) returns A's type T_A
  - c.get(B) returns B's type T_B
  - Accessing any other IID from c is a type error
```

### Bundle specific

```
bundle({ provide: [A, B], load: async (c) => ... }) where:
  - A, B must all be AsyncIID
  - load must return Promise<Container<any>>
  - c is typed as Container<Deps[number]> (same as factory)
```

## Minimal Standalone Example

```ts
import { syncIID, asyncIID, factory, bundle, createContainer } from "@asimojs/asimo";

// 1. Define types and IID tokens
interface Logger { log(msg: string): void; }
const LOGGER = syncIID<Logger>()("app.Logger");

interface Config { apiUrl: string; }
const CONFIG = asyncIID<Config>()("app.Config");

interface UserService { getUser(id: number): Promise<User>; }
const USER_SVC = syncIID<UserService>()("app.UserService");

// 2. Define services
const loggerFactory = factory({
    provide: [LOGGER],
    load: () => ({ log: (msg) => console.log(`[app] ${msg}`) }),
});

const configFactory = factory({
    provide: [CONFIG],
    load: async () => {
        const resp = await fetch("/config.json");
        return resp.json();
    },
});

const userServiceFactory = factory({
    provide: [USER_SVC],
    dependencies: [CONFIG, LOGGER],
    load: (c) => {
        const config = c.get(CONFIG);
        const logger = c.get(LOGGER);
        return {
            async getUser(id) {
                logger.log(`Fetching user ${id} from ${config.apiUrl}`);
                const resp = await fetch(`${config.apiUrl}/users/${id}`);
                return resp.json();
            },
        };
    },
});

// 3. Create container
const app = createContainer({
    name: "app",
    services: [loggerFactory, configFactory, userServiceFactory],
});

// Optional: lazy-loaded feature bundle
const analyticsBundle = bundle({
    provide: [ANALYTICS],  // AsyncIID
    load: async () => {
        const mod = await import("./analytics");
        return mod.createContainer();
    },
});

// 4. Use services
const logger = app.get(LOGGER);
logger.log("App started");

const userSvc = app.get(USER_SVC);
const user = await userSvc.getUser(1);
```

## Error Types

```ts
import { AsimoError, AsimoLoadError } from "@asimojs/asimo";

// AsimoError — structural errors (not found, circular, invalid name)
//   .container: string (container path)
//   .name: "AsimoError"

// AsimoLoadError extends AsimoError — load failure after retries exhausted
//   .cause: unknown (the original error)
//   .name: "AsimoLoadError"
```
