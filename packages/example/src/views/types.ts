import { interfaceId } from "@asimojs/asimo";
import { LML, JsxContent } from "../libs/lml/types";

export type Lml2JSX = (lml: LML) => JsxContent;

export const Lml2JsxIID = interfaceId<Lml2JSX>("asimo.dpademo.views.Lml2JSX");
