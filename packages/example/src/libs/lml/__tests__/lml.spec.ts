import { describe, expect, it } from 'vitest'
import { LML } from '../types';
import { RX_NODE_NAME } from '../lml';

describe('LML - List-based Markup Language', () => {

    // positives
    // - easy to read/write for humans compared to JSON
    // - fast parsing on the client side
    // - framework agnostic, not bound to any server-side technology, cross platform (i.e. could be also used for mobile native apps)
    // - possibility to process html as content (e.g. remove/transform elements, pick a subset of a list)
    // - safe HTML (interpreted by the client and not blindly injected in the DOM)
    // - easy transformation on client (e.g. to VDOM nodes or to HTML)
    // - possibility to mix html content with structured data (e.g. JSON list containing JSON and LML values)
    // - possibility to reference components
    // - possibility to assign components to namespaces (and implement bundle lazy loading)
    // - possibility to pass data structures as component attributes
    // - possibility to support richer HTML syntax (e.g. decorators, tagged children blocks)
    // - slightly smaller than HTML in average

    // validation functions on authorized nodes (e.g. to create a DSL)
    // validation on authorized components?
    // attribute transformation - e.g. class => className

    function print(lml: LML, padding = ""): string[] {
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

        console.log("TEST", ls)
        for (const nd of ls) {

            printList(nd, out, padding);
        }
    }


    describe('Text Nodes', () => {
        it('should support simple text nodes', async () => {
            expect(print("Hello World")).toMatchObject([
                "Hello World"
            ]);
        });

        it('should support list of text nodes', async () => {
            expect(print(["Hello", " World"])).toMatchObject([
                "Hello",
                " World"
            ]); 1
        });
    });

    describe('Elements', () => {
        it('should support empty elements', async () => {
            expect(print(["#div"])).toMatchObject([
                "<div/>"
            ]);
        });

        it('should support empty elements with attributes', async () => {
            expect(print(["#div", { "title": "abc" }])).toMatchObject([
                '<div title="abc"/>',
            ]);
            expect(print(["#div", { "foo": "bar", "size": 123, "ok": true }])).toMatchObject([
                '<div foo="bar" size=123 ok=true/>',
            ]);
            expect(print(["#div", { "foo": "bar", "baz": { foo: "bar", blah: 123 } }])).toMatchObject([
                '<div foo="bar" baz={"foo":"bar","blah":123}/>',
            ]);
        });

        it('should support text content', async () => {
            expect(print(["#div", "Some Content"])).toMatchObject([
                '<div>',
                '  Some Content',
                '</div>'
            ]);

            expect(print(["#div", "Some", "Content"])).toMatchObject([
                '<div>',
                '  Some',
                '  Content',
                '</div>'
            ]);

            expect(print(["#div", { "title": "abc" }, "Some Content", ["#span", "Hello"]])).toMatchObject([
                '<div title="abc">',
                '  Some Content',
                '  <span>',
                '    Hello',
                '  </span>',
                '</div>'
            ]);
        });

        it('should support fragments', async () => {
            expect(print(["#div", { "title": "abc" }, [
                "Some Content",
                ["#span", "Hello"]
            ]])).toMatchObject([
                '<div title="abc">',
                '  Some Content',
                '  <span>',
                '    Hello',
                '  </span>',
                '</div>'
            ]);

            expect(print(["#div", { "title": "abc" }, [
                "Some Content",
                ["#span", ["Hello"]]
            ]])).toMatchObject([
                '<div title="abc">',
                '  Some Content',
                '  <span>',
                '    Hello',
                '  </span>',
                '</div>'
            ]);
        });

        it('should support no values attributes', async () => {
            expect(print(["#input", { "type": "checkbox", "!checked": 1, "title": "Check me!" }, [
                "Option A",
            ]])).toMatchObject([
                '<input type="checkbox" checked title="Check me!">',
                '  Option A',
                '</input>'
            ]);
        });

        it.only('should support class names shortcut', async () => {
            // expect(print(["#div.foo", { "maxlength": 123 }])).toMatchObject([
            //     '<div class="foo" maxlength=123/>',
            // ]);

            expect(print(["#div.p-3", { "maxlength": 123 }])).toMatchObject([
                '<div class="p-3" maxlength=123/>',
            ]);

            // expect(print(["#div.foo.bar", { "maxlength": 123 }])).toMatchObject([
            //     '<div class="foo bar" maxlength=123/>',
            // ]);

            // expect(print(["#div.mt-3.pb-2", { "maxlength": 123 }])).toMatchObject([
            //     '<div class="mt-3 pb-2" maxlength=123/>',
            // ]);

            // expect(print(["Hello", ["#span.highlight", "World"], "!"])).toMatchObject([
            //     'Hello',
            //     '<span class="highlight">',
            //     '  World',
            //     '</span>',
            //     '!'
            // ]);
        });

        it('should support type attribute shortcut', async () => {
            expect(print(["#input-checkbox.abc", { "id": "subscribeNews", "name": "subscribe", "value": "newsletter", "!checked": 1 }])).toMatchObject([
                '<input type="checkbox" class="abc" id="subscribeNews" name="subscribe" value="newsletter" checked/>'
            ]);
        });

        it('should support namespaces', async () => {
            expect(print(["#x:div.foo", { "maxlength": 123 }])).toMatchObject([
                '<x:div ns="x" class="foo" maxlength=123/>',
            ]);
        });

        it('shoul support component nodes', async () => {
            expect(print(["*x:mycpt.foo", { "maxlength": 123 }])).toMatchObject([
                '<x:mycpt() ns="x" class="foo" maxlength=123/>',
            ]);
        });
    });

    // TODO: encoding for text nodes starting with reserved prefixes ! or # or @ or *
    // error case: ["#x:div.foo", { "maxlength": 123 }]

});
