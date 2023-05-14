import { component, componentId } from "@traxjs/trax-preact";
import { NavService } from "../stores/nav";
import { SearchPanel } from "./search";
import { NavBar } from "./navbar";
import { SearchResultsPanel } from "./results";

export const MainLayout = component("MainLayout", (props: { nav: NavService }) => {
    const { nav } = props;
    const mainView = nav.data.mainView;

    let content: JSX.Element | string = "[...]";
    if (mainView.name === "search") {
        if (mainView.panel === "results") {
            content = <SearchResultsPanel searchService={mainView.$store} nav={nav} />;
        } else if (mainView.panel === "search") {
            content = <SearchPanel nav={nav} />;
        }
    } else if (mainView.name === "doc") {
        content = "[ Under construction ]";
    }

    const className = "px-3 py-1 bg-slate-600 rounded-lg text-white mx-1";
    return <div data-id={componentId()} className="main-layout">
        <NavBar nav={nav} />
        {content}
    </div>
});



