import { LML, LmlAttributeMap, LmlJSX, LmlFormatter, LmlNodeInfo, LmlObject } from "./types";

const ELT_PREFIX = "#";
const CPT_PREFIX = "*";
const DECO_PREFIX = "@";
const ATT_CLASS_SEPARATOR = ".";
const RX_NODE_NAME = /^(\#|\*|\!|\@)(\w+\:)?(\w+)(\-\w+)?((\.\w+)*)$/;

/**
 * Scan LML data transform them to JSX thanks to the formatter passed as arguement
 * @param v an LML value
 * @param f the formatter (that will call the jsx runtime behinde the scenes)
 * @returns
 */
export function scan(v: LML, f: LmlFormatter): LmlJSX {
    if (v === undefined || v === null) return "";

    if (typeof v === "string") {
        // text node
        return textNode(v);
    }
    if (!Array.isArray(v)) {
        return error(`Invalid LML node: ${JSON.stringify(v)}`);
    }

    const ls = v;
    const len = ls.length;
    if (len === 0) return "";
    const val0 = ls[0];

    let isFragment = false;
    if (typeof val0 !== "string") {
        // this list is a fragment
        isFragment = true;
    } else {
        const v0 = val0 as string;
        if (v0.length < 1) isFragment = true;
    }

    if (!isFragment) {
        const v0 = val0 as string;
        // check if first value matches a node name
        const m = v0.match(RX_NODE_NAME);

        if (m) {
            const nodeKind = m[1];
            const nsGroup = m[2];
            const name = m[3];
            const typeGroup = m[4];
            const classGroup = m[5];
            const ns = nsGroup ? nsGroup.slice(0, -1) : "";
            const ntype = typeGroup ? typeGroup.slice(1) : "";

            let clsValues: string[] | undefined;

            if (classGroup) {
                const parts = classGroup.split(ATT_CLASS_SEPARATOR)
                clsValues = parts.slice(1);
            }

            // lookup attributes
            let nextIdx = 1;
            let atts: LmlObject | undefined = undefined;
            const next = ls[nextIdx];
            if (next && typeof next === "object" && !Array.isArray(next)) {
                // atts is the attribute map
                atts = next;
                nextIdx++;

                if (ntype) {
                    atts["type"] = ntype;
                }
                if (clsValues) {
                    if (atts["class"] && typeof atts["class"] === "string") {
                        atts["class"] = clsValues.join(" ") + " " + atts["class"];
                    } else {
                        atts["class"] = clsValues.join(" ");
                    }
                }
            }
            if (!atts && (clsValues || ntype)) {
                atts = {};
                if (ntype) {
                    atts["type"] = ntype;
                }
                if (clsValues) {
                    atts["class"] = clsValues.join(" ");
                }
            }

            // lookup children
            let children: any = undefined;
            if (len > nextIdx) {
                // next entries are children
                children = [];
                for (let i = nextIdx; i < len; i++) {
                    children.push(scan(ls[i] as any, f));
                }
            }

            if (nodeKind === ELT_PREFIX || nodeKind === CPT_PREFIX || nodeKind === DECO_PREFIX) {
                let kind = (nodeKind === ELT_PREFIX) ? "element" : "component";
                if (nodeKind === DECO_PREFIX) {
                    kind = "decorator";
                }
                const ndInfo: LmlNodeInfo = {
                    type: kind as any,
                    tagName: name,
                    ns
                }
                return f.format(ndInfo, atts, children);
            } else {
                // other
                error(`Unsupported node prefix: ${nodeKind}`);
            }

            return "";
        }
    }

    // ls is a fragment
    const r: (JSX.Element | string)[] = [];
    for (const nd of ls) {
        if (typeof nd === "string" || Array.isArray(nd)) {
            const val = scan(nd, f);
            if (val) {
                if (Array.isArray(val)) {
                    for (let item of val) {
                        r.push(item);
                    }
                } else {
                    r.push(val);
                }
            }
        } else {
            error(`Invalid LML node: ${JSON.stringify(nd)}`);
        }
    }
    return r.length > 0 ? r : "";

    function textNode(v: string) {
        return f.format({ type: "string", value: v });
    }

    function error(msg: string): string {
        const MAXLEN = 100;
        if (f.error) {
            if (msg.length > MAXLEN) {
                msg = msg.slice(0, MAXLEN) + "...";
            }
            f.error(msg);
        } else {
            console.error("[LML Scan Error] " + msg);
        }
        return "";
    }
}

/**
 * Convert an LML structure to a JSX tree
 * @param v the lml data to convert
 * @param createElement the React.createElement function (or h function for preact)
 * @param getComponent a function that will be called when a component is found [optional]
 * @param error error handler that will be called in case of error [optional]
 * @returns
 */
export function lml2jsx(v: LML,
    createElement: (type: any | Function, props: { [key: string]: any }, ...children: any) => JSX.Element,
    getComponent?: (name: string, namespace: string) => Function | null,
    error?: (msg: string) => void): LmlJSX {

    error = error || ((m: string) => console.error("[lm2JSX Error] " + m));

    return scan(v, {
        format: (ndi: LmlNodeInfo, attributes?: LmlAttributeMap, children?: (JSX.Element | string)[]): JSX.Element | string => {
            const tp = ndi.type;
            if (tp === "string") {
                return ndi.value;
            } else if (tp === "element" || tp === "component") {
                // change class into className
                if (attributes && attributes["class"]) {
                    attributes["className"] = attributes["class"];
                    // delete attributes["class"]; // seems to be ignored by react or preact when className is set
                }
                let nameOrRef = (ndi as any).tagName;
                if (tp === "component") {
                    const cpt = (getComponent && getComponent(nameOrRef, ndi.ns || "")) || null;
                    if (!cpt) {
                        error!("Invalid component: " + (ndi.ns ? ndi.ns + ":" : "") + nameOrRef);
                        return "";
                    }
                    nameOrRef = cpt;
                }
                if (children) {
                    return createElement(nameOrRef, attributes as any || null, ...children);
                }
                return createElement(nameOrRef, attributes as any || null);
            }
            error!("Unsupported node type: " + tp);
            return "";
        },
        error
    });
}
