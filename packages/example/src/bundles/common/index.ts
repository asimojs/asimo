import { asm, interfaceId } from "@asimojs/asimo";
import { ComponentBundle } from "../types";
import { Counter } from "./counter";
import { ImgList } from "./imgList";
import { ResultCard } from "./resultCard";
import { Img } from "./img";

// Interface ID that will be used by the consumer
export const CommonBundleIID = interfaceId<ComponentBundle>("asimo.dpademo.bundles.common");

const bundle = {
    counter: Counter,
    imgList: ImgList,
    rcard: ResultCard,
    img: Img
}

asm.registerService(CommonBundleIID, () => bundle);

export default bundle;
