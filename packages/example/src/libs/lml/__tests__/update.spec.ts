import { beforeEach, describe, expect, it } from 'vitest'
import { LML } from '../types';
import { scan, updateLML } from '../lml';
import { print } from './utils';

describe('LML update', () => {
    let ex1: LML, ex2: LML, ex3: LML, ex4: LML;

    beforeEach(() => {
        ex1 = ["#div", "Hello", ["#span.firstName!FN", "Bart"], ["#span.lastName!LN", "Simpson"]];
        ex2 = ["#div!ROOT", "Hello World"];
        ex3 = ["*mycpt!CPT", { "foo": "bar", "title": ["#span!NAME", "Bart Simpson"] }];
        ex4 = ["*mycpt!CPT", { "footer": { "sections": ["First", ["#span", "Second"]] } }, "Hello"];
    });

    describe('scan', () => {
        let keys: string[] = [];

        function p(nodeKey: string, node: LML): boolean {
            keys.push(nodeKey);
            return true;
        }

        it('should find all keyed nodes', async () => {
            scan("abc", p);
            expect(keys.length).toBe(0);
            scan(123, p);
            expect(keys.length).toBe(0);
            scan(true, p);
            expect(keys.length).toBe(0);
            scan({ foo: "bar", bar: 123, baz: { x: 123 } }, p);
            expect(keys.length).toBe(0);
            scan(["*MyCpt.abc", { "title": "Data" }, " Some ", ["#span.em", "content... "]], p);
            expect(keys.length).toBe(0);

            scan(["*MyCpt.abc", { "title": "Data" }, " Some ", ["#span.em!AA", "content... ", ["#span!BB", "... "]]], p);
            expect(keys).toMatchObject([
                "AA",
                "BB",
            ]);
            keys = [];
            scan([], p);
            expect(keys.length).toBe(0);
            scan(["a", 123, ["#span.em", "content... "], ["*MyCpt.abc", { "title": ["#span.em!AA", "content... "] }, ["#span!BB", "... "]]], p);
            expect(keys).toMatchObject([
                "AA",
                "BB",
            ]);
        });
    });

    describe('create/replace with node ref', () => {

        describe('node content', () => {
            it('should support insertBefore - node in array', async () => {
                const r = updateLML(ex1, [{
                    action: "insertBefore",
                    node: "FN",
                    content: ["#span.title!TITLE", "Mr"]
                }]);
                expect(print(r)).toMatchObject([
                    "<div>",
                    "  Hello",
                    '  <span class="title">',
                    '    Mr',
                    '  </span>',
                    '  <span class="firstName">',
                    '    Bart',
                    '  </span>',
                    '  <span class="lastName">',
                    "    Simpson",
                    "  </span>",
                    "</div>",
                ]);
            });

            it('should support insertAfter - node in array', async () => {
                const r = updateLML(ex1, [{
                    action: "insertAfter",
                    node: "FN",
                    content: " / "
                }]);
                expect(print(r)).toMatchObject([
                    "<div>",
                    "  Hello",
                    '  <span class="firstName">',
                    '    Bart',
                    '  </span>',
                    '   / ',
                    '  <span class="lastName">',
                    "    Simpson",
                    "  </span>",
                    "</div>",
                ]);
            });

            it('should support replace - node in array', async () => {
                const r = updateLML(ex1, [{
                    action: "replace",
                    node: "FN",
                    content: "Lisa"
                }]);
                expect(r === ex1);
                expect(print(r)).toMatchObject([
                    "<div>",
                    "  Hello",
                    '  Lisa',
                    '  <span class="lastName">',
                    "    Simpson",
                    "  </span>",
                    "</div>",
                ]);
            });

            it('should support insertBefore - root', async () => {
                const r = updateLML(ex2, [{
                    action: "insertBefore",
                    node: "ROOT",
                    content: ["#span", "AAA"]
                }]);
                expect(print(r)).toMatchObject([
                    "<span>",
                    "  AAA",
                    "</span>",
                    "<div>",
                    "  Hello World",
                    "</div>",
                ]);
            });

            it('should support insertAfter - root', async () => {
                const r = updateLML(ex2, [{
                    action: "insertAfter",
                    node: "ROOT",
                    content: ["#span", "ZZZ"]
                }]);
                expect(print(r)).toMatchObject([
                    "<div>",
                    "  Hello World",
                    "</div>",
                    "<span>",
                    "  ZZZ",
                    "</span>",
                ]);
            });

            it('should support replace - root', async () => {
                const r = updateLML(ex2, [{
                    action: "replace",
                    node: "ROOT",
                    content: ["#span", "HELLO"]
                }]);
                expect(print(r)).toMatchObject([
                    "<span>",
                    "  HELLO",
                    "</span>",
                ]);
            });

            it('should support insertBefore - node as root argument', async () => {
                const r = updateLML(ex3, [{
                    action: "insertBefore",
                    node: "NAME",
                    content: ["#span.title!TITLE", "Mr"]
                }]);
                expect(print(r)).toMatchObject([
                    '<mycpt() foo="bar" title=[["#span.title!TITLE","Mr"],["#span!NAME","Bart Simpson"]]/>'
                ]);
            });

            it('should support insertAfter - node as root argument', async () => {
                const r = updateLML(ex3, [{
                    action: "insertAfter",
                    node: "NAME",
                    content: "!!!"
                }]);
                expect(print(r)).toMatchObject([
                    '<mycpt() foo="bar" title=[["#span!NAME","Bart Simpson"],"!!!"]/>'
                ]);
            });

            it('should support replace - node as root argument', async () => {
                const r = updateLML(ex3, [{
                    action: "replace",
                    node: "NAME",
                    content: "Marge"
                }]);
                expect(print(r)).toMatchObject([
                    '<mycpt() foo="bar" title="Marge"/>'
                ]);
            });

            it('should support insertBefore - node as root argument w/ path', async () => {
                const r = updateLML(ex3, [{
                    action: "insertBefore",
                    node: "CPT",
                    path: "title",
                    content: ["#span.title!TITLE", "Mr"]
                }]);
                expect(print(r)).toMatchObject([
                    '<mycpt() foo="bar" title=[["#span.title!TITLE","Mr"],["#span!NAME","Bart Simpson"]]/>'
                ]);
            });

            it('should support insertAfter - node as root argument w/ path', async () => {
                const r = updateLML(ex3, [{
                    action: "insertAfter",
                    node: "CPT",
                    path: "title",
                    content: "!!!"
                }]);
                expect(print(r)).toMatchObject([
                    '<mycpt() foo="bar" title=[["#span!NAME","Bart Simpson"],"!!!"]/>'
                ]);
            });

            it('should support replace - node as root argument w/ path', async () => {
                const r = updateLML(ex3, [{
                    action: "replace",
                    node: "CPT",
                    path: "title",
                    content: "Marge"
                }]);
                expect(print(r)).toMatchObject([
                    '<mycpt() foo="bar" title="Marge"/>'
                ]);
            });
        });

        describe('fragment content', () => {
            it('should support insertBefore - node in array', async () => {
                const r = updateLML(ex1, [{
                    action: "insertBefore",
                    node: "FN",
                    content: ["AAA", ["#span.title!TITLE", "Mr"]]
                }]);
                expect(print(r)).toMatchObject([
                    "<div>",
                    "  Hello",
                    "  AAA",
                    '  <span class="title">',
                    '    Mr',
                    '  </span>',
                    '  <span class="firstName">',
                    '    Bart',
                    '  </span>',
                    '  <span class="lastName">',
                    "    Simpson",
                    "  </span>",
                    "</div>",
                ]);
            });

            it('should support insertAfter - node in array', async () => {
                const r = updateLML(ex1, [{
                    action: "insertAfter",
                    node: "FN",
                    content: ["XXX", "YYY", "ZZZ"]
                }]);
                expect(print(r)).toMatchObject([
                    "<div>",
                    "  Hello",
                    '  <span class="firstName">',
                    '    Bart',
                    '  </span>',
                    '  XXX',
                    '  YYY',
                    '  ZZZ',
                    '  <span class="lastName">',
                    "    Simpson",
                    "  </span>",
                    "</div>",
                ]);
            });

            it('should support replace - node in array', async () => {
                const r = updateLML(ex1, [{
                    action: "replace",
                    node: "FN",
                    content: ["Lisa,", "Bart"]
                }]);
                expect(r === ex1);
                expect(print(r)).toMatchObject([
                    "<div>",
                    "  Hello",
                    '  Lisa,',
                    '  Bart',
                    '  <span class="lastName">',
                    "    Simpson",
                    "  </span>",
                    "</div>",
                ]);
            });

            it('should support insertBefore - root', async () => {
                const r = updateLML(ex2, [{
                    action: "insertBefore",
                    node: "ROOT",
                    content: ["000", ["#span", "AAA"]]
                }]);
                expect(print(r)).toMatchObject([
                    "000",
                    "<span>",
                    "  AAA",
                    "</span>",
                    "<div>",
                    "  Hello World",
                    "</div>",
                ]);
            });

            it('should support insertAfter - root', async () => {
                const r = updateLML(ex2, [{
                    action: "insertAfter",
                    node: "ROOT",
                    content: ["AAA", ["#span", "ZZZ"]]
                }]);
                expect(print(r)).toMatchObject([
                    "<div>",
                    "  Hello World",
                    "</div>",
                    "AAA",
                    "<span>",
                    "  ZZZ",
                    "</span>",
                ]);
            });

            it('should support replace - root', async () => {
                const r = updateLML(ex2, [{
                    action: "replace",
                    node: "ROOT",
                    content: ["AAA", ["#span", "HELLO"]]
                }]);
                expect(print(r)).toMatchObject([
                    "AAA",
                    "<span>",
                    "  HELLO",
                    "</span>",
                ]);
            });

            it('should support insertBefore - node as root argument', async () => {
                const r = updateLML(ex3, [{
                    action: "insertBefore",
                    node: "NAME",
                    content: ["AAA", ["#span.title!TITLE", "Mr"]]
                }]);
                expect(print(r)).toMatchObject([
                    '<mycpt() foo="bar" title=["AAA",["#span.title!TITLE","Mr"],["#span!NAME","Bart Simpson"]]/>'
                ]);
            });

            it('should support insertAfter - node as root argument', async () => {
                const r = updateLML(ex3, [{
                    action: "insertAfter",
                    node: "NAME",
                    content: ["AAA", "BBB"]
                }]);
                expect(print(r)).toMatchObject([
                    '<mycpt() foo="bar" title=[["#span!NAME","Bart Simpson"],"AAA","BBB"]/>'
                ]);
            });

            it('should support replace - node as root argument', async () => {
                const r = updateLML(ex3, [{
                    action: "replace",
                    node: "NAME",
                    content: ["Marge", "Simpson"]
                }]);
                expect(print(r)).toMatchObject([
                    '<mycpt() foo="bar" title=["Marge","Simpson"]/>'
                ]);
            });

            it('should support insertBefore - node as root argument w/ path', async () => {
                const r = updateLML(ex3, [{
                    action: "insertBefore",
                    node: "CPT",
                    path: "title",
                    content: ["AAA", ["#span.title!TITLE", "Mr"]]
                }]);
                expect(print(r)).toMatchObject([
                    '<mycpt() foo="bar" title=["AAA",["#span.title!TITLE","Mr"],["#span!NAME","Bart Simpson"]]/>'
                ]);
            });

            it('should support insertAfter - node as root argument w/ path', async () => {
                const r = updateLML(ex3, [{
                    action: "insertAfter",
                    node: "CPT",
                    path: "title",
                    content: ["AAA", "BBB"]
                }]);
                expect(print(r)).toMatchObject([
                    '<mycpt() foo="bar" title=[["#span!NAME","Bart Simpson"],"AAA","BBB"]/>'
                ]);
            });

            it('should support replace - node as root argument w/ path', async () => {
                const r = updateLML(ex3, [{
                    action: "replace",
                    node: "CPT",
                    path: "title",
                    content: ["Marge", "Simpson"]
                }]);
                expect(print(r)).toMatchObject([
                    '<mycpt() foo="bar" title=["Marge","Simpson"]/>'
                ]);
            });
        });
    });

    describe('update with node list', () => {
        describe('node content', () => {
            it('should append content', async () => {
                const r = updateLML(ex4, [{
                    action: "append",
                    node: "CPT",
                    path: "footer/sections",
                    content: "NEW-NODE"
                }]);
                expect(print(r)).toMatchObject([
                    '<mycpt() footer={"sections":["First",["#span","Second"],"NEW-NODE"]}>',
                    "  Hello",
                    "</mycpt>",
                ]);
            });

            it('should prepend content', async () => {
                const r = updateLML(ex4, [{
                    action: "prepend",
                    node: "CPT",
                    path: "footer/sections",
                    content: "NEW-NODE"
                }]);
                expect(print(r)).toMatchObject([
                    '<mycpt() footer={"sections":["NEW-NODE","First",["#span","Second"]]}>',
                    "  Hello",
                    "</mycpt>",
                ]);
            });

            it('should prepend replace', async () => {
                const r = updateLML(ex4, [{
                    action: "replace",
                    node: "CPT",
                    path: "footer/sections",
                    content: "NEW-NODE"
                }]);
                expect(print(r)).toMatchObject([
                    '<mycpt() footer={"sections":"NEW-NODE"}>',
                    "  Hello",
                    "</mycpt>",
                ]);
            });
        });

        describe('fragment content', () => {
            it('should append content', async () => {
                const r = updateLML(ex4, [{
                    action: "append",
                    node: "CPT",
                    path: "footer/sections",
                    content: ["AAA", "BBB"]
                }]);
                expect(print(r)).toMatchObject([
                    '<mycpt() footer={"sections":["First",["#span","Second"],"AAA","BBB"]}>',
                    "  Hello",
                    "</mycpt>",
                ]);
            });

            it('should prepend content', async () => {
                const r = updateLML(ex4, [{
                    action: "prepend",
                    node: "CPT",
                    path: "footer/sections",
                    content: ["AAA", "BBB"]
                }]);
                expect(print(r)).toMatchObject([
                    '<mycpt() footer={"sections":["AAA","BBB","First",["#span","Second"]]}>',
                    "  Hello",
                    "</mycpt>",
                ]);
            });

            it('should prepend replace', async () => {
                const r = updateLML(ex4, [{
                    action: "replace",
                    node: "CPT",
                    path: "footer/sections",
                    content: ["AAA", "BBB"]
                }]);
                expect(print(r)).toMatchObject([
                    '<mycpt() footer={"sections":["AAA","BBB"]}>',
                    "  Hello",
                    "</mycpt>",
                ]);
            });
        });
    });

    describe('delete', () => {
        it('should support delete - node in array', async () => {
            const r = updateLML(ex1, [{
                action: "delete",
                node: "FN"
            }]);
            expect(r === ex1);
            expect(print(r)).toMatchObject([
                "<div>",
                "  Hello",
                "  <span class=\"lastName\">",
                "    Simpson",
                "  </span>",
                "</div>",
            ]);
        });

        it('should append content', async () => {
            const r = updateLML(ex4, [{
                action: "delete",
                node: "CPT",
                path: "footer/sections"
            }]);
            expect(print(r)).toMatchObject([
                '<mycpt() footer={"sections":[]}>',
                "  Hello",
                "</mycpt>",
            ]);
        });
    });

    describe('children path', () => {
        describe('node content', () => {
            it('should support insertBefore', async () => {
                const r = updateLML(ex4, [{
                    action: "insertBefore",
                    node: "CPT",
                    path: "children",
                    content: ["#span", "NEW-NODE"]
                }]);
                expect(print(r)).toMatchObject([
                    '<mycpt() footer={"sections":["First",["#span","Second"]]}>',
                    "  <span>",
                    "    NEW-NODE",
                    "  </span>",
                    "  Hello",
                    "</mycpt>",
                ]);
            });

            it('should support prepend', async () => {
                const r = updateLML(ex4, [{
                    action: "prepend",
                    node: "CPT",
                    path: "children",
                    content: "NEW-NODE"
                }]);
                expect(print(r)).toMatchObject([
                    '<mycpt() footer={"sections":["First",["#span","Second"]]}>',
                    "  NEW-NODE",
                    "  Hello",
                    "</mycpt>",
                ]);
            });

            it('should support insertAfter', async () => {
                const r = updateLML(ex4, [{
                    action: "insertAfter",
                    node: "CPT",
                    path: "children",
                    content: ["#span", "NEW-NODE"]
                }]);
                expect(print(r)).toMatchObject([
                    '<mycpt() footer={"sections":["First",["#span","Second"]]}>',
                    "  Hello",
                    "  <span>",
                    "    NEW-NODE",
                    "  </span>",
                    "</mycpt>",
                ]);
            });

            it('should support append', async () => {
                const r = updateLML(ex4, [{
                    action: "append",
                    node: "CPT",
                    path: "children",
                    content: "NEW-NODE"
                }]);
                expect(print(r)).toMatchObject([
                    '<mycpt() footer={"sections":["First",["#span","Second"]]}>',
                    "  Hello",
                    "  NEW-NODE",
                    "</mycpt>",
                ]);
            });

            it('should support replace', async () => {
                const r = updateLML(ex4, [{
                    action: "replace",
                    node: "CPT",
                    path: "children",
                    content: ["#span", "NEW-NODE"]
                }]);
                expect(print(r)).toMatchObject([
                    '<mycpt() footer={"sections":["First",["#span","Second"]]}>',
                    "  <span>",
                    "    NEW-NODE",
                    "  </span>",
                    "</mycpt>",
                ]);
            });

            it('should support delete', async () => {
                const r = updateLML(ex4, [{
                    action: "delete",
                    node: "CPT",
                    path: "children"
                }]);
                expect(print(r)).toMatchObject([
                    '<mycpt() footer={"sections":["First",["#span","Second"]]}/>',
                ]);
            });
        });

        describe('fragment content', () => {
            it('should support insertBefore', async () => {
                const r = updateLML(ex4, [{
                    action: "insertBefore",
                    node: "CPT",
                    path: "children",
                    content: ["XYZ", ["#span", "NEW-NODE"]]
                }]);
                expect(print(r)).toMatchObject([
                    '<mycpt() footer={"sections":["First",["#span","Second"]]}>',
                    "  XYZ",
                    "  <span>",
                    "    NEW-NODE",
                    "  </span>",
                    "  Hello",
                    "</mycpt>",
                ]);
            });

            it('should support prepend', async () => {
                const r = updateLML(ex4, [{
                    action: "prepend",
                    node: "CPT",
                    path: "children",
                    content: ["AA", "BB"]
                }]);
                expect(print(r)).toMatchObject([
                    '<mycpt() footer={"sections":["First",["#span","Second"]]}>',
                    "  AA",
                    "  BB",
                    "  Hello",
                    "</mycpt>",
                ]);
            });

            it('should support insertAfter', async () => {
                const r = updateLML(ex4, [{
                    action: "insertAfter",
                    node: "CPT",
                    path: "children",
                    content: [["#span", "NEW-NODE"], "BB"]
                }]);
                expect(print(r)).toMatchObject([
                    '<mycpt() footer={"sections":["First",["#span","Second"]]}>',
                    "  Hello",
                    "  <span>",
                    "    NEW-NODE",
                    "  </span>",
                    "  BB",
                    "</mycpt>",
                ]);
            });

            it('should support append', async () => {
                const r = updateLML(ex4, [{
                    action: "append",
                    node: "CPT",
                    path: "children",
                    content: ["AA", "BB"]
                }]);
                expect(print(r)).toMatchObject([
                    '<mycpt() footer={"sections":["First",["#span","Second"]]}>',
                    "  Hello",
                    "  AA",
                    "  BB",
                    "</mycpt>",
                ]);
            });

            it('should support replace', async () => {
                const r = updateLML(ex4, [{
                    action: "replace",
                    node: "CPT",
                    path: "children",
                    content: ["AA", ["#span", "NEW-NODE"], "CC"]
                }]);
                expect(print(r)).toMatchObject([
                    '<mycpt() footer={"sections":["First",["#span","Second"]]}>',
                    "  AA",
                    "  <span>",
                    "    NEW-NODE",
                    "  </span>",
                    "  CC",
                    "</mycpt>",
                ]);
            });
        });
    });

});
