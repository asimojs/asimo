import { component, componentId } from "@traxjs/trax-preact";
import { JsxContent } from "../../libs/lml/types";

export interface SectionProps {
    title?: string;
    className?: string;
    children?: JsxContent;
}

export const Section = component("Section", (props: SectionProps) => {
    let { children, className, title } = props;
    className = className || "";

    let titleSection: JsxContent = "";
    if (title) {
        titleSection = <div className="text-base pb-2">{title}</div>
    }

    return <div data-id={componentId()} className="section mt-7 text-sm" >
        {titleSection}
        <div className={className}> {children} </div>
    </div>
});
