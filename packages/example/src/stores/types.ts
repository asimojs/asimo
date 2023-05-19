import { interfaceId } from "@asimojs/asimo";
import { SearchResponse } from "../api/types";
import { LML, JsxContent } from "../libs/lml/types";


// ------------------------------------------------------------------------------------------------------------

export const NavServiceIID = interfaceId<NavService>("asimo.doc.stores.NavService");
export interface NavService {
    data: {
        mainView: DocView | SearchView | LoadingView
    },
    /** Navigate to the home page */
    home(): void;
}

export interface LoadingView {
    name: "loading";
}

export interface DocView {
    name: "doc";
}

export interface SearchView {
    name: "search";
    panel: "search" | "results";
    $store: SearchService;
}

// ------------------------------------------------------------------------------------------------------------

export const SearchServiceIID = interfaceId<SearchService>("asimo.doc.stores.SearchService");

export interface SearchService {
    data: {
        query: SearchQuery;
        lastResult: null | SearchResults | SearchError;
    },
    /** Perfom a search according to the query data - use the data query if no query provided */
    search(query?: SearchQuery, navigate?: boolean): Promise<boolean>;
}

export interface SearchQuery {
    searchInput: string;
}

export interface SearchResults {
    type: "SearchResults"
    query: {
        searchInput: string;
    },
    results: SearchResponse;
    lml2jsx: (lml:LML) => JsxContent;
}

export interface ComponentMap {
    [bundleName: string]: {
        [cptName: string]: JsxComponent;
    }
}
export type JsxComponent = (props?: { [key: string]: any }) => JSX.Element;

interface SearchError {
    type: "Error";
    query: {
        searchInput: string;
    },
    message: string;
}

// ------------------------------------------------------------------------------------------------------------
