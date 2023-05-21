import { describe, expect, it } from 'vitest'
import { print } from './utils';
import { nodeType } from '../lml';

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

    describe('Node types', () => {
        it('should be text', async () => {
            expect(nodeType("Hello")).toBe("text");
        });

        it('should be element', async () => {
            expect(nodeType(["#span", "Hello"])).toBe("element");
        });

        it('should be component', async () => {
            expect(nodeType(["*cpt", "Hello"])).toBe("component");
        });

        it('should be fragment', async () => {
            expect(nodeType([])).toBe("fragment");
            expect(nodeType(["a"])).toBe("fragment");
            expect(nodeType(["", ["#span", "b"]])).toBe("fragment");
            expect(nodeType([["#span", "b"]])).toBe("fragment");
            expect(nodeType(["a", "b"])).toBe("fragment");
        });

        it('should be invalid', async () => {
            expect(nodeType(["!x", "Hello"])).toBe("invalid");
            expect(nodeType(["@x", "Hello"])).toBe("invalid");
            expect(nodeType(123 as any)).toBe("invalid");
            expect(nodeType({} as any)).toBe("invalid");
        });
    });

    describe('Elements', () => {
        it('should support empty elements', async () => {
            expect(print(["#div"])).toMatchObject([
                "<div/>"
            ]);
        });

        it('should support empty elements', async () => {
            expect(print(["#foo-bar"])).toMatchObject([
                "<foo-bar/>"
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

        it('should support class names shortcut', async () => {
            expect(print(["#div.foo", { "maxlength": 123 }])).toMatchObject([
                '<div class="foo" maxlength=123/>',
            ]);

            expect(print(["#div.p-3", { "maxlength": 123 }])).toMatchObject([
                '<div class="p-3" maxlength=123/>',
            ]);

            expect(print(["#div.foo.bar", { "maxlength": 123 }])).toMatchObject([
                '<div class="foo bar" maxlength=123/>',
            ]);

            expect(print(["#div.mt-3.pb-2", { "maxlength": 123 }])).toMatchObject([
                '<div class="mt-3 pb-2" maxlength=123/>',
            ]);

            expect(print(["Hello", ["#span.highlight", "World"], "!"])).toMatchObject([
                'Hello',
                '<span class="highlight">',
                '  World',
                '</span>',
                '!'
            ]);
        });

        it('should support type attribute shortcut', async () => {
            expect(print(["#input+checkbox.abc", { "id": "subscribeNews", "name": "subscribe", "value": "newsletter", "!checked": 1 }])).toMatchObject([
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
