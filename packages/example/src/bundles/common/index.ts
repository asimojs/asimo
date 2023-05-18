import { asm, interfaceId } from "@asimojs/asimo";
import { ComponentBundle } from "../types";
import { Counter } from "./counter";
import { ImgList } from "./imgList";
import { ResultCard } from "./resultCard";
import { Img } from "./img";
import { Facts } from "./facts";
import { ExpGroup } from "./expandableGroup";
import { Section } from "./section";

// Interface ID that will be used by the consumer
export const CommonBundleIID = interfaceId<ComponentBundle>("asimo.dpademo.bundles.common");

const bundle = {
    counter: Counter,
    imgList: ImgList,
    rcard: ResultCard,
    img: Img,
    facts: Facts,
    expGroup: ExpGroup,
    section: Section
}

asm.registerService(CommonBundleIID, () => bundle);

export default bundle;
