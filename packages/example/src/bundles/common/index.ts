// import { Hello } from "./hello";
// import { Counter } from "./counter";

// console.log("LOADED")

// type Foo = string;
// const blah: Foo = "abc";


// export default {
//     hello: Hello,
//     counter: Counter
// }

import { asm, interfaceId } from "@asimojs/asimo";
import { ComponentBundle } from "../types";
import { Counter } from "./counter";

// Interface ID that will be used by the consumer
export const CommonBundleIID = interfaceId<ComponentBundle>("asimo.dpademo.bundles.common");

const bundle = {
    counter: Counter
}

asm.registerService(CommonBundleIID, () => bundle);

export default bundle;
