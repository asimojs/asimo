import { component, componentId } from "@traxjs/trax-preact";
import { asm } from "@asimojs/asimo";
import { NavService, SearchServiceIID } from "../stores/types";

export const SearchPanel = component("SearchPanel", (props: { nav: NavService }) => {
    const { nav } = props;

    return <div data-id={componentId()} className="search-panel  py-64">
        <div className="input-container flex justify-center">
            <SearchField className="h-11 w-1/2 py-2.5"/>
        </div>
    </div>

    async function search() {
        const ss = await asm.get(SearchServiceIID);
        ss?.search({ searchInput: "Homer Simpson" });
    }
});

export const SearchField = component("SearchPanel", (props: { className?: string }) => {
    let { className } = props;
    className = className || "";

    return <div className={`${className} flex px-3 bg-neutral-200 rounded-full text-neutral-600
    cursor-pointer
    border border-neutral-200 hover:border-neutral-400`} onClick={search}>
        <div className="mx-1">
            <SearchIcon />
        </div>
        <div>
            Search: <span className="font-medium text-sky-700"> Homer Simpson </span>
        </div>
    </div>

    async function search() {
        const ss = await asm.get(SearchServiceIID);
        ss?.search({ searchInput: "Homer Simpson" });
    }
});

const SearchIcon = component("SearchIcon", () => {
    // 42
    let dim=32;
    return <svg width={dim} height={dim} viewBox="0 0 24 24" version="1.1" aria-hidden="false" >
        <desc lang="en">Magnifying glass</desc>
        {/* Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools */}
        <path className="fill-current  stroke-0" d="M13.07336,12.29053,10.14679,9.364a3.9711,3.9711,0,1,0-.78284.78284l2.92658,2.92657Zm-6.064-2.4516A2.82914,2.82914,0,1,1,9.8385,7.00934,2.83286,2.83286,0,0,1,7.00934,9.83893Z" />
    </svg>
});


