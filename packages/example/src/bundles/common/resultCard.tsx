import { component, componentId } from "@traxjs/trax-preact";
import { LML, LmlJSX } from "../../libs/lml/types";
import { useContext } from "../utils";
import { Lml2JsxIID } from "../../views/types";



export const ResultCard = component("ResultCard", (props: { lang?: string, sideContent?: LML, children?: any }) => {
    let { lang, children, sideContent } = props;

    const lml2jsx = useContext(Lml2JsxIID);
    let sideSection: LmlJSX = "";
    if (sideContent && lml2jsx) {
        sideSection = lml2jsx(sideContent);
    }


    return <div data-id={componentId()} className='resultCard flex border'>
        <div className="mainsection flex-1">
            <div className='header'>
                rcard
            </div>
            <div className='content'>
                some content
            </div>
        </div>
        <div className="sidesection">
            {sideSection}
        </div>

    </div>
});
