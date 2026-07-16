import {
    AsyncIID,
    InterfaceId,
    InterfaceNamespace,
    IoCContainer,
    ServiceDeps,
    ServiceFactory,
    SyncIID,
    ValidService,
    __asimoServiceFactory,
} from "./asimo.types";

interface InternalContainer extends IoCContainer<any> {
    getOptional(...iids: InterfaceId<any>[]): any;
    fetchOptional(...iids: InterfaceId<any>[]): any;
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

export function createIocContainer<
    const Services extends readonly { readonly [__asimoServiceFactory]: true; interface: InterfaceId<any, any>; dependencies?: ServiceDeps }[],
    const Parents extends readonly IoCContainer<any>[] | null | undefined = undefined,
>(params: {
    name: string;
    extends?: Parents;
    services: [...{ [K in keyof Services]: ValidService<Services[K], Services[number]['interface'] | (Parents extends readonly any[] ? ContainerIIDs<Parents[number]> : never)> }];
}): IoCContainer<Services[number]['interface'] | (Parents extends readonly any[] ? ContainerIIDs<Parents[number]> : never)> {
    const parents = params.extends ?? null;
    const serviceMap = new Map<
        InterfaceNamespace,
{ factory?: { load: (ctx: IoCContainer<any>) => any; interface: InterfaceId<any, any>; readonly [__asimoServiceFactory]: true }; instance?: any }
    >();
    for (const service of params.services) {
        serviceMap.set((service as ServiceFactory<InterfaceId<any, any>, any>).interface.ns, { factory: service as any });
    }

    const path = `${(parents?.[0] as IoCContainer<any>)?.path || ""}/${params.name}`;

    const container: InternalContainer = {
        name: params.name,
        path,
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

    function resolveEntry(entry: { factory?: ServiceFactory<InterfaceId<any, any>, ServiceDeps>; instance?: any }): any {
        if (!entry.instance) {
            if (!entry.factory) {
                return null;
            }
            entry.instance = entry.factory.load(container);
        }
        return entry.instance;
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
        return resolveEntry(entry)!;
    }

    function getOptionalService<T>(iid: InterfaceId<any>): any {
        const entry = serviceMap.get(iid.ns);
        if (entry) {
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
