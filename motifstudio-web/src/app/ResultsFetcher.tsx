"use client";
import useSWR from "swr";
import { HostListing, bodiedFetcher, BASE_URL, neuroglancerUrlFromHostVolumetricData } from "./api";
import { useDebounce } from "./useDebounce";
import { LoadingSpinner } from "./LoadingSpinner";

export function ResultsFetcher({
    graph,
    query,
    queryType,
}: {
    graph: HostListing | null;
    query: string;
    queryType: "dotmotif" | "cypher";
}) {
    const debouncedQuery = useDebounce(query, 500);

    const {
        data: queryData,
        error: queryError,
        isLoading: queryIsLoading,
    } = useSWR([`${BASE_URL}/queries/motifs`, graph?.id, debouncedQuery, queryType], () =>
        bodiedFetcher(`${BASE_URL}/queries/motifs`, {
            host_id: graph?.id,
            query: debouncedQuery,
            query_type: queryType,
        })
    );

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

    let motifCountString = "";
    if (queryData?.motif_count) {
        motifCountString = queryData.motif_count.toLocaleString();
    }

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
    function downloadResults(format: string): void {
        if (format === "json") {
            const blob = new Blob([JSON.stringify(queryData)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "motif_results.json";
            a.click();
        } else if (format === "csv") {
            const csv = queryData.motif_results.map((result: any) => {
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
                            } catch (e) {
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
            const blob = new Blob([csv.join("\n")], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "motif_results.csv";
            a.click();
        } else {
            console.error(`Unknown requested download format: ${format}`);
        }
    }

    return (
        <>
            <h2 className="text-xl font-mono w-full">Results</h2>
            <hr className="my-2 w-full" />
            <div className="flex flex-row gap-2 items-center">
                <div className="w-full">
                    <b>Result Count</b>
                </div>
                <div className="w-full">{motifCountString || "Error"}</div>
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
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold px-4 rounded"
                        onClick={() => downloadResults("json")}
                    >
                        JSON
                    </button>
                    <button
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold px-4 rounded"
                        onClick={() => downloadResults("csv")}
                    >
                        CSV
                    </button>
                </div>
            </div>
            <div className="flex flex-col gap-2 max-h-64 overflow-y-scroll">
                <table className="table-auto">
                    <thead className="border-b-2">
                        <tr className="border-b-2">
                            <th></th>
                            {queryData?.motif_entities ? (
                                queryData.motif_entities.map((entity: string, i: number) => (
                                    <th className="truncate text-left" key={i}>
                                        {entity}
                                    </th>
                                ))
                            ) : (
                                <div></div>
                            )}
                        </tr>
                    </thead>
                    <tbody className="border-b-2">
                        {queryData?.motif_results?.length ? (
                            queryData.motif_results.slice(0, 10000).map((result: any, i: number) => (
                                <tr key={i} className="border-b-2 hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <a
                                        href={neuroglancerUrlFromHostVolumetricData(
                                            queryData?.host_volumetric_data?.uri,
                                            queryData?.host_volumetric_data?.other_channels || [],
                                            Object.values(result).map((v: any) => {
                                                let id = v?.__segmentation_id__ || v.id;
                                                // For JSON-serialized values, try to parse them
                                                if (typeof id === "string") {
                                                    try {
                                                        const parsed = JSON.parse(id);
                                                        return parsed;
                                                    } catch (e) {
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
                                    {queryData?.motif_entities ? (
                                        queryData.motif_entities.map((entity: string, j: number) => {
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
                                                } catch (e) {
                                                    // If parsing fails, display as-is
                                                    displayValue = displayValue;
                                                }
                                            }

                                            return (
                                                <td key={j} className="truncate max-w-xs" title={titleValue}>
                                                    {displayValue}
                                                </td>
                                            );
                                        })
                                    ) : (
                                        <div></div>
                                    )}
                                </tr>
                            ))
                        ) : (
                            <div>
                                {queryData?.error ? (
                                    <div className="text-red-500">{errorText.toString()}</div>
                                ) : (
                                    <div>No results</div>
                                )}
                            </div>
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );
}
