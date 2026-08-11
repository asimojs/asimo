---
title: Server-Side Usage
description: Using asimo on the server with Bun, Node.js, and other runtimes
---

asimo is runtime-agnostic. It works identically in Bun, Node.js, Deno, and Cloudflare Workers — making it a natural fit for server-side applications that need fast startup, request-scoped DI, and lazy service activation.

## Fast Startup with Bun

Bun's fast module resolution combined with asimo's lazy bundles enables near-instant cold starts:

```ts
// server.ts — minimal startup, ~3 KB + config
import { createContainer, factory, bundle } from "@asimojs/asimo";

const app = createContainer({
    name: "app",
    services: [
        factory({ provide: [CONFIG], load: () => Bun.env }),
        factory({
            provide: [DB],
            dependencies: [CONFIG],
            load: (c) => {
                const cfg = c.get(CONFIG);
                return Bun.sql(cfg.DATABASE_URL);
            },
        }),

        // Everything else is lazy — loads only when accessed
        bundle({ provide: [USER_SVC], load: () => import("./routes/users") }),
        bundle({ provide: [AUTH_SVC], load: () => import("./routes/auth") }),
        bundle({ provide: [UPLOAD_SVC], load: () => import("./routes/uploads") }),
    ],
});
```

At startup, only `CONFIG` and `DB` initialize. The three route bundles stay as unloaded chunks until a request needs them.

## Per-Request Containers

Create a child container for each request, inheriting shared infrastructure:

```ts
async function handleRequest(req: Request) {
    const ctx = createContainer({
        name: `req-${crypto.randomUUID().slice(0, 8)}`,
        extends: [app],
        services: [
            factory({ provide: [REQUEST], load: () => req }),
            factory({
                provide: [REQUEST_ID],
                load: () => crypto.randomUUID(),
            }),
        ],
    });

    const url = new URL(req.url);
    switch (url.pathname) {
        case "/api/users":
            const userSvc = await ctx.fetch(USER_SVC);
            return userSvc.handle(ctx);
        case "/api/auth/login":
            const authSvc = await ctx.fetch(AUTH_SVC);
            return authSvc.login(ctx);
        case "/health":
            return new Response("ok");
        default:
            return new Response("not found", { status: 404 });
    }
}

Bun.serve({ fetch: handleRequest });
```

Each request gets:
- **Shared singletons** from `app`: `CONFIG`, `DB`
- **Scoped singletons** in `ctx`: `REQUEST`, `REQUEST_ID`
- **No shared mutable state** between requests — each container is isolated

## Selective Bundle Activation

Only the bundles a route needs are loaded. A `/health` endpoint triggers zero bundles:

```ts
// GET /health      → 0 bundles loaded
// GET /api/users   → users bundle loaded (USER_SVC)
// GET /api/auth    → auth bundle loaded (AUTH_SVC)
// POST /uploads    → uploads bundle loaded (UPLOAD_SVC)
```

Unused code paths cost nothing in terms of load time or memory.

## Bun Standalone Deployment

With `bun build --compile`, ship a single binary that includes all bundles but loads them lazily:

```sh
bun build --compile --target=bun-linux-x64 ./server.ts --outfile=server
```

The resulting binary is self-contained. Bundles are compiled in but only executed when accessed — same lazy behavior as development.

## NestJS / Hono / Elysia Integration

asimo integrates with any server framework by creating containers at the appropriate scope:

### Hono Middleware

```ts
import { Hono } from "hono";

const app = new Hono();

// Attach an asimo container to every request
app.use("*", async (c, next) => {
    const container = createContainer({
        name: `req-${crypto.randomUUID().slice(0, 8)}`,
        extends: [globalApp],
        services: [
            factory({ provide: "ctx", load: () => c }),
        ],
    });
    c.set("container", container);
    await next();
});

app.get("/api/users", async (c) => {
    const container = c.get("container");
    const userSvc = await container.fetch(USER_SVC);
    return c.json(await userSvc.list());
});
```

### Express Middleware

```ts
app.use((req, res, next) => {
    req.container = createContainer({
        name: `req-${crypto.randomUUID().slice(0, 8)}`,
        extends: [app],
        services: [
            factory({ provide: [REQUEST], load: () => req }),
            factory({ provide: [RESPONSE], load: () => res }),
        ],
    });
    next();
});
```

## Connection Pooling

Share long-lived resources (DB pools, Redis clients) across requests via the parent container:

```ts
const app = createContainer({
    name: "app",
    services: [
        factory({
            provide: [PG_POOL],
            load: () => new Pool({ max: 20 }), // created once, shared by all requests
        }),
        factory({
            provide: [REDIS],
            load: () => createClient().connect(), // created once
        }),
    ],
});

// Each request container inherits PG_POOL and REDIS from app
// No per-request pool creation overhead
```

## Graceful Shutdown

Register cleanup hooks outside of asimo — the library is stateless across instances:

```ts
const app = createContainer({ name: "app", services: [...] });

// Load the pool lazily, then register shutdown
const pool = await app.fetch(PG_POOL);

process.on("SIGTERM", async () => {
    await pool.end();
    process.exit(0);
});
```

## Worker / Lambda Pattern

For serverless, create a fresh container per invocation:

```ts
export default {
    async fetch(req: Request): Promise<Response> {
        const container = createContainer({
            name: "handler",
            services: [
                factory({ provide: [REQUEST], load: () => req }),
                // Each invocation gets its own container — no shared state
            ],
        });
        return handleRequest(container);
    },
};
```

For cold start optimization, pre-create the shared parent container at module scope:

```ts
// Module scope: created once per cold start, reused across invocations
const shared = createContainer({
    name: "shared",
    services: [
        factory({ provide: [CONFIG], load: () => parseEnv() }),
    ],
});

export default {
    async fetch(req: Request): Promise<Response> {
        const container = createContainer({
            name: "handler",
            extends: [shared], // reuse shared singletons
            services: [
                factory({ provide: [REQUEST], load: () => req }),
            ],
        });
        return handleRequest(container);
    },
};
```
