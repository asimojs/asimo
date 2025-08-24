import { asm } from "../../asimo";
import { Object2IID, Service1IID } from "./interfaces";

asm.registerBundle([Service1IID, Object2IID], () => import("./groupA"));
