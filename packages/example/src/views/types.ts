import { interfaceId } from "@asimojs/asimo";
import { LML, LmlJSX } from "../libs/lml/types";

export type Lml2JSX = (lml: LML) => LmlJSX;

export const Lml2JsxIID = interfaceId<Lml2JSX>("asimo.dpademo.views.Lml2JSX");
