import {
    AsmContext,
    AsmInterfaceDefinition,
    Logger,
    IidNs,
    InterfaceId,
    InterfaceNamespace,
} from "./asimo.types";

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

// global logger - same value for all contexts
let logger: Logger | null = console;
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
    const factories = new Map<string, (c: AsmContext) => any | Promise<any>>();
    // services or loaders that have already been instanciated
    const services = new Map<string, Promise<any>>();
    // objects that can be retrieved through get
    let objects: Map<string, object> | null = null;

    const ctxt: AsmContext = {
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
        registerService<T>(iid: InterfaceId<T>, factory: (c: AsmContext) => T | Promise<T>): void {
            if (validate(iid, factory, "registerService")) {
                factories.set(SERVICE + iid.ns, factory);
                removeGroupEntry(iid.ns);
            }
        },
        /** Register an object factory */
        registerFactory<T>(iid: InterfaceId<T>, factory: (c: AsmContext) => T | Promise<T>): void {
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
                ldp = getPromise(loader, ctxt);
                services.set(groupId, ldp);
                return ldp;
            };
            for (const iid of iids) {
                validate(iid, null, "registerGroup") && factories.set(GROUP + iid.ns, groupFactory);
            }
        },
        /** Get a registered object */
        get(iid0: IidNs<any>, iid1OrDefault?: any, ...iids: InterfaceId<any>[]): any {
            const ns0 = namespace(iid0);
            if (
                iid1OrDefault === undefined ||
                iid1OrDefault === null ||
                typeof iid1OrDefault !== "object" ||
                !("ns" in iid1OrDefault) ||
                typeof iid1OrDefault.ns !== "string"
            ) {
                // only one argument + optional default
                const v = getObject(ns0);
                if (v === NOT_FOUND) {
                    if (iid1OrDefault !== undefined) {
                        return iid1OrDefault;
                    } else {
                        logError(`Object not found: ${description(ns0)}`, true);
                    }
                }
                return v;
            } else {
                // list of iids
                const iid1 = iid1OrDefault;
                const namespaces = [ns0, namespace(iid1), ...iids.map((iid) => namespace(iid))];
                const values = namespaces.map((ns) => getObject(ns));
                const nsNotFounds: string[] = [];
                for (let i = 0; values.length > i; i++) {
                    if (values[i] === NOT_FOUND) {
                        nsNotFounds.push(namespaces[i]);
                    }
                }
                if (nsNotFounds.length) {
                    if (nsNotFounds.length === 1) {
                        logError(`Object not found: "${nsNotFounds[0]}"`, true);
                    } else {
                        logError(`Objects not found: ["${nsNotFounds.join('", "')}"]`, true);
                    }
                }
                return values;
            }
        },
        /** Fetch a service or an object instance (services have priority) */
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
        createChildContext(name?: string): AsmContext {
            return createContext({ name, parent: ctxt });
        },
        get logger() {
            return logger;
        },
        set logger(lg: Logger | null) {
            logger = lg;
        },
        /**
         * Log the asimo state into an array or in the console if no output argument is provided
         * @param output
         */
        logState(output?: string[]) {
            const out = output || [];
            const defs = ctxt.definitions;
            out.push(`Context ${ctxt.path}${defs.length === 0 ? " [empty]" : ":"}`);
            out.push(...defs.map((d) => `+ ${d.iid} [${d.type}]${loadState(d)}`));
            ctxt.parent?.logState(out);
            if (!output) {
                logger?.log(out);
            }

            function loadState(d: AsmInterfaceDefinition) {
                if (d.type === "service") {
                    return d.loaded ? ": loaded" : ": not loaded";
                }
                return "";
            }
        },
    };
    return ctxt;

    /** Return the namespace associcate to an interface id */
    function namespace(iid: IidNs<any>) {
        return typeof iid === "string" ? iid : iid.ns;
    }

    function getObject<T>(ns: string): T | typeof NOT_FOUND {
        const r = objects?.get(ns);
        if (r !== undefined) return r as T;
        if (parent) {
            return parent.get(ns, NOT_FOUND);
        }
        return NOT_FOUND;
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
            let p = getPromise(f, ctxt);
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
                return getPromise(f2, ctxt);
            } else if (lookupGroups) {
                const f3 = factories.get(GROUP + ns);
                if (f3) {
                    // a group loader exists: instantiate the loader and then lookup again
                    const g = getPromise(f3, ctxt);
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
        factory: ((c: AsmContext) => any) | null,
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
        if (logger === console) {
            console.log(`%cASM [${path}] %c${msg}`, STL_ASM, "color: ", STL_DATA);
        } else {
            logger?.log(`ASM [${path}] ${msg}`);
        }
        if (throwError) {
            throw new Error(`ASM [${path}] ${msg}`);
        }
    }

    async function getPromise<T>(f: (c: AsmContext) => T | Promise<T>, ctxt: AsmContext) {
        let v: any | null = null;
        try {
            v = (await f(ctxt)) as any;
        } catch (ex) {
            v = null;
            logError(`Instantiation error: ${(ex as any)?.message || ex}`);
        }
        return v;
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
