# Agent Instructions

## Project Overview

asimo is a zero-dependency, fully type-safe IoC container for TypeScript. ~2KB gzipped. Two source files: `src/asimo.ts` (runtime) and `src/asimo.types.ts` (types).

## Commands

| Task | Command |
|---|---|
| Test (runtime + types) | `pnpm test` |
| Test (runtime only) | `npx vitest run --typecheck=false` |
| Build | `pnpm build` |
| Lint | `pnpm lint` |
| Publish check | `pnpm prepublishOnly` |

Tests need `--testTimeout=15000` for retry timing tests.

## Architecture

- **`asimo.types.ts`** — All public types: `Container<IIDs>`, `ServiceFactory`, `ServiceBundle`, `SyncIID`, `AsyncIID`, `ServiceInspectInfo`, `AsimoConfig`, `AsimoError`.
- **`asimo.ts`** — Runtime: `createContainer`, `factory()`, `bundle()`, `syncIID()`, `asyncIID()`. Also exports `AsimoLoadError extends AsimoError`.

`Container<IIDs>` has an invariant phantom `_iids?: (x: IIDs) => IIDs` — this is essential for type-safe dependency validation. Never remove it.

## Key Patterns

### Internal entry
```ts
interface InternalEntry {
    factory?: ServiceFactory<...>;
    bundle?: { provide: AsyncIID[]; load: ...; maxRetries?: ...; retryDelayMs?: ... };
    instance?: any;
    maxRetries?: number;
    retryDelayMs?: number;
    notFound?: true;  // cached parent-chain miss
}
```

`entry.instance` lifecycle: `undefined` → pending Promise → resolved value → `undefined` (on dispose/failure). Never leave a rejected promise in `entry.instance`.

### ServiceMap
Service registry is a `Map<InterfaceNamespace, InternalEntry>` per container. Module-level `WeakMap<Container, Map<...>>` stores the map (no public `_serviceMap` property).

### `any` usage
`any` is inherent in the heterogeneous container pattern. File-level `eslint-disable` on `asimo.ts` and `asimo.types.ts`. In tests, `as any` for runtime-error testing is acceptable.

### Retry
- Precedence: per-factory/bundle → container config → hardcoded (2, 1000ms)
- `AsimoError` (structural: circular, not found) never retried — `if (err instanceof AsimoError) throw err`
- `AsimoLoadError extends AsimoError` thrown on retry exhaustion
- `entry.instance` cleared on failure so re-fetch works

### Bundle scope
Only IIDs in `bundle.provide` are copied from sub-container to parent. Others are silently dropped.

### Error consistency
All errors thrown via `throwError(message: string): never` which creates `AsimoError` with `container.path`, calls `onError`, then throws.

## Conventions

- Every change must include corresponding tests — new features get new tests, bug fixes get regression tests
- No comments in code unless necessary (JSDoc on public APIs is OK)
- Imports use `verbatimModuleSyntax` — `import type` for type-only imports
- JavaScript/TypeScript standard formatting
- Test file: `src/test/container.spec.ts` — describe blocks for feature groups
- Type-error tests: `src/test/ts-errors.spec-d.ts` — uses `@ts-expect-error`

## Publish Checklist

`prepublishOnly` runs: lint → build → test → `npm pack --dry-run`. dist/ is committed so git-based consumers get pre-built files. Astro docs deploy via `.github/workflows/deploy-docs.yml`.
