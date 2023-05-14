import { component, componentId } from "@traxjs/trax-preact";
import { NavService } from "../stores/nav";
import { asm } from "@asimojs/asimo";
import { SearchServiceIID } from "../stores/search";

export const SearchPanel = component("SearchPanel", (props: { nav: NavService }) => {
    const { nav } = props;

    return <div data-id={componentId()} className="search-panel  py-72">
        <div className="input-container flex justify-center">

            <div className=" bg-neutral-200 w-1/2 rounded-full h-11 flex px-3 py-2.5 text-neutral-600 cursor-pointer
                border border-neutral-200 hover:border-neutral-400" onClick={search}>

                <div className="mx-1">
                    <SearchIcon />
                </div>
                <div>
                    Search: <span className="font-medium text-sky-700"> Homer Simpson </span>
                </div>
            </div>
        </div>
    </div>

    async function search() {
        const ss = await asm.get(SearchServiceIID);
        ss?.search({ searchInput: "Homer Simpson" });
    }
});

const SearchIcon = component("SearchIcon", () => {
    return <svg width="42" height="42" viewBox="0 0 24 24" version="1.1" aria-hidden="false" >
        <desc lang="en">Magnifying glass</desc>
        {/* Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools */}
        <path className="fill-current  stroke-0" d="M13.07336,12.29053,10.14679,9.364a3.9711,3.9711,0,1,0-.78284.78284l2.92658,2.92657Zm-6.064-2.4516A2.82914,2.82914,0,1,1,9.8385,7.00934,2.83286,2.83286,0,0,1,7.00934,9.83893Z" />
    </svg>
});


