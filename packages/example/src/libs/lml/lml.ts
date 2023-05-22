import { LML, LmlAttributeMap, JsxContent, LmlFormatter, LmlNodeInfo, LmlObject, LmlUpdate, LmlNode, LmlNodeListUpdate, LmlTextNode, LmlNodeType, LmlFragment, LmlSanitizationRules } from "./types";

/**
 * Return the type of an LML node
 * @param node
 * @returns
 */
export function nodeType(node: LML): LmlNodeType {
    if (Array.isArray(node)) {
        if (node.length === 0) return "fragment";
        const v0 = node[0];
        if (typeof v0 === "string" && v0.length > 1) {
            const ch0 = v0[0];
            if (ch0 === ELT_PREFIX) {
                return "element";
            } else if (ch0 === CPT_PREFIX) {
                return "component";
            } else if (ch0 === DECO_PREFIX || ch0 === RESERVED_PREFIX) {
                return "invalid"; // not yet supported
            }
        }
        return "fragment";
    } else if (typeof node === "string") {
        return "text";
    }
    return "invalid";
}

const ELT_PREFIX = "#";
const CPT_PREFIX = "*";
const DECO_PREFIX = "@";
const RESERVED_PREFIX = "!";
const ATT_KEY_SEPARATOR = "!";
const ATT_CLASS_SEPARATOR = ".";
// [nodetype:#|*|!|@][namespace:?][nodename][+typeattribute?][.classattributes*][!keyattribute?]
export const RX_NODE_NAME = /^(\#|\*|\!|\@)(\w+\:)?([\w\-]+)(\+[\w\-]+)?(\.[\.\w\-]+)*(\!.+)?$/;

/**
 * Scan LML data and transform them to JSX thanks to the formatter passed as arguement
 * @param v an LML value
 * @param f the formatter (that will call the jsx runtime behinde the scenes)
 * @returns
 */
export function processJSX(v: LML, f: LmlFormatter): JsxContent {
    if (v === undefined || v === null) return "";
    const ndType = nodeType(v);

    if (ndType === "text") {
        // text node
        return textNode(v as string);
    }
    if (ndType === "invalid") {
        return error(`Invalid LML node: ${JSON.stringify(v)}`);
    }

    const isFragment = ndType === "fragment";

    const ls = v;
    const len = ls.length;
    if (len === 0) return "";

    if (!isFragment) {
        const v0 = ls[0] as string;
        // check if first value matches a node name
        const m = v0.match(RX_NODE_NAME);

        if (m) {
            const nodeKind = m[1];
            const nsGroup = m[2];
            const name = m[3];
            const typeGroup = m[4];
            const classGroup = m[5];
            const key = m[6];
            const ns = nsGroup ? nsGroup.slice(0, -1) : "";
            const ntype = typeGroup ? typeGroup.slice(1) : "";
            let clsValues: string[] | undefined;

            if (classGroup) {
                const parts = classGroup.split(ATT_CLASS_SEPARATOR)
                clsValues = [];
                for (const s of parts) {
                    if (s != "") {
                        clsValues.push(s);
                    }
                }
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
            if (key) {
                if (!atts) {
                    atts = {};
                }
                atts["key"] = key.slice(1);
            }

            // lookup children
            let children: any = undefined;
            if (len > nextIdx) {
                // next entries are children
                children = [];
                for (let i = nextIdx; i < len; i++) {
                    children.push(processJSX(ls[i] as any, f));
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
            const val = processJSX(nd, f);
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
        return f.format({ type: "text", value: v });
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
 * Default sanitization rules - rather aggressive to avoid unecessary complexity
 * (can be overridden and tuned on the application side)
 */
export const defaultSanitizationRules: LmlSanitizationRules = {
    /**
     * Allowed tags - img + tags from https://github.com/apostrophecms/sanitize-html
     * Note: form and input are not in the list
     */
    allowedElements: new Set([
        "address", "article", "aside", "footer", "header", "h1", "h2", "h3", "h4",
        "h5", "h6", "hgroup", "main", "nav", "section", "blockquote", "dd", "div",
        "dl", "dt", "figcaption", "figure", "hr", "li", "main", "ol", "p", "pre",
        "ul", "a", "abbr", "b", "bdi", "bdo", "br", "cite", "code", "data", "dfn",
        "em", "i", "kbd", "mark", "q", "rb", "rp", "rt", "rtc", "ruby", "s", "samp",
        "small", "span", "strong", "sub", "sup", "time", "u", "var", "wbr", "caption",
        "col", "colgroup", "table", "tbody", "td", "tfoot", "th", "thead", "tr", "img"
    ]),

    /** Forbid style, srcset and event handler attributes */
    forbiddenElementAttributes: new Set(["style", "srcset"]),


    forbidEventHandlers: true,

    /**
     * URL attributes used in allowedElements, will be checked against allowedUrlPrefixes
     * as per https://stackoverflow.com/questions/2725156/complete-list-of-html-tag-attributes-which-have-a-url-value
     */
    urlAttributes: new Set(["href", "src", "cite", "action", "profile", "longdesc", "usemap", "formaction", "icon",
        "poster", "background", "codebase", "data", "classid", "manifest"]),

    /** Allowed URLs - DO NOT PUT "data:text" -> data:text/html can contain malicious scripts */
    allowedUrlPrefixes: ["/", "./", "http://", "https://", "mailto://", "tel://", "data:image/"]
}

/**
 * Convert an LML structure to a JSX tree through a createElement like function (argument).
 * The JSX tree is also sanitized
 * @param v the lml data to convert
 * @param createElement the React.createElement function (or h function for preact)
 * @param getComponent a function called when a component is found to retrieve an actual component reference [optional]
 * @param error error handler that will be called in case of error [optional]
 * @returns
 */
export function lml2jsx(v: LML,
    createElement: (type: any | Function, props: { [key: string]: any }, ...children: any) => JSX.Element,
    getComponent?: ((name: string, namespace: string) => Function | null) | null,
    error?: (msg: string) => void,
    sanitizationRules?: LmlSanitizationRules)
    : JsxContent {

    error = error || ((m: string) => console.error("[lm2JSX Error] " + m));

    const rules = sanitizationRules || defaultSanitizationRules;

    let allowedUrlPrefixes: RegExp | null = null;
    if (rules.allowedUrlPrefixes.length) {
        const rx = `^(${rules.allowedUrlPrefixes.join('|')})`;
        allowedUrlPrefixes = new RegExp(rx, "i");
    }


    return processJSX(v, {
        format: (ndi: LmlNodeInfo, attributes?: LmlAttributeMap, children?: (JSX.Element | string)[]): JSX.Element | string => {
            const tp = ndi.type;
            if (tp === "text") {
                return ndi.value;
            } else if (tp === "element" || tp === "component") {
                if (tp === "element") {
                    if (!rules.allowedElements.has(ndi.tagName)) {
                        error!(`Unauthorized element: ${ndi.tagName}`);
                        return "";
                    }
                    if (attributes) {
                        for (const name of Object.getOwnPropertyNames(attributes)) {
                            if (rules.forbiddenElementAttributes.has(name)) {
                                error!(`Unauthorized element attribute: ${name}`);
                                delete attributes[name];
                            } else if (rules.forbidEventHandlers && name.match(/^on/i)) {
                                error!(`Unauthorized event handler: ${name}`);
                                delete attributes[name];
                            } else if (allowedUrlPrefixes && rules.urlAttributes.has(name)) {
                                const v = attributes[name];
                                if (typeof (v) !== "string" || !v.match(allowedUrlPrefixes)) {
                                    error!(`Unauthorized URL: ${name}="${v}"`);
                                    delete attributes[name];
                                }
                            }
                        }
                    }
                }
                // change class into className
                if (attributes && attributes["class"]) {
                    attributes["className"] = attributes["class"];
                    // delete attributes["class"]; // seems to be ignored by react or preact when className is set
                }
                if (attributes && attributes["key"]) {
                    // key will be interpreted by the JSX engine and will not be accessible to the node
                    attributes["keyValue"] = attributes["key"];
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

/**
 * In-place update of an LML data structure with instructions provided as arguments
 * Return the new data structure (may be different if the original data is not a fragment)
 * @param data
 * @param instructions
 * @returns
 */
export function updateLML(data: LML, instructions: LmlUpdate[]): LML {
    // instructions mapped by node key
    const targetKeys: Set<string> = new Set();
    for (const instruction of instructions) {
        targetKeys.add(instruction.node);
    }

    const nodes: Map<string, { node: LmlNode, parent: any, parentRef: string | number }> = new Map();
    const max = targetKeys.size;
    let count = 0;

    const root = [data];

    scanNode(data, (k, node, parent, parentRef) => {
        if (targetKeys.has(k)) {
            count++;
            nodes.set(k, {
                node,
                parent,
                parentRef
            });
        }
        return count < max; // stop when all nodes have been found
    }, root, 0);

    // apply the insructions in order
    for (const ins of instructions) {
        const action = ins.action;
        const k = ins.node;
        let nd = nodes.get(k);
        if (!nd) continue;


        let parent = nd.parent, prop = nd.parentRef, node = nd.node;
        const path = ins.path;

        if (path === "children") {
            if (node.length > 1) {
                let child1 = 1;
                if (typeof node[child1] !== "string" && !Array.isArray(node[child1])) {
                    child1++;
                }

                if (action === "delete") {
                    node.splice(child1, node.length - child1);
                } else {
                    const content = ins.content;
                    const contentType = nodeType(content);

                    if (contentType !== "invalid") {
                        const isFragment = contentType === "fragment";

                        // special case as children are not stored as attributes
                        if (action === "insertBefore" || action === "prepend") {
                            if (isFragment) {
                                node.splice.apply(node, [child1, 0, ...content]);
                            } else {
                                node.splice(child1, 0, content);
                            }
                        } else if (action === "insertAfter" || action === "append") {
                            if (isFragment) {
                                node.push.apply(node, content as LmlFragment);
                            } else {
                                node.push(content);
                            }
                        } else if (action === "replace") {
                            if (isFragment) {
                                node.splice.apply(node, [child1, node.length - child1, ...content]);
                            } else {
                                node.splice(child1, node.length - child1, content);
                            }

                        }
                    }
                }
            }

            continue;
        } else if (path) {
            const pathElts = path.split("/");
            if (Array.isArray(node) && node.length > 1) {
                node = node[1] as any; // attribute object
            } else {
                // invalid path
                continue;
            }
            for (const pe of pathElts) {
                parent = node; // argument object
                prop = pe;
                node = parent[prop];
            }
        }
        if (!nd) continue;

        if (action === "delete") {
            if (Array.isArray(parent)) {
                if (typeof prop === "number") {
                    parent.splice(prop, 1);
                }
            } else if (parent) {
                // node is root
                parent[prop] = [];
            }
        } else {
            const content = ins.content!;
            const contentType = nodeType(content);

            if (contentType !== "invalid") {
                const isContentFragment = contentType === "fragment";
                if (action === "insertBefore" || action === "insertAfter" || action === "replace") {
                    if (Array.isArray(parent)) {
                        if (typeof prop === "number") {
                            let idx = prop, nbrOfDel = 0; // insertBefore defaults
                            if (action === "insertAfter") {
                                idx++;
                            } else if (action === "replace") {
                                nbrOfDel++;
                            }
                            if (isContentFragment) {
                                parent.splice.apply(parent, [idx, nbrOfDel, ...content]);
                            } else {
                                parent.splice(idx, nbrOfDel, content);
                            }
                        } // else: should be unreachable
                    } else if (parent) {
                        // node is root
                        if (action === "insertBefore") {
                            if (isContentFragment) {
                                parent[prop] = [...content, node];
                            } else {
                                parent[prop] = [content, node];
                            }
                        } else if (action === "insertAfter") {
                            if (isContentFragment) {
                                parent[prop] = [node, ...content];
                            } else {
                                parent[prop] = [node, content];
                            }
                        } else if (action === "replace") {
                            parent[prop] = content;
                        }
                    }
                } else if ((action === "prepend" || action === "append") && nodeType(node) === "fragment") {
                    if (action === "append") {
                        if (isContentFragment) {
                            node.push.apply(node, content as LmlFragment);
                        } else {
                            node.push(content);
                        }
                    } else if (action === "prepend") {
                        if (isContentFragment) {
                            node.splice.apply(node, [0, 0, ...content]);
                        } else {
                            node.splice(0, 0, content);
                        }
                    }
                }
            }
        }
    }

    if (root.length === 1) return root[0];
    return root;
}


export function scan(data: any, process: (nodeKey: string, node: LmlNode, parent: any, parentRef: string | number) => boolean) {
    scanNode(data, process, null, 0);
}

/**
 * Recursively scan an LML structure and call the process callback when a node with a key is found
 * If the process callback return false, the scanning process stops
 * @param data
 * @param process
 * @returns
 */
function scanNode(
    data: any,
    process: (nodeKey: string, node: LmlNode, parent: any, parentRef: string | number) => boolean,
    parent: any,
    parentRef: string | number): boolean {
    if (!data) return true;

    const ndType = nodeType(data);

    if (Array.isArray(data) && data.length) {
        // data can be either a fragment or a node
        const isNode = ndType === "component" || ndType === "element";

        if (isNode) {
            let key = "";
            const v0 = data[0];
            const idx = v0.indexOf(ATT_KEY_SEPARATOR);
            if (idx > -1) {
                key = data[0].slice(idx + 1);
            }
            if (key) {
                const r = process(key, data as LmlNode, parent, parentRef);
                if (r === false) return false; // stop scanning
            }
            // scan attributes and children
            for (let i = 1; data.length > i; i++) {
                if (!scanNode(data[i], process, data, i)) return false; // stop scanning
            }
        } else {
            // process all fragment nodes one by one
            for (let i = 0; data.length > i; i++) {
                if (!scanNode(data[i], process, data, i)) return false; // stop scanning
            }
        }
    } else if (typeof data === "object") {
        // scan each object property
        for (const k of Object.getOwnPropertyNames(data)) {
            if (!scanNode((data as any)[k], process, data, k)) return false; // stop scanning
        }
    }
    return true;
}
