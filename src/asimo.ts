/* eslint-disable @typescript-eslint/no-explicit-any */
import { AsimoError, __asimoServiceBundle, __asimoServiceFactory } from "./asimo.types";
export { AsimoError };
export type { InferType, InterfaceId, AsyncIID, SyncIID, InterfaceNamespace, ServiceDeps, ServiceFactory, ServiceBundle, ValidService, AsimoConfig, ServiceInspectInfo, Container };
import type {
    AsimoConfig,
    AsyncIID,
    Container,
    InferType,
    InterfaceId,
    InterfaceNamespace,
    RetryNotSupportedForSyncIID,
    ServiceBundle,
    ServiceDeps,
    ServiceFactory,
    ServiceInspectInfo,
    SyncIID,
    ValidService,
} from "./asimo.types";

interface InternalContainer extends Container<any> {
    getOptional(...iids: InterfaceId<any>[]): any;
    fetchOptional(...iids: InterfaceId<any>[]): any;
}

export class AsimoLoadError extends AsimoError {
    readonly cause: unknown;

    constructor(message: string, container: string, cause?: unknown) {
        super(message, container);
        this.name = "AsimoLoadError";
        this.cause = cause;
    }
}

/**
 * Create an interface token for values that can be retrieved synchronously
 * @param ns the interface namespace, e.g. "myapplication.services.Configuration"
 * @returns
 */
export function syncIID<T>(): <NS extends string>(ns: NS) => SyncIID<T, NS> {
    return function <NS extends string>(ns: NS): SyncIID<T, NS> {
        return { ns, sync: true } as unknown as SyncIID<T, NS>;
    };
}

/**
 * Create an interface token for values that can be retrieved asynchronously
 * @param ns the interface namespace, e.g. "common.utils.Fetch"
 * @returns
 */
export function asyncIID<T>(): <NS extends string>(ns: NS) => AsyncIID<T, NS> {
    return function <NS extends string>(ns: NS): AsyncIID<T, NS> {
        return { ns, sync: false } as unknown as AsyncIID<T, NS>;
    };
}

type ContainerIIDs<C> = C extends Container<infer IIDs> ? IIDs : never;

/**
 * Helper for declaring a service with explicit dependencies. Inference flows directly
 * from `dependencies` to `load`'s context, so the latter receives a
 * `Container<Deps[number]>` typed with exactly the listed IIDs.
 * When `dependencies` is omitted, the load context is `Container<never>` — no services
 * are accessible unless explicitly listed as dependencies.
 * The invariant phantom on `Container` catches mismatches between the declared
 * dependencies and what `load` actually uses — at compile time, with no manual annotation.
 *
 * `provide` is an array of IIDs and `load` must return a single value that implements
 * all provided interfaces. For a single service, use `provide: [MY_IID]`.
 *
 * @example
 * // Single IID
 * factory({
 *     provide: [CALCULATOR],
 *     dependencies: [MULTIPLIER, ADDER, SUBTRACTER],
 *     load: (c) => createCalculator(c),
 * })
 *
 * // Multiple IIDs — one service implements several interfaces
 * factory({
 *     provide: [ADDER, MULTIPLIER],
 *     load: () => new Calculator(),
 * })
 */
export function factory<
    const IIDs extends InterfaceId<any, any>[],
    const Deps extends ServiceDeps = [],
>(params: {
    /** Interface IDs provided by this factory — must be an array, even for a single IID. */
    provide: IIDs;
    /** Interface IDs this service depends on — types the `load` context. Optional; when omitted, `load` receives `Container<never>` (no accessible services). */
    dependencies?: Deps;
    /** Factory invoked on first access. Receives a container exposing only the listed dependencies. Must return a single value that implements all provided interfaces. */
    load(
        context: Container<Deps[number]>,
    ): Extract<IIDs[number], AsyncIID<any, any>> extends never
        ? IIDs[number] extends InterfaceId<infer T, any> ? (T extends any ? (k: T) => void : never) extends (k: infer I) => void ? I : never : never
        : Promise<IIDs[number] extends InterfaceId<infer T, any> ? (T extends any ? (k: T) => void : never) extends (k: infer I) => void ? I : never : never>;
    /** Max number of retries on load failure for async IIDs (default: 2). Only meaningful when at least one IID is async. */
    maxRetries?: Extract<IIDs[number], AsyncIID<any, any>> extends never ? RetryNotSupportedForSyncIID : number;
    /** Base delay in ms between retries, doubled after each attempt (default: 1000). */
    retryDelayMs?: Extract<IIDs[number], AsyncIID<any, any>> extends never ? RetryNotSupportedForSyncIID : number;
}): ServiceFactory<IIDs, Deps> {
    return {
        [__asimoServiceFactory]: true as const,
        provide: params.provide,
        dependencies: params.dependencies,
        load: params.load,
        maxRetries: params.maxRetries,
        retryDelayMs: params.retryDelayMs,
    } as ServiceFactory<IIDs, Deps>;
}

