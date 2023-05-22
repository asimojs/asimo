import React from 'react';
import { beforeEach, describe, expect, it } from 'vitest'
import { render, cleanup } from '@testing-library/preact';
import { lml2jsx } from '../lml';
import { LML } from '../types';
import { h } from 'preact';

describe('LML - Sanitization', () => {
    let errors: string[] = [];

    beforeEach(() => {
        errors = [];
    });

    const MyCpt = (props: { title: string, className?: string, children?: any }) => {
        const { title, className, children } = props;

        return <div className={'mycpt ' + (className || "")}>
            <div className='title'>{title}{null}</div>
            <div className='content'>{children}</div>
        </div>
    }

    function getJSX(v: LML) {
        return lml2jsx(v, h, () => MyCpt, (msg) => {
            errors.push(msg);
        });
    }

    function printJSX(jsxContent: JSX.Element | string | null | (JSX.Element | string)[]) {
        cleanup();
        let container = render(jsxContent);
        return container.baseElement.innerHTML;
    }

    function print(v: LML) {
        return printJSX((getJSX(v)));
    }

    it('should not raise errors for valid elements', async () => {
        getJSX("abcd");
        expect(errors).toMatchObject([]);
        getJSX(["abcd"]);
        expect(errors).toMatchObject([]);
        getJSX(["#span", "abcd"]);
        expect(errors).toMatchObject([]);
    });

    it('should raise error for unauthorized elements', async () => {
        expect(print(["#script", "alert(1)"])).toBe('<div></div>');
        expect(errors).toMatchObject([
            "Unauthorized element: script"
        ]);
        errors = [];
        getJSX(["*script", "alert(1)"]);
        expect(errors).toMatchObject([]); // ok for a component
    });

    it('should raise an error for unauthorized attributes', async () => {
        getJSX(["#span", { "class": "ok" }, "abcd"]);
        expect(errors).toMatchObject([]); // ok

        expect(print(["#span", { "class": "ok", "style": { "color": "red" } }, "abcd"])).toBe('<div><span class="ok">abcd</span></div>');
        expect(errors).toMatchObject([
            "Unauthorized element attribute: style"
        ]);
    });

    it('should raise an error for unauthorized event handler', async () => {
        expect(print(["#span", { "class": "ok", "onclick": "alert(1)" }, "abcd"])).toBe('<div><span class="ok">abcd</span></div>');
        expect(errors).toMatchObject([
            "Unauthorized event handler: onclick"
        ]);
    });

    it('should check url attributes', async () => {
        expect(print(["#img", { "src": "http://foo.com/myimage.png" }, "abcd"])).toBe('<div><img src="http://foo.com/myimage.png"></div>');
        expect(errors).toMatchObject([]); // ok

        expect(print(["#img", { "src": "javascript:alert(1)" }, "abcd"])).toBe('<div><img></div>');
        expect(errors).toMatchObject([
            'Unauthorized URL: src="javascript:alert(1)"'
        ]);

        errors=[];
        expect(print(["#img", { "src": "data:text/html:..." }, "abcd"])).toBe('<div><img></div>');
        expect(errors).toMatchObject([
            'Unauthorized URL: src="data:text/html:..."'
        ]);
    });

});
