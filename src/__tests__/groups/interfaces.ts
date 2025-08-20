import { asyncIID, interfaceId } from "../../asimo";

export const Service1IID = interfaceId<Service1>("asimo.src.tests.groups.Service1");
export interface Service1 {
    readonly name: string;
    add(a: number, b: number): number;
}

export const Object2IID = asyncIID<Object2>("asimo.src.tests.groups.Object2");
export interface Object2 {
    readonly name: string;
    multiply(a: number, b: number): number;
}
