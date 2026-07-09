import {
    AsyncIID,
    InterfaceId,
    InterfaceNamespace,
    IoCContainer,
    ServiceFactory,
    SyncIID,
} from "./asimo.types";

/**
 * Create an interface token for values that can be retrieved synchronously
 * @param ns the interface namespace, e.g. "myapplication.services.Configuration"
 * @returns
 */
export function syncIID<T>(ns: InterfaceNamespace): SyncIID<T> {
    return { ns, sync: true } as SyncIID<T>;
}

/**
 * Create an interface token for values that can be retrieved asynchronously
 * @param ns the interface namespace, e.g. "common.utils.Fetch"
 * @returns
 */
export function asyncIID<T>(ns: InterfaceNamespace): AsyncIID<T> {
    return { ns, sync: false } as AsyncIID<T>;
}

export function createIocContainer<Services extends ServiceFactory<InterfaceId<any>>[]>(params: {
    name: string;
    services: [...Services];
}): IoCContainer<Services[number]['interface']> {
    const serviceMap = new Map<
        InterfaceNamespace,
        { factory: ServiceFactory<InterfaceId<any>>; instance?: any }
    >();
    for (const service of params.services) {
        serviceMap.set(service.interface.ns, { factory: service });
    }

    return {
        name: params.name,
        get(...iids: SyncIID<any>[]): any {
            if (iids.length === 1) {
                const iid = iids[0];
                if (!iid.sync) {
                    throw new Error(`[Asimo] Cannot get async interface ${iid.ns} synchronously`);
                }
                return loadService(iid);
            }
            return iids.map((iid) => {
                if (!iid.sync) {
                    throw new Error(`[Asimo] Cannot get async interface ${iid.ns} synchronously`);
                }
                return loadService(iid);
            });
        },
        async fetch(...iids: InterfaceId<any>[]): Promise<any> {
            if (iids.length === 1) {
                return loadService(iids[0]);
            }
            return Promise.all(iids.map((iid) => loadService(iid)));
        },
    } as IoCContainer<Services[number]['interface']>;

    function loadService<T>(iid: InterfaceId<any>): any {
        const entry = serviceMap.get(iid.ns);
        if (!entry) {
            throw new Error(`[Asimo] Service not found: ${iid.ns}`);
        }
        if (!entry.instance) {
            entry.instance = entry.factory.load();
        }
        return entry.instance;
    }
}
