import { useContext as _useContext } from "preact/hooks";
import { LmlJSX } from "../libs/lml/types";
import { createContext as _createContext } from "preact";
import { InterfaceId } from "@asimojs/asimo/lib/types";

/**
 * Hack to extract the first context object in preact
 * Necessary until preact allows to define and retrieve a context with/by id
 * (today id is generated and first id is "__cC0" - besides transpiler transforms the "_id" property into "__c")
 */
const CTXT_FIRST_ID = "__cC0";
const CTXT_ID_PROP = "__c"; // _id property after transpilation (!)

interface GlobalContext {
    mainCtxt: any;
    subCtxts: {
        [id: string]: any
    }
}

function getGlobalCtxt(): GlobalContext | undefined {
    // Preact createContext doesn't allow to provide a context id for the time being
    // This implementation assumes that only one global context object will be created and that its id will be CTXT_FIRST_ID
    // it also assumes that the transpiler will transform the _id property into CTXT_ID_PROP
    return _useContext({ [CTXT_ID_PROP]: CTXT_FIRST_ID } as any);
}

let globalCreationCount = 0;

/**
 * Create a unique global context to hold all sub-contexts (necessary as preact doesn't allow to pass context ids)
 * @returns
 */
export function createGlobalContext() {
    globalCreationCount++;

    if (globalCreationCount>1) {
        console.error("[utils.createGlobalContext] Global Context cannot be re-render and must be used at the application root")
    }

    const globalCtxt: GlobalContext = {
        mainCtxt: null,
        subCtxts: {}
    };
    const mc = _createContext(globalCtxt);
    globalCtxt.mainCtxt = mc;

    if (!mc || (mc as any)[CTXT_ID_PROP] !== CTXT_FIRST_ID) {
        console.error("[utils.createGlobalContext] New preact version detected - please update the utils library!");
    }
    return (props: { children: any }) => {
        return <mc.Provider value={globalCtxt}>
            {props.children}
        </mc.Provider>
    }
}

export function createContext<T>(iid: InterfaceId<T>, defaultValue: T) {
    let globalCtxt = getGlobalCtxt();
    if (!globalCtxt) {
        globalCtxt = {
            mainCtxt: null,
            subCtxts: {}
        };
        console.error("[UTILS] Global Context not found -> createGlobalContext() is required to use createContext()");
    }
    globalCtxt.subCtxts[iid.ns] = defaultValue;

    return {
        Provider: (props: { value?: T, children: any }) => {
            const { value, children } = props;

            if (value !== undefined) {
                globalCtxt!.subCtxts[iid.ns] = props.value;
            }
            const mainCtxt = globalCtxt!.mainCtxt;
            return <mainCtxt.Provider value={globalCtxt}>
                {children}
            </mainCtxt.Provider>
        }
    }
}

export function useContext<T>(iid: InterfaceId<T>): T | null {
    const globalCtxt = getGlobalCtxt();
    if (globalCtxt) {
        return globalCtxt.subCtxts[iid.ns] || null;
    }
    return null;
}
