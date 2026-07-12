import {
    AsyncIID,
    InterfaceId,
    InterfaceNamespace,
    IoCContainer,
    ServiceFactory,
    SyncIID,
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

export function createIocContainer<
    const Services extends ServiceFactory<InterfaceId<any, any>>[],
    const Parents extends readonly IoCContainer<any>[] | null | undefined = undefined,
>(params: {
    name: string;
    extends?: Parents;
    services: [...Services];
}): IoCContainer<Services[number]['interface'] | (Parents extends readonly any[] ? ContainerIIDs<Parents[number]> : never)> {
    const parents = params.extends ?? null;
    const serviceMap = new Map<
        InterfaceNamespace,
        { factory?: ServiceFactory<InterfaceId<any, any>>; instance?: any }
    >();
    for (const service of params.services) {
        serviceMap.set(service.interface.ns, { factory: service });
    }

    const container: InternalContainer = {
        name: params.name,
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

    function resolveEntry(entry: { factory?: ServiceFactory<InterfaceId<any, any>>; instance?: any }): any {
        if (!entry.instance) {
            if (!entry.factory) {
                return null;
            }
            entry.instance = entry.factory.load();
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
