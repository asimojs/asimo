export type LML = LmlTextNode | LmlNode | LmlFragment;

type LmlTextNode = string;
type LmlFragment = LML[];
type LmlNode = (LmlNodeName | LmlAttributeMap | LML)[]; // string = no
type LmlNodeName = string;
type LmlAttributeMap = LmlObject;

interface LmlObject {
    [key: string]: LmlValue | LmlValue[];
}

type LmlValue = string | number | boolean | LmlObject | LML;

