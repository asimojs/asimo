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
const NULL_PROMISE = Promise.resolve(null);

function createContext(parent?: AsmContext): AsmContext {
    // registered factories - keys have the following format:
    // "[object|service]:[interfaceNamespace]"
    const factories = new Map<string, () => any | Promise<any>>();
    // services that have already been instanciated
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

    function get<T>(iid: InterfaceId<T>): Promise<T | null> {
        const serviceId = SERVICE + iid.ns;
        const srv = services.get(serviceId);
        if (srv !== undefined) {
            // already created
            return srv;
        }
        const f = factories.get(serviceId);
        if (f) {
            // instanciate the service
            let p = getPromise(f);
            let resolve: (v: T | null) => void;
            const pr = new Promise((r) => {
                resolve = r;
            });

            p.then((v: any) => {
                if (v && typeof v === "object") {
                    services.set(serviceId, p);
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
                return getPromise(f2);
            } else if (parent) {
                return parent.get(iid);
            }
        }
        return NULL_PROMISE;
    }

    function getPromise<T>(f: () => T | Promise<T>) {
        let p = f() as Promise<any>;
        if (p && typeof p === "object") {
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