/**
 * Helper for declaring a lazy-loading bundle of services. Similar to `factory()` but:
 * - `provide` is an array of `AsyncIID`s (bundles cannot provide `SyncIID`s)
 * - `load` is async and returns an `Container` with sub-factories and sub-bundles
 * - The bundle is loaded on-demand when one of its provided IIDs is fetched
 * - Only services listed in `provide` are exposed to the parent — services in
 *   the sub-container that are not in `provide` are silently ignored
 *
 * @example
 * bundle({
 *     provide: [MULTIPLIER, DIVIDER],
 *     load: async () => {
 *         const mod = await import("./math-services");
 *         return [mod.multiplierFactory, mod.dividerFactory];
 *     },
 * })
 */
export function bundle<
    const IIDs extends AsyncIID<any, any>[],
    const Deps extends ServiceDeps = [],
>(params: {
    /** Interface IDs provided by this bundle — all must be `AsyncIID`. */
    provide: IIDs;
    /** Optional dependencies used to type the `load` context. */
    dependencies?: Deps;
    /** Async factory invoked on first access to any provided IID. Returns an `Container` with sub-services registered. */
    load(context: Container<Deps[number]>): Promise<Container<any>>;
    /** Max number of retries on load failure (default: 2). */
    maxRetries?: number;
    /** Base delay in ms between retries, doubled after each attempt (default: 1000). */
    retryDelayMs?: number;
}): ServiceBundle<IIDs[number], Deps> {
    return {
        [__asimoServiceBundle]: true as const,
        provide: params.provide,
        dependencies: params.dependencies,
        load: params.load,
        maxRetries: params.maxRetries,
        retryDelayMs: params.retryDelayMs,
    } as ServiceBundle<IIDs[number], Deps>;
}

type ServiceEntry =
    | {
          readonly [__asimoServiceFactory]: true;
          provide: InterfaceId<any, any>[];
          dependencies?: ServiceDeps;
      }
    | {
          readonly [__asimoServiceBundle]: true;
          provide: AsyncIID<any, any>[];
          dependencies?: ServiceDeps;
      };

type ServiceIID<S> = S extends {
    readonly [__asimoServiceFactory]: true;
    provide: infer IIDs extends InterfaceId<any, any>[];
}
    ? IIDs[number]
    : S extends {
            readonly [__asimoServiceBundle]: true;
            provide: infer IIDs extends InterfaceId<any, any>[];
        }
      ? IIDs[number]
      : never;

interface InternalEntry {
    factory?: ServiceFactory<InterfaceId<any, any>[], ServiceDeps>;
    bundle?: { provide: AsyncIID<any, any>[]; maxRetries?: number; retryDelayMs?: number; load(ctx: Container<any>): Promise<Container<any>> };
    instance?: any;
    maxRetries?: number;
    retryDelayMs?: number;
    /** Marker set after a parent-chain traversal found no match — prevents repeated O(n) searches. */
    notFound?: true;
}

/**
 * Module-level WeakMap mapping containers to their internal service maps.
 * - WeakMap ensures containers are garbage-collected when no longer referenced.
 * - Per-module isolation: if the library is duplicated in node_modules
 *   (two copies loaded), each instance has its own _serviceMaps — correct,
 *   since containers from different builds are independent.
 */
const _serviceMaps = new WeakMap<Container<any>, Map<InterfaceNamespace, InternalEntry>>();

export function createContainer<
    const Services extends readonly ServiceEntry[],
    const Parents extends readonly Container<any>[] | null | undefined = undefined,
>(params: {
    name: string;
    extends?: Parents;
    config?: AsimoConfig;
    services?: [
        ...{
            [K in keyof Services]: ValidService<
                Services[K],
                | ServiceIID<Services[number]>
                | (Parents extends readonly any[] ? ContainerIIDs<Parents[number]> : never)
            >;
        },
    ];
}): Container<
    | ServiceIID<Services[number]>
    | (Parents extends readonly any[] ? ContainerIIDs<Parents[number]> : never)
