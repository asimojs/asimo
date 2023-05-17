export type LML = LmlTextNode | LmlNode | LmlFragment;

type LmlTextNode = string;
type LmlFragment = LML[];
type LmlNode = (LmlNodeName | LmlAttributeMap | LML)[]; // string = no
type LmlNodeName = string;
export type LmlAttributeMap = LmlObject;

export interface LmlObject {
    [key: string]: LmlValue | LmlValue[];
}

export type LmlValue = string | number | boolean | LmlObject | LML;

export type LmlNodeInfo =
    | LmlNodeInfoString
    | LmlNodeInfoElement
    | LmlNodeInfoComponent
    | LmlNodeInfoDecorator
    | LmlNodeInfoOther;

export interface LmlNodeInfoString {
    // e.g. "Hello World"
    type: "string";
    value: string;
}

export interface LmlNodeInfoElement {
    // e.g. ["#span.hello", "Hello World"]
    type: "element";
    tagName: string;
    ns: string;
}

export interface LmlNodeInfoComponent {
    // e.g. ["#span.hello", "Hello World"]
    type: "component";
    tagName: string;
    ns: string;
}

export interface LmlNodeInfoDecorator {
    // e.g. ["@tooltip", "Hello World"]
    type: "decorator";
    tagName: string;
    ns: string;
}

export interface LmlNodeInfoOther {
    // e.g. ["@foo", "Hello World"] - reserved for future extensions like decorators
    type: "other";
}

/** JSX-compatible output produced by lml2jsx */
export type LmlJSX = JSX.Element | string | (JSX.Element | string)[];

export interface LmlFormatter {
    format(ndi: LmlNodeInfo, attributes?: LmlAttributeMap, children?: (JSX.Element | string)[]): LmlJSX;
    error?(m: string): void;
}
