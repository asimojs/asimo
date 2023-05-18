import { component, componentId } from "@traxjs/trax-preact";
import { LML, JsxContent } from "../../libs/lml/types";
import { useContext } from "../utils";
import { Lml2JsxIID } from "../../views/types";
import { Img } from "./img";


export interface RcProps {
    lang?: string;
    header: RcHeader;
    sideContent?: LML;
    footerLinks?: LML[];
    children?: JsxContent;
}
export interface RcHeader {
    title: string;
    href: string;
    src: {
        name: string;
        ref: string;
        logo: LML;
    },
    misc?: LML;
}

export const ResultCard = component("ResultCard", (props: RcProps) => {
    let { lang, header, children, sideContent, footerLinks } = props;

    const lml2jsx = useContext(Lml2JsxIID);

    let sideSection: JsxContent = "";
    let logo: JsxContent = "";
    let footerSection: JsxContent = "";
    if (lml2jsx) {
        if (sideContent) {
            sideSection = lml2jsx(sideContent);
        }
        logo = lml2jsx(header.src.logo);
        if (footerLinks) {
            footerSection = <div className="pt-1">
                {footerLinks.map((lnk, idx) => {
                    if (idx === 0) {
                        return lml2jsx(lnk);
                    } else {
                        return [" · ", lml2jsx(lnk)];
                    }
                })}
            </div>;
        }
    }

    return <div data-id={componentId()} lang={lang} className='resultCard flex font-normal mt-7'>
        <div className="mainsection flex-1 pe-2">
            <div className='header flex'>
                <div className="border rounded-full flex items-center justify-center mt-1" style={{ height: 26, width: 26 }}>
                    {logo}
                </div>
                <div className="px-2">
                    <div className="text-sm">{header.src.name}</div>
                    <div className="text-xs">{header.src.ref}</div>
                </div>
            </div>
            <div className="title pt-1 text-xl">
                <a className="link font-medium" href={header.href}>{header.title}</a>
            </div>
            <div className='content text-xs pt-1'>
                {children}
            </div>
            {footerSection}
        </div>
        <div className="sidesection text-xs ">
            {sideSection}
        </div>
    </div>
});
