import { component, componentId } from "@traxjs/trax-preact";
import { SearchResults, SearchService, NavService } from "../stores/types";
import { createContext } from "../bundles/utils";
import { Lml2JsxIID } from "./types";
import { trax } from "@traxjs/trax";

export const SearchResultsPanel = component("SearchResultsPanel", (props: { searchService: SearchService, nav: NavService }) => {
    const { searchService, nav } = props;
    const res = searchService.data.lastResult;

    if (res === null || res.type === "Error") {
        return <div>[Under construction]</div>;
    }

    const r = res.results;
    const L2JContext = createContext(Lml2JsxIID, res.lml2jsx);

    return <L2JContext.Provider value={res.lml2jsx}>
        <div data-id={componentId()} className="results-container flex justify-center text-sm">
            <div className="w-full max-w-screen-xl">
                <div className="header bg-neutral-100 p-5 text-sm">
                    <div onClick={test}> About <b className="font-bold">{r.totalMatchCount}</b> results ({r.processingTime} seconds) </div>
                </div>
                <div className="body flex pt-3 px-5">
                    <div className="main flex-grow me-5">
                        {searchResultsPanel(searchService, nav)}
                    </div>
                    <div className="sidebar w-4/12">
                        {(!r.sidebar) ? "" :
                            <div className="text-neutral-700 border-l border-l-neutral-200 ps-5 pb-9">
                                {res.lml2jsx(r.sidebar)}
                            </div>
                        }
                    </div>
                </div>
            </div>
        </div>
    </L2JContext.Provider>

    function test() {
        const rCardHeader = (r.main[1][1] as any).header;
        console.log("x", trax.isTraxObject(r), rCardHeader.title);

        rCardHeader.title += "x";

    }
});

function searchResultsPanel(ss: SearchService, nav: NavService) {
    const data = ss.data;
    const res = data.lastResult;
    if (res === null) {
        return "";
    }

    return <div className="searchResults" lang="en">
        {res.type === "Error" ? <div className="Error">
            Error: {res.message}
        </div> : ""}
        {res.type === "SearchResults" ? searchResultsList(ss, res) : ""}
    </div>
}

function searchResultsList(ss: SearchService, res: SearchResults) {
    const r = res.results;

    return <div className="searchResults" lang="en">
        <div style={{ width: 657 }} className="text-neutral-700">
            {res.lml2jsx(res.results.main)}
        </div>
    </div>
}