> {
    const cfg = params.config ?? ({} as AsimoConfig);
    const onLoad = cfg.onLoad;
    const onError = cfg.onError;
    if (params.name.includes("/")) {
        throw new Error(
            `[Asimo] Container name must not contain forward slashes: "${params.name}"`,
        );
    }
    if (params.services !== undefined && !Array.isArray(params.services)) {
        throw new Error("[Asimo] services must be an array");
    }
    const parents = params.extends ? Object.freeze([...params.extends]) : null;
    const services = params.services ?? [];
    const serviceMap = new Map<InterfaceNamespace, InternalEntry>();
    const loadingBundles = new Set<InterfaceNamespace>();
    const bundleLoadPromises = new Map<object, Promise<void>>();
    const multiIidLoadCache = new WeakMap<object, Promise<any>>();

    for (const service of services) {
        if (__asimoServiceFactory in service) {
            const sf = service as ServiceFactory<InterfaceId<any, any>[], ServiceDeps>;
            for (const iid of sf.provide) {
                serviceMap.set(iid.ns, {
                    factory: sf,
                    maxRetries: sf.maxRetries,
                    retryDelayMs: sf.retryDelayMs,
                });
            }
        } else if (__asimoServiceBundle in service) {
            const sb = service as { provide: AsyncIID<any, any>[]; maxRetries?: number; retryDelayMs?: number; load(ctx: Container<any>): Promise<Container<any>> };
            for (const iid of sb.provide) {
                serviceMap.set(iid.ns, {
                    bundle: sb,
                    maxRetries: sb.maxRetries,
                    retryDelayMs: sb.retryDelayMs,
                });
            }
        } else {
            throw new AsimoError("Invalid service registration: services must be created via factory() or bundle()", `/${params.name}`);
        }
    }

    const path = `${(parents?.[0] as Container<any>)?.path || ""}/${params.name}`;

    const container: InternalContainer = {
        name: params.name,
        path,
        parents: parents as readonly Container<any>[] | null,
        *entries(): IterableIterator<ServiceInspectInfo> {
            for (const [ns, entry] of serviceMap) {
                if (entry.notFound) continue;
                yield {
                    ns,
                    path: container.path,
                    status: entry.instance ? "loaded" : entry.bundle ? "pending" : "registered",
                };
            }
        },
        has(iid: InterfaceId<any>): boolean {
            return this.inspect(iid) !== null;
        },
        inspect(iid?: InterfaceId<any>): any {
            if (iid) {
                return inspectService(iid);
            }
            return inspectAll();
        },
        dump(): string {
            const all = inspectAll();
            const lines = [`Asimo IoC Container: ${container.path}`];
            for (const info of all) {
                lines.push(`  ${info.path}: ${info.ns} - ${info.status}`);
            }
            return lines.join("\n");
        },
        dispose(iid: InterfaceId<any>): void {
            const entry = serviceMap.get(iid.ns);
            if (entry) {
                entry.instance = undefined;
            }
        },
        get(...iids: InterfaceId<any>[]): any {
            if (iids.length === 1) {
                return loadService(iids[0]);
            }
            return iids.map((iid) => loadService(iid));
        },
        getOptional(...iids: InterfaceId<any>[]): any {
            if (iids.length === 1) {
                return getOptionalService(iids[0]);
            }
            return iids.map((iid) => getOptionalService(iid));
        },
        async fetch(...iids: InterfaceId<any>[]): Promise<any> {
            if (iids.length === 1) {
                return loadService(iids[0]);
            }
            return Promise.all(iids.map((iid) => loadService(iid)));
        },
        async fetchOptional(...iids: InterfaceId<any>[]): Promise<any> {
            if (iids.length === 1) {
                return fetchOptionalService(iids[0]);
            }
            return Promise.all(iids.map((iid) => fetchOptionalService(iid)));
        },
    };

    _serviceMaps.set(container, serviceMap);

    return container as unknown as Container<
        | ServiceIID<Services[number]>
        | (Parents extends readonly any[] ? ContainerIIDs<Parents[number]> : never)
    >;

    function loadService(iid: InterfaceId<any>): any {
        const entry = serviceMap.get(iid.ns);
        if (!entry) {
            const value = getParentService(iid);
            if (value !== null) {
                serviceMap.set(iid.ns, { instance: value });
                return value;
            }
            throwError(`Service not found: ${iid.ns}`);
        }

        if (entry.notFound) throwError(`Service not found: ${iid.ns}`);

        if (entry.instance) return entry.instance;

        if (entry.bundle && !entry.factory) {
            return loadBundleAndResolve(entry, iid);
        }

        if (entry.factory) {
            if (entry.factory.provide.every((p) => p.sync)) {
                return resolveFactoryEntry(entry)!;
            }
            return resolveFactoryEntryAsync(entry);
        }

        throwError("Corrupt service entry in serviceMap: no factory or bundle");
    }

    function resolveFactoryEntry(entry: InternalEntry): any {
        if (entry.instance) return entry.instance;
        const factory = entry.factory!;
        const value = factory.load(container as any);
        for (const iid of factory.provide) {
            const service = serviceMap.get(iid.ns);
            if (service) service.instance = value;
        }
        onLoad?.(factory.provide, container);
        return value;
    }

    async function resolveFactoryEntryAsync(entry: InternalEntry): Promise<any> {
        if (entry.instance) return entry.instance;
        const factory = entry.factory!;

        const cached = multiIidLoadCache.get(factory);
        if (cached) return cached;

        const maxRetries = entry.maxRetries ?? cfg.maxRetries ?? 2;
        const baseDelay = entry.retryDelayMs ?? cfg.retryDelayMs ?? 1000;

        const loadPromise = retryAsyncFactoryLoad(factory, maxRetries, baseDelay);
        multiIidLoadCache.set(factory, loadPromise);

        try {
            const value = await loadPromise;
            for (const iid of factory.provide) {
                const service = serviceMap.get(iid.ns);
                if (service) service.instance = value;
            }
            multiIidLoadCache.delete(factory);
            onLoad?.(factory.provide, container);
            return value;
        } catch (err) {
            multiIidLoadCache.delete(factory);
            for (const p of factory.provide) {
                const e = serviceMap.get(p.ns);
                if (e) e.instance = undefined;
            }
            throw err;
        }
    }

    async function retryAsyncFactoryLoad(
        factory: ServiceFactory<InterfaceId<any, any>[], ServiceDeps>,
        maxRetries: number,
        baseDelay: number,
    ): Promise<any> {
        let lastError: unknown;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const result = factory.load(container as any);
                return await result;
            } catch (err) {
                if (err instanceof AsimoError) throw err;
                lastError = err;
                if (attempt < maxRetries) {
                    await new Promise((r) => setTimeout(r, baseDelay * 2 ** attempt));
                }
            }
        }
        const error = new AsimoLoadError(
            `Load failed for "${factory.provide.map((p) => p.ns).join(", ")}" after ${maxRetries + 1} attempts`,
            container.path,
            lastError,
        );
        onError?.(error, container);
        throw error;
    }

    function inspectService(iid: InterfaceId<any>): ServiceInspectInfo | null {
        const entry = serviceMap.get(iid.ns);
        if (entry && !entry.notFound) {
            return {
                ns: iid.ns,
                path: container.path,
                status: entry.instance ? "loaded" : entry.bundle ? "pending" : "registered",
            };
        }
        if (parents) {
            for (const parent of parents) {
                const result = (parent as InternalContainer).inspect(iid);
                if (result) {
                    return result;
                }
            }
        }
        return null;
    }

    function inspectAll(): ServiceInspectInfo[] {
        const results: ServiceInspectInfo[] = [];
        for (const [ns, entry] of serviceMap) {
            if (entry.notFound) continue;
            results.push({
                ns,
                path: container.path,
                status: entry.instance ? "loaded" : entry.bundle ? "pending" : "registered",
            });
        }
        if (parents) {
            const seen = new Set(serviceMap.keys());
            for (const parent of parents) {
                const parentResults = (
                    parent as InternalContainer
                ).inspect() as ServiceInspectInfo[];
                for (const pr of parentResults) {
                    if (!seen.has(pr.ns)) {
                        results.push(pr);
                        seen.add(pr.ns);
                    }
                }
            }
        }
        return results;
    }

    function throwError(message: string): never {
        const error = new AsimoError(message, container.path);
        onError?.(error, container);
        throw error;
    }

    async function resolveOrRetry(entry: InternalEntry): Promise<any> {
        if (entry.instance) return entry.instance;
        if (entry.factory) {
            if (entry.factory.provide.every((p) => p.sync)) return resolveFactoryEntry(entry)!;
            return resolveFactoryEntryAsync(entry);
        }
        throwError("Corrupt service entry in serviceMap: no factory or bundle");
    }

    async function loadBundleAndResolve(entry: InternalEntry, iid: InterfaceId<any>): Promise<any> {
        const bundle = entry.bundle!;
        const maxRetries = entry.maxRetries ?? cfg.maxRetries ?? 2;
        const baseDelay = entry.retryDelayMs ?? cfg.retryDelayMs ?? 1000;

        // If this bundle is already being loaded (concurrent access), wait and re-resolve
        if (bundleLoadPromises.has(bundle)) {
            const existingLoad = bundleLoadPromises.get(bundle)!;
            await existingLoad;
            const updatedEntry = serviceMap.get(iid.ns);
            if (!updatedEntry || (!updatedEntry.factory && !updatedEntry.instance)) {
                throwError(`Bundle did not provide service: ${iid.ns}`);
            }
            return resolveOrRetry(updatedEntry);
        }

        // Check for circular: bundle's own load triggers re-entry
        for (const providedIid of bundle.provide) {
            if (loadingBundles.has(providedIid.ns)) {
                throwError(`Circular bundle loading detected for: ${providedIid.ns}`);
            }
        }

        for (const providedIid of bundle.provide) {
            loadingBundles.add(providedIid.ns);
        }

        const loadPromise = (async () => {
            let lastError: unknown;
            const provideNs = new Set(bundle.provide.map((iid) => iid.ns));
            for (let attempt = 0; attempt <= maxRetries; attempt++) {
                try {
                    const subContainer = await bundle.load(container as any);
                    const subMap = _serviceMaps.get(subContainer as Container<any>);
                    if (subMap) {
                        for (const [ns, subEntry] of subMap) {
                            if (provideNs.has(ns)) {
                                const existing = serviceMap.get(ns);
                                if (existing && existing.bundle !== bundle) {
                                    throwError(
                                        `Bundle collision for "${ns}": already registered by another bundle or factory`,
                                    );
                                }
                                serviceMap.set(ns, subEntry);
                            }
                        }
                    }
                    return;
                } catch (err) {
                    if (err instanceof AsimoError) throw err;
                    lastError = err;
                    if (attempt < maxRetries) {
                        await new Promise((r) => setTimeout(r, baseDelay * 2 ** attempt));
                    }
                }
            }
            const error = new AsimoLoadError(
                `Bundle load failed for "${iid.ns}" after ${maxRetries + 1} attempts`,
                container.path,
                lastError,
            );
            onError?.(error, container);
            throw error;
        })();

        bundleLoadPromises.set(bundle, loadPromise);

        try {
            await loadPromise;
            const updatedEntry = serviceMap.get(iid.ns);
            if (!updatedEntry || (!updatedEntry.factory && !updatedEntry.instance)) {
                throwError(`Bundle did not provide service: ${iid.ns}`);
            }
            return resolveOrRetry(updatedEntry);
        } finally {
            for (const providedIid of bundle.provide) {
                loadingBundles.delete(providedIid.ns);
            }
            bundleLoadPromises.delete(bundle);
        }
    }

    function getOptionalService(iid: InterfaceId<any>): any {
        const entry = serviceMap.get(iid.ns);
        if (entry) {
            if (entry.notFound) return null;
            if (entry.bundle && !entry.instance && !entry.factory) {
                return null;
            }
            if (entry.factory) {
                if (entry.factory.provide.every((p) => p.sync)) {
                    return resolveFactoryEntry(entry)!;
                }
                return resolveFactoryEntryAsync(entry);
            }
            return resolveFactoryEntry(entry);
        }
        return getParentService(iid);
    }

    /** Same as `getOptionalService` but systematically returns a promise */
    function fetchOptionalService(iid: InterfaceId<any>): Promise<any> {
        const result = getOptionalService(iid);
        return result instanceof Promise ? result : Promise.resolve(result);
    }

    function getParentService(iid: InterfaceId<any>): any {
        if (parents) {
            for (const parent of parents) {
                const parentEntry = (parent as InternalContainer).getOptional(iid);
                if (parentEntry !== null && parentEntry !== undefined) {
                    return parentEntry;
                }
            }
        }
        serviceMap.set(iid.ns, { notFound: true });
        return null;
    }
}
