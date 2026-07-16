import {
    AsyncIID,
    InterfaceId,
    InterfaceNamespace,
    IoCContainer,
    ServiceBundle,
    ServiceDeps,
    ServiceFactory,
    SyncIID,
    ValidService,
    __asimoServiceBundle,
    __asimoServiceFactory,
} from "./asimo.types";

interface InternalContainer extends IoCContainer<any> {
    getOptional(...iids: InterfaceId<any>[]): any;
    fetchOptional(...iids: InterfaceId<any>[]): any;
    /** Internal service map — used by bundles to copy sub-container entries into the parent. */
    _serviceMap: Map<InterfaceNamespace, InternalEntry>;
}

/**
 * Create an interface token for values that can be retrieved synchronously
 * @param ns the interface namespace, e.g. "myapplication.services.Configuration"
 * @returns
 */
export function syncIID<T>(): <NS extends string>(ns: NS) => SyncIID<T, NS> {
    return (ns) => ({ ns, sync: true } as any);
}

/**
 * Create an interface token for values that can be retrieved asynchronously
 * @param ns the interface namespace, e.g. "common.utils.Fetch"
 * @returns
 */
export function asyncIID<T>(): <NS extends string>(ns: NS) => AsyncIID<T, NS> {
    return (ns) => ({ ns, sync: false } as any);
}

type ContainerIIDs<C> = C extends IoCContainer<infer IIDs> ? IIDs : never;

/**
 * Helper for declaring a service with explicit dependencies. Inference flows directly
 * from `dependencies` to `load`'s context, so the latter receives an
 * `IoCContainer<Deps[number]>` typed with exactly the listed IIDs (no `any` widening).
 * The invariant phantom on `IoCContainer` then catches mismatches between the declared
 * dependencies and what `load` actually uses — at compile time, with no manual annotation.
 *
 * @example
 * factory({
 *     provide: CALCULATOR,
 *     dependencies: [MULTIPLIER, ADDER, SUBTRACTOR],
 *     load: (c) => createCalculator(c), // 'c' is IoCContainer<typeof MULTIPLIER | typeof ADDER | typeof SUBTRACTOR>
 * })
 */
export function factory<
    const IID extends InterfaceId<any, any>,
    const Deps extends ServiceDeps = [],
>(params: {
    /** Interface identifier provided by this service. */
    provide: IID;
    /** Interface IDs this service depends on — types the `load` context. Optional; when omitted, `load` receives `IoCContainer<never>` (no accessible services). */
    dependencies?: Deps;
    /** Factory invoked on first access. Receives a container exposing only the listed dependencies. */
    load(context: IoCContainer<Deps[number]>): IID extends SyncIID<infer T, any> ? T : IID extends AsyncIID<infer T, any> ? Promise<T> : never;
}): ServiceFactory<IID, Deps> {
    return {
        [__asimoServiceFactory]: true as const,
        interface: params.provide,
        dependencies: params.dependencies,
        load: params.load,
    } as any;
}

/**
 * Helper for declaring a lazy-loading bundle of services. Similar to `factory()` but:
 * - `provide` is an array of `AsyncIID`s (bundles cannot provide `SyncIID`s)
 * - `load` is async and returns sub-factories and sub-bundles
 * - The bundle is loaded on-demand when one of its provided IIDs is fetched
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
    /** Async factory invoked on first access to any provided IID. Returns an `IoCContainer` with sub-services registered. */
    load(context: IoCContainer<Deps[number]>): Promise<IoCContainer<any>>;
}): ServiceBundle<IIDs[number], Deps> {
    return {
        [__asimoServiceBundle]: true as const,
        provide: params.provide,
        dependencies: params.dependencies,
        load: params.load,
    } as any;
}

type ServiceEntry =
    | { readonly [__asimoServiceFactory]: true; interface: InterfaceId<any, any>; dependencies?: ServiceDeps }
    | { readonly [__asimoServiceBundle]: true; provide: AsyncIID<any, any>[]; dependencies?: ServiceDeps };

type ServiceIID<S> =
    S extends { readonly [__asimoServiceFactory]: true; interface: infer IID extends InterfaceId<any, any> } ? IID :
    S extends { readonly [__asimoServiceBundle]: true; provide: infer IIDs extends InterfaceId<any, any>[] } ? IIDs[number] :
    never;

interface InternalEntry {
    factory?: ServiceFactory<InterfaceId<any, any>, ServiceDeps>;
    bundle?: ServiceBundle;
    instance?: any;
}

export function createIocContainer<
    const Services extends readonly ServiceEntry[],
    const Parents extends readonly IoCContainer<any>[] | null | undefined = undefined,
