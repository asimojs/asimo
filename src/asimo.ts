import {
    AsmContext,
    AsmInterfaceDefinition,
    AsmRefId,
    ConsoleOutput,
    InterfaceId,
    InterfaceNamespace,
} from "./types";

export { AsmContext };

/**
 * Create an interface id object that will be used to associate an interface namepsace with a typescript type
 * @param ns the interface namespace - e.g. "myapplication.services.Settings"
 * @returns an InterfaceId object
 */
export function interfaceId<T>(ns: InterfaceNamespace): InterfaceId<T> {
    return { ns } as InterfaceId<T>;
}

const SERVICE = "service:";
const OBJECT = "object:";
const GROUP = "group:";
const NULL_PROMISE = Promise.resolve(null);
const STL_ASM = "color: #669df6";
const STL_DATA = "color: #e39f00;font-weight:bold";

// global console output mode - same value for all contexts
let consoleOutput: ConsoleOutput = "Errors";
// counter used to name unnamed contexts
let count = 0;
// counter used to create reference ids
let refCount = 0;

/**
 * Create an asimo context
 * @param nameOrOptions the context name or an options object with the following properties:
 * - name: the context name (default: a unique name will be created)
 * - parent: the parent context (default: null = root context)
 * @returns an asimo context
 */
export function createContext(
    nameOrOptions?: string | { name?: string; parent?: AsmContext },
): AsmContext {
    let name = "";
    let parent: AsmContext | null = null;
    if (typeof nameOrOptions === "string") {
        name = nameOrOptions || `AsmContext${++count}`;
    } else {
        name = nameOrOptions?.name || `AsmContext${++count}`;
        parent = nameOrOptions?.parent || null;
    }
    name = name.replace(/\//g, "\\/");
    const path = `${parent?.path || ""}/${name}`;

    // group counter used to create unique group ids
    let groupCount = 0;
    // registered factories - keys have the following format:
    // "[object|service|group|loader]:[interfaceNamespace|groupId]"
    const factories = new Map<string, () => any | Promise<any>>();
    // services or loaders that have already been instanciated
    const services = new Map<string, Promise<any>>();
    // object refs
    let refs: null | Map<string, WeakRef<object>> = null;

    const ctxt = {
        /** The context name */
        get name() {
            return name;
        },
        /** The parent context, if any */
        get parent() {
            return parent;
        },
        /** The interface path, built from the context parent path */
        get path() {
            return path;
        },
        /** The interface definitions that are currently loaded in the context */
        get definitions() {
            const defs: AsmInterfaceDefinition[] = [];
            for (const k of factories.keys()) {
                // ex: "service:asimo.src.tests.Calculator"
                const parts = k.split(":");
                const def: AsmInterfaceDefinition = {
                    iid: parts[1] ?? "",
                    type: parts[0] as AsmInterfaceDefinition["type"],
                };
                if (def.type === "service") {
                    def.loaded = services.has(k);
                }
                defs.push(def);
            }
            return defs;
        },
        /** Register a service factory */
        registerService<T>(iid: InterfaceId<T>, factory: () => T | Promise<T>): void {
            if (validate(iid, factory, "registerService")) {
                factories.set(SERVICE + iid.ns, factory);
                removeGroupEntry(iid.ns);
            }
        },
        /** Register an object factory */
        registerFactory<T>(iid: InterfaceId<T>, factory: () => T | Promise<T>): void {
            if (validate(iid, factory, "registerFactory")) {
                factories.set(OBJECT + iid.ns, factory);
                removeGroupEntry(iid.ns);
            }
        },
        /** Register a factory group */
        registerGroup(iids: InterfaceId<any>[], loader: () => Promise<unknown>): void {
            const groupId = GROUP + ++groupCount;
            if (typeof loader !== "function") {
                logError(`[registerGroup] Invalid group loader:`, "" + loader);
                return;
            }
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
                validate(iid, null, "registerGroup") && factories.set(GROUP + iid.ns, groupFactory);
            }
        },
        /** Get a service or an object instance (services have priority) - throw if target not found */
        async get(...iids: (InterfaceId<any> | string)[]): Promise<any> {
            if (iids.length === 1) {
                const iidOrNs = iids[0];
                if (!iidOrNs)
                    throw new Error(`[asimo:${path}] get(): Interface id cannot be empty`);
                return get(typeof iidOrNs === "string" ? iidOrNs : iidOrNs.ns);
            }
            return Promise.all(
                iids.map((iidOrNs) => get(typeof iidOrNs === "string" ? iidOrNs : iidOrNs.ns)),
            );
        },
        /** Get a service or an object instance (services have priority) - return null if target not found */
        async fetch(...iids: (InterfaceId<any> | string)[]): Promise<any | null> {
            if (iids.length === 1) {
                const iidOrNs = iids[0];
                if (!iidOrNs) return null;
                return get(typeof iidOrNs === "string" ? iidOrNs : iidOrNs.ns, true, false);
            }
            return Promise.all(
                iids.map((iidOrNs) =>
                    get(typeof iidOrNs === "string" ? iidOrNs : iidOrNs.ns, true, false),
                ),
            );
        },
        createChildContext(name?: string): AsmContext {
            return createContext({ name, parent: ctxt });
        },
        get consoleOutput() {
            return consoleOutput;
        },
        set consoleOutput(v: "" | "Errors") {
            const lcv = v.toLowerCase();
            if (lcv === "errors") {
                consoleOutput = "Errors";
            } else {
                consoleOutput = "";
            }
        },
        createObjectRef<T extends object>(o: T): AsmRefId<T> {
            const ref = new WeakRef(o);
            if (!refs) {
                refs = new Map();
            }
            const id = `asm-ref-${++refCount}`;
            refs.set(id, ref);
            return id;
        },
        removeObjectRef<T extends Object>(id: AsmRefId<T>): boolean {
            if (!refs) return false;
            return refs.delete(id as string);
        },
        getObject<T extends Object>(id: AsmRefId<T>): T | null {
            return getObject(id) || parent?.getObject(id) || null;
        },
    };
    return ctxt;

    function getObject<T extends Object>(id: AsmRefId<T>): T | null {
        if (!refs) return null;
        const ref = refs.get(id as string);
        if (ref) {
            return (ref.deref() as T) || null;
        }
        return null;
    }

    async function get<T>(
        ns: string,
        lookupGroups = true,
        throwIfNotFound = true,
    ): Promise<T | null> {
        const serviceId = SERVICE + ns;
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
            const f2 = factories.get(OBJECT + ns);
            if (f2) {
                // object factory exists: instantiate the object
                return getPromise(f2);
            } else if (lookupGroups) {
                const f3 = factories.get(GROUP + ns);
                if (f3) {
                    // a group loader exists: instantiate the loader and then lookup again
                    const g = getPromise(f3);
                    return g.then(() => {
                        // look for an interface factory once the group has loaded
                        return get(ns, false, throwIfNotFound) as any;
                    });
                }
            }
            if (parent) {
                if (throwIfNotFound) {
                    return parent.get(ns as any);
                } else {
                    return parent.fetch(ns as any);
                }
            }
        }

        if (throwIfNotFound) {
            logError("Interface not found:", ns);
            throw new Error(`[asimo:${path}] Interface not found: ${ns}`);
        }
        return NULL_PROMISE;
    }

    function validate(
        iid: InterfaceId<any>,
        factory: (() => any) | null,
        context: "registerService" | "registerFactory" | "registerGroup",
    ) {
        if (typeof iid !== "object" || typeof iid.ns !== "string" || iid.ns === "") {
            logError(`${context}: Invalid interface id:`, JSON.stringify(iid));
            return false;
        }
        if (factory && typeof factory !== "function") {
            logError(`${context}: Invalid factory:`, "" + factory);
            return false;
        }
        return true;
    }

    function removeGroupEntry(iidNs: string) {
        factories.delete(GROUP + iidNs);
    }

    function logError(msg: string, data: any) {
        if (consoleOutput === "Errors") {
            console.log(`%cASM [${path}] %c${msg} %c${data}`, STL_ASM, "color: ", STL_DATA);
        }
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

let _asm: AsmContext;

// Expose asm on global object to ease debugging from the browser console
if ((globalThis as any)["asm"]) {
    // asm must be unique
    _asm = (globalThis as any)["asm"];
} else {
    _asm = createContext("asm");
}
(globalThis as any)["asm"] = _asm;

/**
 * Root context
 */
export const asm = _asm;
