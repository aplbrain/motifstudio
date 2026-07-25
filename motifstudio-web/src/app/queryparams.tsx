"use client";
/**
 * Get the query parameters from the URL.
 *
 * @returns {Object} - An object containing the query parameters.
 * @returns {string} host_id - The ID of the host graph.
 * @returns {string} host_name - The name of the host graph.
 * @returns {string} motif - The motif query string.
 * @returns {string} query_type - The type of query language (dotmotif or cypher).
 */
export function getQueryParams(): {
    host_id: string;
    host_name: string;
    motif: string;
    query_type: string;
} {
    const search = window.location.search;
    const params = new URLSearchParams(search);
    return {
        host_id: params.get("host_id") || "",
        host_name: params.get("host_name") || "",
        motif: params.get("motif") || "",
        query_type: params.get("query_type") || "dotmotif",
    };
}

/**
 * Update the query parameters in the URL without overwriting.
 *
 * TODO: We can also implement a setQueryParams function to set the query
 * parameters destructively, but this is not currently needed.
 *
 * @param {Object} params - An object containing the query parameters to update.
 * @param {string} params.host_id - The ID of the host graph.
 * @param {string} params.host_name - The name of the host graph.
 * @param {string} params.motif - The motif query string.
 * @param {string} params.query_type - The type of query language (dotmotif or cypher).
 */
export function updateQueryParams(params: { [key: string]: string }) {
    const search = new URLSearchParams(window.location.search);
    for (const key in params) {
        if (params[key]) {
            search.set(key, params[key]);
        } else {
            search.delete(key);
        }
    }
    const query = search.toString();
    window.history.replaceState({}, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
}
