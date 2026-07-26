# asimo

A zero-dependency, fully type-safe Inversion of Control (IoC) container for TypeScript — browser and server.

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

## Why asimo?

- **Zero dependencies** — ~3 KB gzipped, no decorators, no `reflect-metadata`
- **Full compile-time safety** — missing dependencies, wrong IID types, retry-on-sync are all TypeScript errors, not runtime crashes
- **Automatic dependency inference** — `dependencies: [A, B]` types the `load` context as `Container<A | B>`
- **Lazy bundles** — wrap `import()` in `bundle()` and services load only on first access
- **Hierarchical containers** — child containers inherit from parents, enabling request-scoped DI
- **Retry with exponential backoff** — async services retry on failure, configurable per-service or globally
- **Runs everywhere** — browser, Node.js, Bun, Deno, Cloudflare Workers

## Installation

```sh
npm install @asimojs/asimo
pnpm add @asimojs/asimo
yarn add @asimojs/asimo
```

## Quick Start

### Define an IID token

```ts
import { syncIID, asyncIID } from "@asimojs/asimo";

interface Logger { log(msg: string): void; }
const LOGGER = syncIID<Logger>()("app.Logger");

interface Config { apiUrl: string; }
const CONFIG = asyncIID<Config>()("app.Config");
```

### Create a container with services

```ts
import { factory, bundle, createContainer } from "@asimojs/asimo";

const app = createContainer({
    name: "app",
    services: [
        // Sync service — retrieved with get()
        factory({
            provide: LOGGER,
            load: () => ({ log: (msg) => console.log(msg) }),
        }),
        // Async service — retrieved with fetch()
        factory({
            provide: CONFIG,
            load: async () => {
                const resp = await fetch("/config.json");
                return resp.json();
            },
        }),
        // Lazy bundle — loaded on first access
        bundle({
            provide: [ANALYTICS],
            load: () => import("./analytics-bundle"),
        }),
    ],
});
```

### Retrieve services

```ts
const logger = app.get(LOGGER);              // synchronous, type: Logger
const config = await app.fetch(CONFIG);       // asynchronous, type: Config
const optional = app.getOptional(OPTIONAL);   // null if not registered
```

### Services with dependencies

```ts
factory({
    provide: USER_SERVICE,
    dependencies: [DB, LOGGER],
    load: (c) => {
        // c is typed as Container<typeof DB | typeof LOGGER>
        const db = c.get(DB);
        const log = c.get(LOGGER);
        return new UserService(db, log);
    },
});
```

### Per-request container

```ts
const reqCtx = createContainer({
    name: "request-42",
    extends: [app],  // inherits all app services
    services: [
        factory({ provide: REQUEST, load: () => currentRequest }),
    ],
});
```

## Documentation

Full documentation is available at [asimojs.github.io/asimo](https://asimojs.github.io/asimo):

- [Getting Started](https://asimojs.github.io/asimo/getting-started)
- [Core Concepts](https://asimojs.github.io/asimo/core-concepts/iids) — IID tokens, containers, factories, bundles, retry
- [Guides](https://asimojs.github.io/asimo/guides/services) — implementing services, testing, progressive loading, server-side usage
- [API Reference](https://asimojs.github.io/asimo/api-reference/createcontainer)
- [Agent Documentation](https://asimojs.github.io/asimo/agent-docs) — guidelines for LLMs and code agents

## Development

| Command | Description |
|---|---|
| `pnpm test` | Run tests |
| `pnpm build` | Build the library |
| `pnpm docs:dev` | Start docs dev server |
| `pnpm docs:build` | Build docs to `docs-dist/` |
| `pnpm lint` | Lint source |

## License

MIT
