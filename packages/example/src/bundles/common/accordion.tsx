import { component, componentId, useTraxState } from "@traxjs/trax-preact";
import { LML } from "../../libs/lml/types";
import { useContext } from "../utils";
import { Lml2JsxIID } from "../../views/types";
import { SearchServiceIID } from "../../stores/types";
import { asm } from "@asimojs/asimo";

export interface AccordionProps {
    title?: LML;
    keyValue: string;
    sectionClassName?: string;
    sections: GroupSection[];
}

export interface GroupSection {
    title: string;
    key: string;
    content: LML;
}

interface AccordionState {
    sections: {
        [key: string]: boolean; // true if expanded
    }
}

export const Accordion = component("Accordion", (props: AccordionProps) => {
    let { title, keyValue, sections, sectionClassName } = props;
    sectionClassName = sectionClassName || "py-2";

    const lml2jsx = useContext(Lml2JsxIID, () => "[...]")!;
    const state = useTraxState<AccordionState>({ sections: {} });
    const sectionStates = state.sections;

    return <div data-id={componentId()} className='accordion mt-7'>
        {!title ? "" :
            <div className="title text-xl pb-2">
                {lml2jsx(title)}
            </div>
        }
        <div className="sections text-base" onClick={handleClick}>
            {sections.map((section, idx) =>
                <div className="section">
                    <div data-section-key={section.key} className={`${sectionClassName} flex border-t cursor-pointer`}>
                        <div className="flex-1">{section.title}</div>
                        <div className="w-8">
                            <ArrowIcon idx={idx} up={!!sectionStates[section.key]} />
                        </div>
                    </div>
                    <div className={"content pt-1 pb-4 " + (sectionStates[section.key] ? "" : "hidden")}>
                        {/* note: use display none (hidden) to prefetch potential images */}
                        {lml2jsx(section.content)}
                    </div>
                </div>
            )}
        </div>
    </div>

    async function handleClick(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
        let sectionKey = "", elt: any = e.target;
        while (elt) {
            if (elt.dataset?.sectionKey !== undefined) {
                sectionKey = elt.dataset?.sectionKey;
                break
            }
            elt = elt.parentElement || null;
        }
        if (sectionKey) {
            const open = !(sectionStates[sectionKey]);
            sectionStates[sectionKey] = open;

            if (open) {
                // submit request to get more data
                const ss = await asm.get(SearchServiceIID);
                if (ss) {
                    const q = ss.data.lastResult!.query;
                    ss.getMoreResults({
                        searchInput: q.searchInput,
                        src: {
                            key: keyValue,
                            componentType: "Accordion",
                            firstContentKey: sections[0].key,
                            lastContentKey: sections[sections.length - 1].key
                        }
                    });
                }
            }
        }
    }
});

const ArrowIcon = component("ArrowIcon", (props: { up?: boolean, idx: number }) => {
    let dim = 15;
    const dir = props.up ? "rotate-180" : "";

    return <svg className={`arrow-icon ${dir}`} width={dim} height={dim} viewBox="0 -4.5 20 20" version="1.1" aria-hidden="true" >
        <desc lang="en">Arrow Down</desc>
        {/* Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools */}

        {/* Pretty bad svg - should be optimized */}
        <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
            <g transform="translate(-220.000000, -6684.000000)" className="fill-current">
                <g id="icons" transform="translate(56.000000, 160.000000)">
                    <path d="M164.292308,6524.36583 L164.292308,6524.36583 C163.902564,6524.77071 163.902564,6525.42619 164.292308,6525.83004 L172.555873,6534.39267 C173.33636,6535.20244 174.602528,6535.20244 175.383014,6534.39267 L183.70754,6525.76791 C184.093286,6525.36716 184.098283,6524.71997 183.717533,6524.31405 C183.328789,6523.89985 182.68821,6523.89467 182.29347,6524.30266 L174.676479,6532.19636 C174.285736,6532.60124 173.653152,6532.60124 173.262409,6532.19636 L165.705379,6524.36583 C165.315635,6523.96094 164.683051,6523.96094 164.292308,6524.36583" />
                </g>
            </g>
        </g>
    </svg>
});
