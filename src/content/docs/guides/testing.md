---
title: Testing with asimo
description: Patterns for testing applications built with asimo
---

asimo's design makes testing straightforward: create isolated containers per test with the exact services you need — no global state, no mocking frameworks, no DI container reset boilerplate.

## Core Testing Principle

Every test creates its own container. No cleanup needed between tests because containers are garbage-collected when they go out of scope:

```ts
describe("UserService", () => {
    it("fetches user by ID", async () => {
        const container = createContainer({
            name: "test",
            services: [
                factory({
                    provide: [API_CLIENT],
                    load: () => mockApiClient, // test double
                }),
                factory({
                    provide: [USER_SERVICE],
                    dependencies: [API_CLIENT],
                    load: (c) => new UserService(c.get(API_CLIENT)),
                }),
            ],
        });

        const svc = container.get(USER_SERVICE);
        const user = await svc.getUser(1);
        expect(user.name).toBe("Alice");
    });
});
```

## Mocking Services

### Inline Mock Factories

Override any service with a mock by providing a factory that returns a test double:

```ts
const container = createContainer({
    name: "test",
    services: [
        // Mock: return a fake DB connection
        factory({
            provide: [DB],
            load: () => ({
                query: vi.fn().mockResolvedValue([{ id: 1, name: "Test" }]),
            }),
        }),
        // Real service under test
        factory({
            provide: [USER_REPO],
            dependencies: [DB],
            load: (c) => new UserRepo(c.get(DB)),
        }),
    ],
});
```

### Mocking Async Services

```ts
factory({
    provide: [CONFIG],
    load: async () => ({ apiUrl: "http://localhost:9999", featureFlags: {} }),
});
```

### Partial Overrides in Child Containers

Use `extends` to reuse a base container but override specific services:

```ts
const baseContainer = createContainer({
    name: "base",
    services: [
        factory({ provide: [CONFIG], load: () => loadRealConfig() }),
        factory({ provide: [DB], dependencies: [CONFIG], load: createRealDB }),
    ],
});

// Test: override CONFIG but keep real DB
const testContainer = createContainer({
    name: "test",
    extends: [baseContainer],
    services: [
        factory({ provide: [CONFIG], load: () => ({ apiUrl: "mock" }) }),
        // DB resolves from the child first (mock CONFIG), uses it
    ],
});
```

## Using getOptional / fetchOptional

For services that may or may not be available in a test context:

```ts
const optionalSvc = container.getOptional(OPTIONAL_FEATURE);
if (optionalSvc) {
    optionalSvc.doSomething();
}
// No error thrown if OPTIONAL_FEATURE is not registered
```

## Testing Error Paths

### Service Not Found

```ts
expect(() => container.get(MISSING_IID)).toThrow(AsimoError);
```

### Load Failure with Retry

```ts
let attempts = 0;
const container = createContainer({
    name: "test",
    services: [
        factory({
            provide: [FLAKY_SVC],
            load: async () => {
                attempts++;
                if (attempts < 3) throw new Error("transient failure");
                return { value: 42 };
            },
            maxRetries: 3,
            retryDelayMs: 10,  // fast fail in tests
        }),
    ],
});

const result = await container.fetch(FLAKY_SVC);
expect(result.value).toBe(42);
expect(attempts).toBe(3);
```

### Load Exhausts Retries

```ts
const container = createContainer({
    name: "test",
    services: [
        factory({
            provide: [FAILING_SVC],
            load: async () => { throw new Error("always fails"); },
            maxRetries: 2,
        }),
    ],
});

await expect(container.fetch(FAILING_SVC)).rejects.toThrow(AsimoLoadError);
```

## Testing with Bundles

Many test frameworks don't support dynamic imports, in this case you will need to
mock the bundle's `load` to return a pre-built container:

```ts
const mockBundle = bundle({
    provide: [FEATURE_A, FEATURE_B],
    load: async () => createContainer({
        name: "mock-features",
        services: [
            factory({ provide: [FEATURE_A], load: () => mockFeatureA }),
            factory({ provide: [FEATURE_B], load: () => mockFeatureB }),
        ],
    }),
});

const container = createContainer({
    name: "test",
    services: [mockBundle],
});

const feature = await container.fetch(FEATURE_A);
expect(feature.doSomething()).toBe("mocked");
```

## Lifecycle Hooks in Tests

Use `config.onLoad` and `config.onError` to verify loading behavior:

```ts
const loaded: string[] = [];
const container = createContainer({
    name: "test",
    config: {
        onLoad(iids) { iids.forEach(i => loaded.push(i.ns)); },
    },
    services: [
        factory({ provide: [SVC_A], load: () => ({}) }),
        factory({ provide: [SVC_B], load: () => ({}) }),
    ],
});

container.get(SVC_A);
container.get(SVC_B);
expect(loaded).toEqual(["test.SvcA", "test.SvcB"]);
```

## Container Inspection in Tests

```ts
// Verify service status before/after access
expect(container.inspect(SVC_A)?.status).toBe("registered");
container.get(SVC_A);
expect(container.inspect(SVC_A)?.status).toBe("loaded");

// Verify complete service map
const all = container.inspect();
expect(all.length).toBe(3);
```
