import { component, componentId } from "@traxjs/trax-preact";
import { SearchResults, SearchService } from "../stores/search";
import { NavService, SearchView } from "../stores/nav";

export const SearchResultsPanel = component("SearchResultsPanel", (props: { searchService: SearchService, nav: NavService }) => {
    const { searchService, nav } = props;

    return <div data-id={componentId()} className="search-result">
        <div>Results</div>
        <div>
            {searchResultsPanel(searchService, nav)}
        </div>
    </div>

});


function searchResultsPanel(ss: SearchService, nav: NavService) {
    const data = ss.data;
    const res = data.$lastResult;
    if (res === null) {
        return "";
    }

    return <div className="searchResults" lang="en">
        <div className="query">
            Query: {res.query.searchInput} {(nav.data.mainView as SearchView).testWidget!()}
        </div>
        {res.type === "Error" ? <div className="Error">
            Error: {res.message}
        </div> : ""}
        {res.type === "SearchResults" ? searchResultsList(ss, res) : ""}
    </div>
}

function searchResultsList(ss: SearchService, res: SearchResults) {
    const r = res.results;

    return <div className="searchResults" lang="en">
        <div> About <b className="font-bold">{r.totalMatchCount}</b>results ({r.processingTime} seconds) </div>


        [...]
    </div>
}
