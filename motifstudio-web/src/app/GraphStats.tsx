"use client";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { HostListing, bodiedFetcher, BASE_URL } from "./api";
import { useClientOnly } from "./hooks/useClientOnly";

/**
 * Display graph statistics and attributes when a host is selected.
 *
 * This includes both simple invariants (nodes, edges, density) and vertex
 * attributes, so that a query can be constructed with the correct attribute
 * names. This component is also responsible for sharing the attributes with
 * the rest of the app --- a function mainly used to get the set of available
 * attributes for autocompletion in the query editor.
 *
 * @param {HostListing} graph - The selected host graph.
 * @param {(attributes: { [key: string]: string }) => void} onAttributesLoaded -
 *      Callback function to share the attributes with the rest of the app.
 */
export function GraphStats({
    graph,
    onAttributesLoaded,
}: {
    graph: HostListing;
    onAttributesLoaded?: (attributes: { [key: string]: string }) => void;
}) {
    const isClient = useClientOnly();
    const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);

    const {
        data: properties,
        error,
        isLoading,
    } = useSWR<{
        vertex_count: number;
        edge_count: number;
        vertex_attributes: { [key: string]: string };
        edge_attributes: { [key: string]: string };
    }>([`${BASE_URL}/queries/graph/properties`, graph?.id], () =>
        bodiedFetcher(`${BASE_URL}/queries/graph/properties`, {
            host_id: graph?.id,
        })
    );

    // To handle the fact that the attributes are loaded asynchronously, we
    // provide a callback function to the parent component to share the
    // attributes when they are loaded.
    useEffect(() => {
        if (properties?.vertex_attributes) {
            onAttributesLoaded?.(properties.vertex_attributes);
        }
    }, [properties?.vertex_attributes, onAttributesLoaded]);

    // Use client-only check to avoid hydration mismatch
    if (!isClient || isLoading) return <div className="h-48 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" aria-label="Loading graph details" />;
    if (error) return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300">Could not load graph details: {error.message || String(error)}</div>;
    if (!properties) return <div className="text-sm text-slate-500">No graph details available.</div>;

    /**
     * Download the graph in a selected format.
     *
     * @param {string} format - The format to download the graph in. One of
     *     "graphml", "gml", "gexf", "json".
     */
    function downloadGraph(format: string = "graphml") {
        // Set loading state
        setDownloadingFormat(format);

        // POST to /api/queries/graph/download with the "host_id" and "format"
        // parameters in the body.
        fetch(`${BASE_URL}/queries/graph/download`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/octet-stream",
            },
            body: JSON.stringify({
                host_id: graph.id,
                format: format,
            }),
        })
            .then(async (res) => {
                if (!res.ok) {
                    const data = await res.json().catch(() => null);
                    throw new Error(data?.detail || `Download failed with status ${res.status}`);
                }
                return res.blob();
            })
            .then((blob) => {
                // Create a URL for the blob and create a link to download it.
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${graph.name}.${format}`;
                a.click();
                URL.revokeObjectURL(url);
            })
            .catch((error) => {
                console.error("Download failed:", error);
                // You could add error handling UI here if needed
            })
            .finally(() => {
                // Clear loading state
                setDownloadingFormat(null);
            });
    }

    // Keep the counts at a glance; the attribute schema remains one click away.
    return (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                <h2 className="text-lg font-semibold tracking-tight">Graph overview</h2>
                <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400" title={graph.name}>{graph.name}</p>
            </div>
            <div className="p-5">
                <dl className="grid grid-cols-3 gap-2">
                    <div className="min-w-0 rounded-xl bg-slate-50 px-3 py-3 dark:bg-slate-800">
                        <dt className="text-xs text-slate-500 dark:text-slate-400">Nodes</dt>
                        <dd className="mt-1 text-lg font-semibold tabular-nums">{properties.vertex_count.toLocaleString()}</dd>
                    </div>
                    <div className="min-w-0 rounded-xl bg-slate-50 px-3 py-3 dark:bg-slate-800">
                        <dt className="text-xs text-slate-500 dark:text-slate-400">Edges</dt>
                        <dd className="mt-1 text-lg font-semibold tabular-nums">{properties.edge_count.toLocaleString()}</dd>
                    </div>
                    <div className="min-w-0 rounded-xl bg-slate-50 px-3 py-3 dark:bg-slate-800">
                        <dt className="text-xs text-slate-500 dark:text-slate-400">Density</dt>
                        <dd className="mt-1 text-lg font-semibold tabular-nums">
                            {properties.vertex_count === 0 ? "0.000000" : (properties.edge_count / Math.pow(properties.vertex_count, 2)).toFixed(6)}
                        </dd>
                    </div>
                </dl>

                <div className="mt-4 divide-y divide-slate-200 border-y border-slate-200 dark:divide-slate-800 dark:border-slate-800">
                    <details className="group py-3">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-medium marker:hidden">
                            <span>Vertex attributes</span>
                            <span className="text-xs text-slate-400">{Object.keys(properties.vertex_attributes || {}).length} fields <span aria-hidden="true">⌄</span></span>
                        </summary>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                            {Object.entries(properties.vertex_attributes || {}).map(([key, value]) => (
                                <span key={key} className="rounded-md bg-sky-50 px-2 py-1 text-xs font-medium text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                                    {key} <span className="font-mono opacity-65">{value}</span>
                                </span>
                            ))}
                        </div>
                    </details>
                    <details className="group py-3">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-medium marker:hidden">
                            <span>Edge attributes</span>
                            <span className="text-xs text-slate-400">{Object.keys(properties.edge_attributes || {}).length} fields <span aria-hidden="true">⌄</span></span>
                        </summary>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                            {Object.entries(properties.edge_attributes || {}).map(([key, value]) => (
                                <span key={key} className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                    {key} <span className="font-mono opacity-65">{value}</span>
                                </span>
                            ))}
                        </div>
                    </details>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Download graph</span>
                    <div className="flex gap-2">
                    <button
                        onClick={() => downloadGraph("graphml")}
                        disabled={downloadingFormat !== null}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                        {downloadingFormat === "graphml" && (
                            <svg className="h-4 w-4 animate-spin text-slate-700 dark:text-slate-200" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                            </svg>
                        )}
                        GraphML
                    </button>
                    <button
                        onClick={() => downloadGraph("gexf")}
                        disabled={downloadingFormat !== null}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                        {downloadingFormat === "gexf" && (
                            <svg className="h-4 w-4 animate-spin text-slate-700 dark:text-slate-200" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                            </svg>
                        )}
                        GEXF
                    </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
