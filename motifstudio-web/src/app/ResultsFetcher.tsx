"use client";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { HostListing, bodiedFetcher, BASE_URL, neuroglancerUrlFromHostVolumetricData } from "./api";
import { useDebounce } from "./useDebounce";
import { LoadingSpinner } from "./LoadingSpinner";

const RESULTS_PER_PAGE = 100;

export function ResultsFetcher({
    graph,
    query,
    queryType,
    limit,
}: {
    graph: HostListing | null;
    query: string;
    queryType: "dotmotif" | "cypher";
    limit?: number;
}) {
    const debouncedQuery = useDebounce(query, 500);
    const inFlight = useRef<{
        key: string;
        controller: AbortController;
        promise: ReturnType<typeof bodiedFetcher>;
    } | null>(null);
    const mounted = useRef(false);
    const [page, setPage] = useState(0);

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
            // Strict Mode re-runs effects on mount. Let that setup complete
            // before cancelling a request for a component that truly unmounted.
            queueMicrotask(() => {
                if (!mounted.current) inFlight.current?.controller.abort();
            });
        };
    }, []);

    useEffect(() => {
        setPage(0);
    }, [graph?.id, debouncedQuery, queryType, limit]);

    const {
        data: queryData,
        error: queryError,
        isLoading: queryIsLoading,
        isValidating: queryIsValidating,
        mutate: retryQuery,
    } = useSWR([`${BASE_URL}/queries/motifs`, graph?.id, debouncedQuery, queryType, limit], () => {
        const key = JSON.stringify([graph?.id, debouncedQuery, queryType, limit]);
        if (inFlight.current?.key === key) return inFlight.current.promise;

        // A changed query supersedes the old request. Revalidating the same
        // query shares its promise instead of aborting it.
        inFlight.current?.controller.abort();
        const requestController = new AbortController();
        const promise = bodiedFetcher(
            `${BASE_URL}/queries/motifs`,
            {
                host_id: graph?.id,
                query: debouncedQuery,
                query_type: queryType,
                limit,
            },
            { signal: requestController.signal }
        );
        inFlight.current = { key, controller: requestController, promise };
        const clear = () => {
            if (inFlight.current?.promise === promise) inFlight.current = null;
        };
        void promise.then(clear, clear);
        return promise;
    }, {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        shouldRetryOnError: false,
    });

    if (queryIsLoading) return <LoadingSpinner />;

    // If there was a fetching error, show it to the user
    if (queryError) {
        const msg = queryError instanceof Error ? queryError.message : String(queryError);
        return (
            <div className="flex flex-wrap items-center gap-3 rounded-xl bg-rose-50 p-4 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                <span>Error fetching query: {msg}</span>
                <button
                    type="button"
                    className="rounded-lg border border-rose-200 px-3 py-1.5 font-semibold hover:bg-rose-100 disabled:opacity-50 dark:border-rose-800 dark:hover:bg-rose-900"
                    disabled={queryIsValidating}
                    onClick={() => void retryQuery()}
                >
                    {queryIsValidating ? "Retrying…" : "Retry query"}
                </button>
            </div>
        );
    }

    let durationString = "";
    if (queryData?.response_duration_ms) {
        // < 2 sec, show ms
        if (queryData.response_duration_ms < 2000) {
            durationString = `${queryData.response_duration_ms.toFixed(2)} ms`;
        }

        // Else show 3 decimal places of seconds
        else {
            durationString = `${(queryData.response_duration_ms / 1000).toFixed(3)} sec`;
        }
    }

    let errorText = "";
    if (queryData?.error) {
        errorText = queryData.error;
        if (errorText.includes("max() arg is an empty sequence")) {
            errorText = "Motif must contain only one connected component.";
        }
    }

    // If server returned an error message, display it
    if (errorText) {
        return <div className="text-red-500 p-4">{errorText}</div>;
    }

    const motifCountString = queryData?.motif_count?.toLocaleString();
    const motifResults = queryData?.motif_results || [];
    const pageCount = Math.max(1, Math.ceil(motifResults.length / RESULTS_PER_PAGE));
    const pageStart = page * RESULTS_PER_PAGE;
    const pageResults = motifResults.slice(pageStart, pageStart + RESULTS_PER_PAGE);

    /**
     * Download the results in the requested format.
     *
     * Operates by creating a Blob of the data and creating a URL to download
     * the Blob, then clicking the link to download the file.
     *
     * @param {string} format - The format to download the results in. One of
     *    "json", "csv".
     * @returns {void}
     */
    function downloadResults(format: "json" | "csv"): void {
        let blob: Blob;
        let filename: string;

        if (format === "json") {
            blob = new Blob([JSON.stringify(queryData)], { type: "application/json" });
            filename = "motif_results.json";
        } else {
            const csv = motifResults.map((result: any) => {
                return queryData.motif_entities
                    .map((entity: string) => {
                        let value = result[entity].id;
                        // For JSON-serialized values, try to parse them for CSV export
                        if (typeof value === "string") {
                            try {
                                const parsed = JSON.parse(value);
                                // Use the parsed value if it's simple, otherwise keep the JSON string
                                if (typeof parsed === "string" || typeof parsed === "number") {
                                    value = parsed.toString();
                                }
                            } catch {
                                // If parsing fails, use as-is
                            }
                        }
                        // Escape commas and quotes for CSV
                        if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
                            value = `"${value.replace(/"/g, '""')}"`;
                        }
                        return value;
                    })
                    .join(",");
            });
            blob = new Blob([csv.join("\n")], { type: "text/csv" });
            filename = "motif_results.csv";
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    }

    return (
        <>
            <h3 className="sr-only">Match details</h3>
            <dl className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
                    <dt className="text-xs text-slate-500 dark:text-slate-400">Result count</dt>
                    <dd className="mt-1 text-xl font-semibold tabular-nums">{motifCountString ?? "Error"}</dd>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
                    <dt className="text-xs text-slate-500 dark:text-slate-400">Query duration</dt>
                    <dd className="mt-1 text-xl font-semibold tabular-nums">
                    {queryData?.response_duration_ms ? (
                        <span>{durationString}</span>
                    ) : (
                        <span className="text-rose-600">Error</span>
                    )}
                    </dd>
                </div>
            </dl>
            <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="mr-1 text-xs font-medium text-slate-500 dark:text-slate-400">Entities</span>
                <div className="flex flex-wrap gap-1.5">
                    {(queryData?.motif_entities || []).map((e: string) => {
                        return (
                            <span
                                key={e}
                                className="rounded-md bg-sky-50 px-2 py-1 font-mono text-xs font-medium text-sky-800 dark:bg-sky-950 dark:text-sky-300"
                            >
                                {e}
                            </span>
                        );
                    })}
                </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="mr-1 text-xs font-medium text-slate-500 dark:text-slate-400">Download</span>
                <div className="flex gap-2">
                    <button
                        type="button"
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        onClick={() => downloadResults("json")}
                    >
                        JSON
                    </button>
                    <button
                        type="button"
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        onClick={() => downloadResults("csv")}
                    >
                        CSV
                    </button>
                </div>
            </div>
            <div className="flex flex-col gap-2">
                <div className="max-h-72 overflow-auto rounded-xl border border-slate-200 dark:border-slate-700">
                    <table className="w-full border-collapse text-sm">
                        <caption className="sr-only">Motif query results</caption>
                        <thead className="sticky top-0 bg-slate-50 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                            <tr>
                                <th scope="col" className="px-3 py-2.5 text-left">
                                    Visualization
                                </th>
                                {(queryData?.motif_entities || []).map((entity: string) => (
                                    <th scope="col" className="truncate px-3 py-2.5 text-left" key={entity}>
                                        {entity}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {pageResults.length ? (
                                pageResults.map((result: any, i: number) => (
                                    <tr
                                        key={pageStart + i}
                                        className="hover:bg-sky-50/50 dark:hover:bg-slate-800"
                                    >
                                        <td className="px-3 py-2.5">
                                            <a
                                                href={neuroglancerUrlFromHostVolumetricData(
                                                    queryData?.host_volumetric_data?.uri,
                                                    queryData?.host_volumetric_data?.other_channels || [],
                                                    Object.values(result).map((v: any) => {
                                                        const id = v?.__segmentation_id__ || v.id;
                                                        if (typeof id === "string") {
                                                            try {
                                                                return JSON.parse(id);
                                                            } catch {
                                                                return id;
                                                            }
                                                        }
                                                        return id;
                                                    })
                                                )}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="font-semibold text-sky-700 hover:underline dark:text-sky-400"
                                            >
                                                View
                                            </a>
                                        </td>
                                        {(queryData?.motif_entities || []).map((entity: string) => {
                                            let displayValue = result[entity].id;
                                            let titleValue = result[entity].id;

                                            // For Cypher queries, the id field contains JSON-serialized data
                                            // Try to parse and display it nicely
                                            if (typeof displayValue === "string") {
                                                try {
                                                    const parsed = JSON.parse(displayValue);
                                                    // If it's a simple value, display it directly
                                                    if (typeof parsed === "string" || typeof parsed === "number") {
                                                        displayValue = parsed.toString();
                                                    } else {
                                                        // For complex objects, show a truncated JSON representation
                                                        displayValue = JSON.stringify(parsed);
                                                        if (displayValue.length > 50) {
                                                            displayValue = displayValue.substring(0, 47) + "...";
                                                        }
                                                    }
                                                    titleValue = JSON.stringify(parsed, null, 2);
                                                } catch {
                                                    // If parsing fails, display as-is
                                                }
                                            }

                                            return (
                                                <td key={entity} className="max-w-xs truncate px-3 py-2.5 font-mono text-xs" title={titleValue}>
                                                    {displayValue}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={(queryData?.motif_entities?.length || 0) + 1}
                                        className="px-3 py-6 text-center text-slate-500"
                                    >
                                        No results
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {pageCount > 1 && (
                    <nav className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400" aria-label="Result pages">
                        <button
                            type="button"
                            className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                            disabled={page === 0}
                            onClick={() => setPage((current) => current - 1)}
                        >
                            Previous
                        </button>
                        <span aria-live="polite">
                            Page {page + 1} of {pageCount} ({pageStart + 1}-
                            {Math.min(pageStart + RESULTS_PER_PAGE, motifResults.length)} of {motifResults.length})
                        </span>
                        <button
                            type="button"
                            className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                            disabled={page === pageCount - 1}
                            onClick={() => setPage((current) => current + 1)}
                        >
                            Next
                        </button>
                    </nav>
                )}
            </div>
        </>
    );
}
