import { RX_NODE_NAME } from "../lml";
import { LML } from "../types";

export function print(lml: LML, padding = ""): string[] {
    const r: string[] = [];
    printList(lml, r);
    return r;
}

const CPT_PREFIX = "*";
const ATT_CLASS_SEPARATOR = ".";
const ATT_SINGLE_PREFIX = "!";

function printList(ls: string | any[], out: string[], padding = "") {
    // a list is either an element or a list of nodes
    // e.g. element: ["#div.abc.def", "title", "Hi!", [ "Some content..." ]]
    // or node list: ["Hello", ["#span.highlight", ["World"]], "!"]

    if (typeof ls === "string") {
        // text node
        return out.push(padding + ls);
    }
    if (!Array.isArray(ls)) {
        out.push("Invalid LML syntax: Node Array or Text string expected");
    }

    const len = ls.length;
    if (len === 0) return;
    const v0 = ls[0];

    let isFragment = false;
    if (typeof v0 !== "string") {
        // this list is a fragment
        isFragment = true;
    }

    if (!isFragment) {
        if (v0.length === 0) {
            // empty text node
            return;
        } else if (v0.length === 1) {
            // single char text node
            return out.push(padding + ls);
        }

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

            const r: string[] = [];
            let clsValues = "";

            if (classGroup) {
                const parts = classGroup.split(ATT_CLASS_SEPARATOR)
                clsValues = parts.slice(1).join(" ");
            }

            const cptSymbol = nodeKind === CPT_PREFIX ? "()" : ""; // to test cpt parsing


            if (ns) {
                // ns explicitely showed as attribute for test purposes
                r.push(`<${ns}:${name}${cptSymbol} ns="${ns}"`);
            } else {
                r.push(`<${name}${cptSymbol}`);
            }

            if (ntype) {
                r.push(' type="' + ntype + '"');
            }

            if (clsValues) {
                r.push(' class="' + clsValues + '"');
            }

            let nextIdx = 1;
            const atts = ls[nextIdx];
            if (atts && typeof atts === "object" && !Array.isArray(atts)) {
                // this is the attribute map
                const keys = Object.getOwnPropertyNames(atts);
                for (const attName of keys) {
                    if (attName[0] === ATT_SINGLE_PREFIX) {
                        r.push(` ${attName.slice(1)}`);
                    } else {
                        r.push(` ${attName}=${JSON.stringify(atts[attName] || "")}`);
                    }
                }
                nextIdx++;
            }

            let children: any = null;
            if (len > nextIdx) {
                // next entries are children
                children = ls.slice(nextIdx);
            }

            if (children === null) {
                out.push(`${padding}${r.join("")}/>`)
            } else {
                out.push(`${padding}${r.join("")}>`)
                printList(children, out, padding + "  ");
                out.push(`${padding}</${name}>`)
            }

            return;
        }
    }

    // ls is a fragment
    for (const nd of ls) {
        printList(nd, out, padding);
    }
}
