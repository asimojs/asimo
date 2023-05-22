import React from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, cleanup } from '@testing-library/preact';
import { LML, LmlSanitizationRules } from '../types';
import { defaultSanitizationRules, lml2jsx, processJSX } from '../lml';
import { h } from 'preact';

describe('LML Preact JSX', () => {
    let errors: string[] = [];
    let logs: string[];

    beforeEach(() => {
        errors = [];
        logs = mockGlobalConsole();
    });

    afterEach(() => {
        expect(errors).toMatchObject([]);
        resetGlobalConsole();
    })

    const console1 = globalThis.console;

    const sanitizationRules: LmlSanitizationRules = {
        allowedElements: new Set(["input", "my-widget", ...defaultSanitizationRules.allowedElements]),
        forbiddenElementAttributes: defaultSanitizationRules.forbiddenElementAttributes,
        forbidEventHandlers: true,
        allowedUrlPrefixes: defaultSanitizationRules.allowedUrlPrefixes,
        urlAttributes: defaultSanitizationRules.urlAttributes
    }

    function mockGlobalConsole() {
        const logs: string[] = [];
        globalThis.console = Object.create(console1, {
            error: {
                writable: true,
                configurable: true,
                value: (...args: any[]) => {
                    logs.push(args[0]);
                }
            }
        });
        return logs;
    }

    function resetGlobalConsole() {
        globalThis.console = console1;
    }

    function getJSX(v: LML) {
        return lml2jsx(v, h, (name, ns) => {
            if (name === "MyCpt" && ns === "") {
                return MyCpt;
            }
            if (name === "MyCpt" && ns === "b") {
                return MyCpt2;
            }
            if (name === "img" && ns === "c") {
                return Img;
            }
            return null;
        }, (msg) => {
            errors.push(msg);
        }, sanitizationRules);
    }

    function printJSX(jsxContent: JSX.Element | string | null | (JSX.Element | string)[]) {
        cleanup();
        let container = render(jsxContent);
        return container.baseElement.innerHTML;
    }

    function print(v: LML) {
        return printJSX((getJSX(v)));
    }

    // Text node
    const ex1: LML =
        // Hello World
        "Hello World";

    // Span, no attribues
    const ex2: LML =
        // <span class="hello"> Hello <em> World! </em></span>
        ["#span.hello", "Hello", ["#em", "World!"]]

    // Span with attributes
    const ex3: LML =
        // <span class="hello" "title"="Greetings!"> Hello <em> World! </em></span>
        ["#span.hello", { "title": "Greetings" }, "Hello", ["#em", "World!"]]

    // Fragment
    const ex4: LML =
        // <><em>Hello</em>World!</>
        [["#em", "Hello"], "World!"]

    // Component
    const ex5: LML =
        // <MyCpt className="abc" foo="bar"> Some <span class="em">content...</span> </MyCpt>
        ["*MyCpt.abc", { "title": "Data" }, " Some ", ["#span.em", "content... "]]

    // Node with type, id and empty attribute (here: checked - value will be ignored)
    const ex6: LML =
        // <input type="checkbox" class="abc" id="subscribeNews" name="subscribe" value="newsletter" disabled />
        ["#input+checkbox.abc", { "id": "subscribeNews", "name": "subscribe", "value": "newsletter", "disabled": true }]

    // Advanced component with bundle id + JSON and LML attributes
    const ex7: LML =
        ["*b:MyCpt", { // b = bundle id
            "logo": ["*c:img", { "height": 22, "width": 22, "src": "..." }],
            "columnWidths": [1, 2, 3, 4]
        },
            ["#span.hello", "Some ", ["#em", "content..."]]
        ]

    const MyCpt = (props: { title: string, className?: string, children?: any }) => {
        const { title, className, children } = props;

        return <div className={'mycpt ' + (className || "")}>
            <div className='title'>{title}{null}</div>
            <div className='content'>{children}</div>
        </div>
    }

    const MyCpt2 = (props: { columnWidths: number[], logo: any, children?: any }) => {
        const { columnWidths, logo, children } = props;
        let count = 0;
        for (let nbr of columnWidths) {
            count += nbr;
        }
        const jsxLogo = getJSX(logo);
        return <div className="mycpt2" data-count={count}>{jsxLogo} / {children}</div>
    }

    const Img = (props: { height: number, width: number, src: string }) => {
        const { height, width, src } = props;
        return <img height={height + "px"} width={width + "px"} src={src} />
    }

    it('should support text nodes', async () => {
        expect(printJSX("Hello")).toBe("<div>Hello</div>");
        expect(printJSX(<span>ABC</span>)).toBe("<div><span>ABC</span></div>");
        expect(printJSX(h("div", { style: "color:red;font-weight:bold" }, "Hello"))).toBe('<div><div style="color: red; font-weight: bold;">Hello</div></div>')

        expect(print("")).toBe("<div></div>");
        expect(print(undefined as any)).toBe("<div></div>");
        expect(print(ex1)).toBe("<div>Hello World</div>");
        expect(print(["Hello ", "World"])).toBe("<div>Hello World</div>");
        expect(print(["Hello ", "", "World"])).toBe("<div>Hello World</div>");
        expect(print(["", "Hello"])).toBe("<div>Hello</div>");
        expect(print(["#", "Hello"])).toBe("<div>#Hello</div>");
    });

    it('should support simple elements', async () => {
        expect(print(["#span", "Hi"])).toBe("<div><span>Hi</span></div>");
        expect(print(["#span", "Hello", ["#em", "World!"]])).toBe('<div><span>Hello<em>World!</em></span></div>');
        expect(print(["#span", "Hello", ["#b", "World", ["#i", "!"]], ["#br"]])).toBe('<div><span>Hello<b>World<i>!</i></b><br></span></div>');
    });

    it('should support element with attributes', async () => {
        expect(print(["#span", { "title": "abc" }, "Hi"])).toBe('<div><span title="abc">Hi</span></div>');
        expect(print(["#span.foo", { "title": "abc" }, "Hi"])).toBe('<div><span title="abc" class="foo">Hi</span></div>');
        expect(print(["#span.foo.bar", { "title": "abc" }, "Hi"])).toBe('<div><span title="abc" class="foo bar">Hi</span></div>');
        expect(print(["#span.foo.bar", "Hi"])).toBe('<div><span class="foo bar">Hi</span></div>');
        expect(print(["#my-widget.foo.bar", "Hi"])).toBe('<div><my-widget class="foo bar">Hi</my-widget></div>');
        expect(print(["#span.foo", { "class": "abc" }, "Hi"])).toBe('<div><span class="foo abc">Hi</span></div>');
        expect(print(["#span.foo.bar", { "class": "abc" }, "Hi"])).toBe('<div><span class="foo bar abc">Hi</span></div>');
        expect(print(["#span", { "misc": true, "baz": 123 }, "Hi"])).toBe('<div><span misc="true" baz="123">Hi</span></div>');
        expect(print(["#span", { "misc": { a: "abc" } }, "Hi"])).toBe('<div><span misc="[object Object]">Hi</span></div>');
        expect(print(["#input+text"])).toBe('<div><input type="text"></div>');
        expect(print(["#input+text.abc"])).toBe('<div><input type="text" class="abc"></div>');
        expect(print(["#input+text", { "placeholder": "xxx" }])).toBe('<div><input placeholder="xxx" type="text"></div>');
        expect(print(["#span.foo.p-12", "Hi"])).toBe('<div><span class="foo p-12">Hi</span></div>');

        expect(print(ex2)).toBe('<div><span class="hello">Hello<em>World!</em></span></div>');
        expect(print(ex3)).toBe('<div><span title="Greetings" class="hello">Hello<em>World!</em></span></div>');
        expect(print(ex6)).toBe('<div><input id="subscribeNews" name="subscribe" disabled="" type="checkbox" class="abc" value="newsletter"></div>');
    });

    it('should support element with key attribute', async () => {
        // the key attribute is interpreted by JSX and won't show through the print function
        expect(print(["#span", { "title": "abc", "key": "123" }, "Hi"])).toBe('<div><span title="abc" keyvalue="123">Hi</span></div>');
        expect(getJSX(["#span", { "title": "abc", "key": "123" }, "Hi"])).toMatchObject({
            type: 'span',
            props: { title: 'abc', children: 'Hi', keyValue: '123' },
            key: '123',
        });
        expect(getJSX(["#span!123", { "title": "abc" }, "Hi"])).toMatchObject({
            type: 'span',
            props: { title: 'abc', children: 'Hi', keyValue: '123' },
            key: '123',
        });
        expect(getJSX(["#span!123", "Hi"])).toMatchObject({
            type: 'span',
            props: { children: 'Hi', keyValue: '123' },
            key: '123',
        });
        expect(getJSX(["#input+text.name.pt-4!123!#@$rweT$🕺#%", "Hi"])).toMatchObject({
            type: 'input',
            props: { "class": "name pt-4", className: "name pt-4", type: "text", children: 'Hi', keyValue: '123!#@$rweT$🕺#%' },
            key: '123!#@$rweT$🕺#%',
        });
    });

    it('should support fragments', async () => {
        expect(print(ex4)).toBe('<div><em>Hello</em>World!</div>');
        expect(print(["a", [[[["b", "c"]], ["#span"], [[[]]]]]])).toBe('<div>abc<span></span></div>');
    });

    it('should support components', async () => {
        expect(print(ex5)).toBe('<div><div class="mycpt abc"><div class="title">Data</div><div class="content"> Some <span class="em">content... </span></div></div></div>');
    });

    it('should automatically transform properties that are valid LML values', async () => {
        expect(print(ex7)).toBe('<div><div class="mycpt2" data-count="10"><img height="22px" width="22px" src="..."> / <span class="hello">Some <em>content...</em></span></div></div>');
    });

    describe('Errors', () => {
        it('should be raised in case of invalid syntax', async () => {
            getJSX({ foo: "bar" } as any);
            expect(errors).toMatchObject([
                'Invalid LML node: {"foo":"bar"}'
            ]);
            errors = [];
        });

        it('should be raised in case of reserved node types', async () => {
            getJSX(["#span", ["@somedecorator", { "foo": "bar" }], ["!somedecorator", { "foo": "bar" }]]);
            expect(errors).toMatchObject([
                'Invalid LML node: ["@somedecorator",{"foo":"bar"}]',
                'Invalid LML node: ["!somedecorator",{"foo":"bar"}]',
            ]);
            errors = [];
        });

        it('should be raised in case of invalid node', async () => {
            getJSX({ "foo": "bar" } as any);
            expect(errors).toMatchObject([
                'Invalid LML node: {"foo":"bar"}'
            ]);
            errors = [];

            getJSX([{ "foo": "bar" }] as any);
            expect(errors).toMatchObject([
                'Invalid LML node: {"foo":"bar"}'
            ]);
            errors = [];
        });

        it('should cut message if too long', async () => {
            getJSX(["#span", "x", { "foo": "bar", "baz": 124321424234, "blah": "hello world hello world hello world hellow world" } as any]);
            expect(errors).toMatchObject([
                'Invalid LML node: {"foo":"bar","baz":124321424234,"blah":"hello world hello world hello world hellow...'
            ]);
            errors = [];
        });

        it('should be raised in case of invalid component', async () => {
            getJSX(["#span", ["*Foo", "bar"]]);
            expect(errors).toMatchObject([
                "Invalid component: Foo"
            ]);
            errors = [];
        });

        it('should be logged on console when no error handler is provided to lm2JSX', async () => {
            lml2jsx(["*x:foo"], h);
            expect(logs).toMatchObject([
                "[lm2JSX Error] Invalid component: x:foo"
            ]);
            errors = [];
        });

        it('should be logged on console when no error handler is provided to processJSX', async () => {
            processJSX(["!x:foo"], { format: () => "x" });
            expect(logs).toMatchObject([
                '[LML Scan Error] Invalid LML node: ["!x:foo"]'
            ]);
            errors = [];
        });
    });


});
