import { LML, LmlUpdate } from "../libs/lml/types";

export interface ErrorResponse {
    type: "Error";
    message: string;
}

export interface SearchResponse {
    type: "SearchResponse",
    /** Approximate total number of results */
    totalMatchCount?: number;
    /** Server processing time in s */
    processingTime?: number;
    /** Default language - e.g. "en" */
    lang?: string;
    /** Widget bundles used in the response */
    bundles?: { [id: string]: BundleRef }
    /** Header section */
    header?: LML[],
    /** Main results set */
    main?: LML[],
    /** Optional updates for the main section - interpreted if main is not provided */
    mainUpdates?: LmlUpdate[];
    /** Sidebar results set */
    sidebar?: LML[],
    /** Optional updates for the sidebar section - interpreted if main is not provided */
    sidebarUpdates?: LmlUpdate[];
}

export interface BundleRef {
    /** Bundle interface namespace */
    ns: string;
    /** Bundle URL */
    src: string;
}
