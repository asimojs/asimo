export type LML = LmlTextNode | LmlNode | LmlFragment;

export type LmlTextNode = string;
export type LmlFragment = LML[];
export type LmlNodeList = LML[]; // same as LmlFragment
export type LmlNode = (LmlNodeName | LmlAttributeMap | LML)[]; // string = no
export type LmlNodeName = string;
export type LmlAttributeMap = LmlObject;

export type LmlNodeType = "text" | "element" | "component" | "fragment" | "invalid";

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
    type: "text";
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
export type JsxContent = JSX.Element | string | (JSX.Element | string)[];

export interface LmlFormatter {
    format(ndi: LmlNodeInfo, attributes?: LmlAttributeMap, children?: (JSX.Element | string)[]): JsxContent;
    error?(m: string): void;
}

export type LmlUpdate = LmlNodeUpdate | LmlNodeListUpdate | LmlNodeDelete;

/** Key attribute of a node - e.g. XXX in ["#span.msg!XXX", "Hello"] */
export type LmlNodeKey = string;

/** Path from a node to a child node through an attribute path - e.g. "children" or "footer/sections" */
export type LmlNodePath = string;
export interface LmlNodeUpdate {
    action: "insertBefore" | "insertAfter" | "replace";
    node: LmlNodeKey;
    path?: LmlNodePath;
    content: LML;
}
export interface LmlNodeListUpdate {
    action: "append" | "prepend" | "replace";
    node: LmlNodeKey;
    path: LmlNodePath;
    content: LML;
}

export interface LmlNodeDelete {
    action: "delete";
    node: LmlNodeKey;
    path?: LmlNodePath;
}

export interface LmlSanitizationRules {
    /** Allowed element names */
    allowedElements: Set<string>;

    /** Forbidden eleement attributes - e.g. forbid style, srcset */
    forbiddenElementAttributes: Set<string>;

    /** Forbid onXXXX attributes on elements */
    forbidEventHandlers: boolean;

    /** URL attributes used in allowedElements, will be checked against allowedUrlPrefixes */
    urlAttributes: Set<string>;

    /** Allowed URLs - DO NOT PUT "data:text" -> data:text/html can contain malicious scripts */
    allowedUrlPrefixes: string[];
}