>(params: {
    name: string;
    extends?: Parents;
    services: [...{ [K in keyof Services]: ValidService<Services[K], ServiceIID<Services[number]> | (Parents extends readonly any[] ? ContainerIIDs<Parents[number]> : never)> }];
}): IoCContainer<ServiceIID<Services[number]> | (Parents extends readonly any[] ? ContainerIIDs<Parents[number]> : never)> {
    const parents = params.extends ?? null;
    const serviceMap = new Map<InterfaceNamespace, InternalEntry>();
    const loadingBundles = new Set<InterfaceNamespace>();
    const bundleLoadPromises = new Map<InterfaceNamespace, Promise<void>>();

    for (const service of params.services) {
        if (__asimoServiceFactory in service) {
            const sf = service as ServiceFactory<InterfaceId<any, any>, ServiceDeps>;
            serviceMap.set(sf.interface.ns, { factory: sf });
        } else if (__asimoServiceBundle in service) {
            const sb = service as any as ServiceBundle;
            for (const iid of sb.provide) {
                serviceMap.set(iid.ns, { bundle: sb });
            }
        }
    }

    const path = `${(parents?.[0] as IoCContainer<any>)?.path || ""}/${params.name}`;

    const container: InternalContainer = {
        name: params.name,
        path,
        _serviceMap: serviceMap,
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

    return container as any;

    function resolveEntry(entry: InternalEntry): any {
        if (entry.instance) {
            return entry.instance;
        }
        if (entry.factory) {
            entry.instance = entry.factory.load(container);
            return entry.instance;
        }
        return null;
    }

    function loadService<T>(iid: InterfaceId<any>): any {
        const entry = serviceMap.get(iid.ns);
        if (!entry) {
            const value = getParentService(iid);
            if (value !== null) {
                serviceMap.set(iid.ns, { instance: value });
                return value;
            }
            throw new Error(`[Asimo] Service not found: ${iid.ns}`);
        }

        if (entry.bundle && !entry.instance && !entry.factory) {
            return loadBundleAndResolve(entry, iid);
        }

        return resolveEntry(entry)!;
    }

    async function loadBundleAndResolve(entry: InternalEntry, iid: InterfaceId<any>): Promise<any> {
        const bundle = entry.bundle!;
        const bundleKey = bundle.provide[0]?.ns;

        // If this bundle is already being loaded (concurrent access), wait and re-resolve
        if (bundleKey && bundleLoadPromises.has(bundleKey)) {
            const existingLoad = bundleLoadPromises.get(bundleKey)!;
            await existingLoad;
            const updatedEntry = serviceMap.get(iid.ns);
            if (!updatedEntry || (!updatedEntry.factory && !updatedEntry.instance)) {
                throw new Error(
                    `[Asimo] Bundle did not provide service: ${iid.ns}`,
                );
            }
            return resolveEntry(updatedEntry)!;
        }

        // Check for circular: bundle's own load triggers re-entry
        for (const providedIid of bundle.provide) {
            if (loadingBundles.has(providedIid.ns)) {
                throw new Error(
                    `[Asimo] Circular bundle loading detected for: ${providedIid.ns}`,
                );
            }
        }

        for (const providedIid of bundle.provide) {
            loadingBundles.add(providedIid.ns);
        }

        const loadPromise = (async () => {
            const subContainer = await bundle.load(container as any);
            const subMap = (subContainer as InternalContainer)._serviceMap;
            const provideNs = new Set(bundle.provide.map(iid => iid.ns));
            if (subMap) {
                for (const [ns, subEntry] of subMap) {
                    if (provideNs.has(ns)) {
                        serviceMap.set(ns, subEntry);
                    }
                }
            }
        })();

        if (bundleKey) {
            bundleLoadPromises.set(bundleKey, loadPromise);
        }

        try {
            await loadPromise;
            const updatedEntry = serviceMap.get(iid.ns);
            if (!updatedEntry || (!updatedEntry.factory && !updatedEntry.instance)) {
                throw new Error(
                    `[Asimo] Bundle did not provide service: ${iid.ns}`,
                );
            }
            return resolveEntry(updatedEntry)!;
        } finally {
            for (const providedIid of bundle.provide) {
                loadingBundles.delete(providedIid.ns);
            }
            if (bundleKey) {
                bundleLoadPromises.delete(bundleKey);
            }
        }
    }

    function getOptionalService<T>(iid: InterfaceId<any>): any {
        const entry = serviceMap.get(iid.ns);
        if (entry) {
            if (entry.bundle && !entry.instance && !entry.factory) {
                return null;
            }
            return resolveEntry(entry);
        }
        return getParentService(iid);
    }

    async function fetchOptionalService<T>(iid: InterfaceId<any>): Promise<any> {
        return getOptionalService(iid);
    }

    function getParentService<T>(iid: InterfaceId<any>): any {
        if (parents) {
            for (const parent of parents) {
                const parentEntry = (parent as InternalContainer).getOptional(iid);
                if (parentEntry !== null && parentEntry !== undefined) {
                    return parentEntry;
                }
            }
        }
        return null;
    }
}
