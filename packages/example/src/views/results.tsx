import { component, componentId } from "@traxjs/trax-preact";
import { SearchResults, SearchService, NavService, SearchView } from "../stores/types";
import { lml2JSX } from "../libs/lml/lml";
import { h } from "preact";

export const SearchResultsPanel = component("SearchResultsPanel", (props: { searchService: SearchService, nav: NavService }) => {
    const { searchService, nav } = props;

    return <div data-id={componentId()} className="results-container flex justify-center text-sm">
        <div className="w-full max-w-screen-xl">
            <div className="header bg-neutral-100 p-5">
                header
            </div>
            <div className="body flex pt-3 px-5">
                <div className="main flex-grow">
                    {searchResultsPanel(searchService, nav)}

                </div>
                <div className="sidebar w-4/12 border-l border-l-neutral-200 ps-3">
                    sidebar
                </div>
            </div>
        </div>
    </div>

});


function searchResultsPanel(ss: SearchService, nav: NavService) {
    const data = ss.data;
    const res = data.$lastResult;
    if (res === null) {
        return "";
    }

    //  {(nav.data.mainView as SearchView).testWidget!()}

    return <div className="searchResults" lang="en">
        <div className="query">
            Query: {res.query.searchInput}
        </div>
        {res.type === "Error" ? <div className="Error">
            Error: {res.message}
        </div> : ""}
        {res.type === "SearchResults" ? searchResultsList(ss, res) : ""}
    </div>
}

function searchResultsList(ss: SearchService, res: SearchResults) {
    const r = res.results;
    const cpts = res.components;

    const content = lml2JSX(res.results.main, h, (name, ns) => {
        if (cpts && cpts[ns]) {
            return cpts[ns][name] || null;
        }
        return null;
    });

    return <div className="searchResults" lang="en">
        <div> About <b className="font-bold">{r.totalMatchCount}</b>results ({r.processingTime} seconds) </div>
        <div> [...]</div>
        {content}
    </div>
}
