import { AsmContext, InterfaceId, InterfaceNamespace } from "./types";

/**
 * Create an interface id object that will be used to associate an interface namepsace with a typescript type
 * @param ns the interface namespace - e.g. "myapplication.services.Settings"
 * @returns an InterfaceId object
 */
export function interfaceId<T>(ns: InterfaceNamespace): InterfaceId<T> {
    return { ns } as InterfaceId<T>;
}

const SERVICE = "service:"
const OBJECT = "object:"
const GROUP = "group:"
const NULL_PROMISE = Promise.resolve(null);

function createContext(parent?: AsmContext): AsmContext {
    // group counter used to create unique group ids
    let groupCount = 0;
    // registered factories - keys have the following format:
    // "[object|service|group|loader]:[interfaceNamespace|groupId]"
    const factories = new Map<string, () => any | Promise<any>>();
    // services or loaders that have already been instanciated
    const services = new Map<string, Promise<any>>();

    const ctxt = {
        /** Register a service factory */
        registerService<T>(iid: InterfaceId<T>, factory: () => T | Promise<T>): void {
            // TODO: validate args
            factories.set(SERVICE + iid.ns, factory);
        },
        /** Register an object factory */
        registerFactory<T>(iid: InterfaceId<T>, factory: () => T | Promise<T>): void {
            // TODO: validate args
            factories.set(OBJECT + iid.ns, factory);
        },
        /** Register a factory group */
        registerGroup(iids: InterfaceId<any>[], loader: () => Promise<unknown>): void {
            const groupId = GROUP + (++groupCount);
            // factory that will load the group and cache its result in the services map
            const groupFactory = () => {
                // if loader has already been instantiated, return it
                let ldp = services.get(groupId);
                if (ldp) {
                    return ldp;
                }
                ldp = getPromise(loader);
                services.set(groupId, ldp);
                return ldp;
            };
            for (const iid of iids) {
                factories.set(GROUP + iid.ns, groupFactory);
            }
        },
        /** Get a service or an object instance (services have priority) */
        get(...iids: InterfaceId<any>[]): Promise<any> {
            if (iids.length === 1) {
                return get(iids[0]);
            }
            return Promise.all(iids.map((iid) => get(iid)));
        },
        createChildContext(): AsmContext {
            return createContext(ctxt);
        }
    }
    return ctxt;

    function get<T>(iid: InterfaceId<T>, lookupGroups = true): Promise<T | null> {
        const serviceId = SERVICE + iid.ns;
        const srv = services.get(serviceId);
        if (srv !== undefined) {
            // already created
            return srv;
        }
        const f = factories.get(serviceId);
        if (f) {
            // service factory exists: instanciate the service
            let p = getPromise(f);
            let resolve: (v: T | null) => void;
            const pr = new Promise((r) => {
                resolve = r;
            });

            p.then((v: any) => {
                if (v && (typeof v === "object" || typeof v === "function")) {
                    services.set(serviceId, v);
                    resolve(v);
                } else {
                    // transform undefined into null
                    services.set(serviceId, NULL_PROMISE);
                    resolve(null);
                }
            });
            services.set(serviceId, pr); // will be changed when pr is resolved
            return pr as Promise<T | null>;
        } else {
            const f2 = factories.get(OBJECT + iid.ns);
            if (f2) {
                // object factory exists: instantiate the object
                return getPromise(f2);
            } else if (lookupGroups) {
                const f3 = factories.get(GROUP + iid.ns);
                if (f3) {
                    // a group loader exists: instantiate the loader and then lookup again
                    const g = getPromise(f3);
                    return g.then(() => {
                        // look for an interface factory once the group has loaded
                        return get(iid, false);
                    });
                }
            }
            if (parent) {
                return parent.get(iid);
            }
        }
        return NULL_PROMISE;
    }

    function getPromise<T>(f: () => T | Promise<T>) {
        let p = f() as Promise<any>;
        if (p && (typeof p === "object" || typeof p === "function")) {
            if (typeof p.then !== "function") {
                // wrap p as a promise
                p = Promise.resolve(p);
            }
        } else {
            p = NULL_PROMISE;
        }
        return p;
    }
}

/**
 * Root context
 */
export const asm = createContext();

