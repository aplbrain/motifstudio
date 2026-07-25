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
    const controller = useRef<AbortController | null>(null);
    const [page, setPage] = useState(0);

    useEffect(() => {
        return () => controller.current?.abort();
    }, []);

    useEffect(() => {
        setPage(0);
    }, [graph?.id, debouncedQuery, queryType, limit]);

    const {
        data: queryData,
        error: queryError,
        isLoading: queryIsLoading,
    } = useSWR([`${BASE_URL}/queries/motifs`, graph?.id, debouncedQuery, queryType, limit], async () => {
        controller.current?.abort();
        const requestController = new AbortController();
        controller.current = requestController;
        return bodiedFetcher(
            `${BASE_URL}/queries/motifs`,
            {
                host_id: graph?.id,
                query: debouncedQuery,
                query_type: queryType,
                limit,
            },
            { signal: requestController.signal }
        );
    });

    if (queryIsLoading) return <LoadingSpinner />;

    // If there was a fetching error, show it to the user
    if (queryError) {
        const msg = queryError instanceof Error ? queryError.message : String(queryError);
        return <div className="text-red-500 p-4">Error fetching query: {msg}</div>;
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
            <h2 className="text-xl font-mono w-full">Results</h2>
            <hr className="my-2 w-full" />
            <div className="flex flex-row gap-2 items-center">
                <div className="w-full">
                    <b>Result Count</b>
                </div>
                <div className="w-full">{motifCountString ?? "Error"}</div>
            </div>
            <div className="flex flex-row gap-2 items-center">
                <div className="w-full">
                    <b>Query Duration</b>
                </div>
                <div className="w-full">
                    {queryData?.response_duration_ms ? (
                        <span>{durationString}</span>
                    ) : (
                        <span className="text-red-500">Error</span>
                    )}
                </div>
            </div>
            <div className="flex flex-row gap-2 items-center">
                <div className="w-full">
                    <b>Entities</b>
                </div>
                <div className="w-full">
                    {(queryData?.motif_entities || []).map((e: string) => {
                        return (
                            <span
                                key={e}
                                className="px-2 py-1 bg-blue-100 rounded-md shadow-sm text-sm font-medium text-blue-800 mr-2"
                            >
                                {e}
                            </span>
                        );
                    })}
                </div>
            </div>
            <div className="flex flex-row gap-2 items-center">
                <div className="w-full">
                    <b>Download</b>
                </div>
                <div className="w-full flex gap-2">
                    <button
                        type="button"
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold px-4 rounded"
                        onClick={() => downloadResults("json")}
                    >
                        JSON
                    </button>
                    <button
                        type="button"
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold px-4 rounded"
                        onClick={() => downloadResults("csv")}
                    >
                        CSV
                    </button>
                </div>
            </div>
            <div className="flex flex-col gap-2">
                <div className="max-h-64 overflow-auto">
                    <table className="table-auto w-full">
                        <caption className="sr-only">Motif query results</caption>
                        <thead className="border-b-2">
                            <tr className="border-b-2">
                                <th scope="col" className="text-left">
                                    Visualization
                                </th>
                                {(queryData?.motif_entities || []).map((entity: string) => (
                                    <th scope="col" className="truncate text-left" key={entity}>
                                        {entity}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="border-b-2">
                            {pageResults.length ? (
                                pageResults.map((result: any, i: number) => (
                                    <tr
                                        key={pageStart + i}
                                        className="border-b-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                        <td>
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
                                            >
                                                <b>View</b>
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
                                                <td key={entity} className="truncate max-w-xs" title={titleValue}>
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
                                        className="py-4 text-center"
                                    >
                                        No results
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {pageCount > 1 && (
                    <nav className="flex items-center justify-between gap-4" aria-label="Result pages">
                        <button
                            type="button"
                            className="rounded bg-blue-500 px-3 py-1 font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
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
                            className="rounded bg-blue-500 px-3 py-1 font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
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
