import { interfaceId } from "@asimojs/asimo";
import { SearchResponse } from "../api/types";
import { LML, JsxContent } from "../libs/lml/types";
import { SearchMoreQuery } from "../api/searchMore";

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
    /** Get more results on top of a previous search */
    getMoreResults(query: SearchMoreQuery, navigate?: boolean): Promise<boolean>;
    /** Load a search response that has already been fetched (e.g. in the start page) */
    loadSearchResponse(r: SearchResponse, q: SearchQuery, navigate?:boolean): Promise<void>;
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
    lml2jsx: (lml: LML) => JsxContent;
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
