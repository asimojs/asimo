import { component, componentId } from "@traxjs/trax-preact";
import { JsxContent, LML } from "../../libs/lml/types";
import { useContext } from "../utils";
import { Lml2JsxIID } from "../../views/types";

export interface FactsProps {
    cols?: number;
    entryClassName?: string;
    entries: {
        name: string;
        value: LML;
    }[]
}

export const Facts = component("Facts", (props: FactsProps) => {
    let { entries, cols, entryClassName } = props;
    cols = cols || 2;
    const len = entries.length;
    const mid = Math.ceil(len / 2);

    entryClassName = entryClassName || "text-xs";

    const lml2jsx = useContext(Lml2JsxIID, () => "[...]")!;

    if (cols > 1) {
        return <div data-id={componentId()} className='facts columns-2 pt-2'>
            <div className="">{printFacts(0, mid)}</div>
            <div className="">{printFacts(mid + 1, len - 1)}</div>
        </div>
    } else {
        return <div data-id={componentId()} className='facts  pt-2'>
            <div className="">{printFacts(0, len - 1)}</div>
        </div>
    }

    function printFacts(startIdx: number, lastIdx: number) {
        const r: JsxContent[] = [];
        for (let i = startIdx; lastIdx >= i; i++) {
            const fact = entries[i];
            r.push(<div className={entryClassName}>
                <span className="name text-neutral-500">{fact.name}: </span>
                <span className="value">{lml2jsx(fact.value)}</span>
            </div>)
        }
        return r;
    }
});
