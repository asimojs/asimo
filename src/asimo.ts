import {
    AsmContext,
    AsmInterfaceDefinition,
    AsmRefId,
    ConsoleOutput,
    IidNs,
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

/** Internal value to identify not found interfaces */
const NOT_FOUND = Symbol("NOT_FOUND");
const NOT_FOUND_PROMISE = Promise.resolve(NOT_FOUND);

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
    // objects that can be retrieved through getObject / fetchObject
    let objects: Map<string, object> | null = null;

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
        /** Register an object instance */
        registerObject<T extends object>(iid: InterfaceId<T>, o: T): void {
            if (validate(iid, null, "registerObject")) {
                if (!objects) {
                    objects = new Map();
                }
                objects.set(iid.ns, o);
            }
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
                logError(`[registerGroup] Invalid group loader: ${description(loader)}`);
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
        // async get(iid0: IidNs<any>, iid1OrDefault: any, ...iids: IidNs<any>[]): Promise<any> {
        //     if (iids.length === 1) {
        //         const iidOrNs = iids[0];
        //         if (!iidOrNs)
        //             throw new Error(
        //                 `[Dependency Context] get(): Interface id cannot be empty (context: ${path})`,
        //             );
        //         return get(typeof iidOrNs === "string" ? iidOrNs : iidOrNs.ns);
        //     }
        //     return Promise.all(
        //         iids.map((iidOrNs) => get(typeof iidOrNs === "string" ? iidOrNs : iidOrNs.ns)),
        //     );
        // },
        // /** Get a service or an object instance (services have priority) - return null if target not found */
        async fetch(
            iid0: IidNs<any>,
            iid1OrDefault?: any,
            ...iids: InterfaceId<any>[]
        ): Promise<any> {
            const ns0 = namespace(iid0);
            if (
                iid1OrDefault === undefined ||
                iid1OrDefault === null ||
                typeof iid1OrDefault !== "object" ||
                !("ns" in iid1OrDefault) ||
                typeof iid1OrDefault.ns !== "string"
            ) {
                // only one argument + optional default
                const v = await fetch(ns0, true);
                if (v === NOT_FOUND) {
                    if (iid1OrDefault !== undefined) {
                        return iid1OrDefault;
                    } else {
                        logError(`Interface not found: ${description(ns0)}`, true);
                    }
                }
                return v;
            } else {
                // list of iids
                const iid1 = iid1OrDefault;
                const namespaces = [ns0, namespace(iid1), ...iids.map((iid) => namespace(iid))];
                const values = await Promise.all(namespaces.map((ns) => fetch(ns, true)));
                const nsNotFounds: string[] = [];
                for (let i = 0; values.length > i; i++) {
                    if (values[i] === NOT_FOUND) {
                        nsNotFounds.push(namespaces[i]);
                    }
                }
                if (nsNotFounds.length) {
                    if (nsNotFounds.length === 1) {
                        logError(`Interface not found: "${nsNotFounds[0]}"`, true);
                    } else {
                        logError(`Interfaces not found: ["${nsNotFounds.join('", "')}"]`, true);
                    }
                }
                return values;
            }
        },
        /** Retrieve an object that has previously been registered through registerObject(). */
        getObject<T>(iidOrNs: InterfaceId<T> | string): T {
            const ns = typeof iidOrNs === "string" ? iidOrNs : iidOrNs.ns;
            const r = objects?.get(ns);
            if (r !== undefined) return r as T;
            if (parent) {
                try {
                    return parent.getObject(ns);
                } catch (ex) {} // must catch to get the right context path in the error message
            }
            throw new Error(`[Dependency Context] Object "${ns}" not found in ${path}`);
        },
        /** Retrieve an object that has previously been registered through registerObject(). */
        fetchObject<T>(iidOrNs: InterfaceId<T> | string): T | null {
            const ns = typeof iidOrNs === "string" ? iidOrNs : iidOrNs.ns;
            const r = objects?.get(ns);
            if (r !== undefined) return r as T;
            return parent?.fetchObject(ns) || null;
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
    };
    return ctxt;

    /** Return the namespace associcate to an interface id */
    function namespace(iid: IidNs<any>) {
        return typeof iid === "string" ? iid : iid.ns;
    }

    async function fetch<T>(ns: string, lookupGroups = true): Promise<T | typeof NOT_FOUND> {
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
            let resolve: (v: T | typeof NOT_FOUND) => void;
            const pr = new Promise((r) => {
                resolve = r;
            });

            p.then((v: any) => {
                if (v && (typeof v === "object" || typeof v === "function")) {
                    services.set(serviceId, v);
                    resolve(v);
                } else {
                    logError(`Invalid factory output: "${ns}"`);
                    // transform undefined or null into NOT_FOUND
                    services.set(serviceId, NULL_PROMISE);
                    resolve(NOT_FOUND);
                }
            });
            services.set(serviceId, pr); // will be changed when pr is resolved
            return pr as Promise<T | typeof NOT_FOUND>;
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
                        return fetch(ns, false) as any;
                    });
                }
            }
            if (parent) {
                return parent.fetch(ns as any, NOT_FOUND);
            }
        }
        return NOT_FOUND_PROMISE;
    }

    function validate(
        iid: InterfaceId<any>,
        factory: (() => any) | null,
        context: "registerService" | "registerFactory" | "registerGroup" | "registerObject",
    ) {
        if (typeof iid !== "object" || typeof iid.ns !== "string" || iid.ns === "") {
            logError(`[${context}] Invalid interface id: ${description(iid)}`);
            return false;
        }
        if (factory && typeof factory !== "function") {
            logError(`[${context}] Invalid factory: ${description(factory)}`);
            return false;
        }
        return true;
    }

    function description(o: any) {
        let desc = "" + o;
        try {
            desc = JSON.stringify(o);
        } catch (ex) {}
        return desc;
    }

    function removeGroupEntry(iidNs: string) {
        factories.delete(GROUP + iidNs);
    }

    function logError(msg: string, throwError = false) {
        if (consoleOutput === "Errors") {
            console.log(`%cASM [${path}] %c${msg}`, STL_ASM, "color: ", STL_DATA);
        }
        if (throwError) {
            throw new Error(`ASM [${path}] ${msg}`);
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
