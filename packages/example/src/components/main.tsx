import { component, componentId } from "@traxjs/trax-preact";
import { ExampleView, NavService } from "../stores/nav";
import { asm } from "@asimojs/asimo";
import { SearchResults, SearchService, SearchServiceIID } from "../stores/search";

export const MainLayout = component("MainLayout", (props: { nav: NavService }) => {
    const { nav } = props;
    const mainView = nav.data.mainView;

    let content: JSX.Element | string = "";
    if (mainView.name === "ex") {
        if (mainView.panel === "results") {
            content = searchResultsPanel(mainView.$store, nav);
        }
    }

    const className = "px-3 py-1 bg-slate-600 rounded-lg text-white mx-1";
    return <div data-id={componentId()}>
        <div className="bg-gray-100 text-cyan-800">
            <button className={className} onClick={search}> Search </button>
            <button className={className} onClick={nav.home}> Home </button>
        </div>
        {content}
    </div>

    async function search() {
        const ss = await asm.get(SearchServiceIID);
        ss?.search({ searchInput: "Homer Simpson" });
    }
});

function searchResultsPanel(ss: SearchService, nav: NavService) {
    const data = ss.data;
    const res = data.$lastResult;
    if (res === null) {
        return "";
    }

    return <div className="searchResults" lang="en">
        <div className="query">
            Query: {res.query.searchInput} {(nav.data.mainView as ExampleView).testWidget!()}
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

