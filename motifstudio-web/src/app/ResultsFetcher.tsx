"use client";
import useSWR from "swr";
import { HostListing, bodiedFetcher, BASE_URL, neuroglancerUrlFromHostVolumetricData } from "./api";
import { useDebounce } from "./useDebounce";
import { LoadingSpinner } from "./LoadingSpinner";

export function ResultsFetcher({ graph, query }: { graph: HostListing | null; query: string }) {
    const debouncedQuery = useDebounce(query, 500);

    const {
        data: queryData,
        error: queryError,
        isLoading: queryIsLoading,
    } = useSWR([`${BASE_URL}/queries/motifs`, graph?.id, debouncedQuery], () =>
        bodiedFetcher(`${BASE_URL}/queries/motifs`, { host_id: graph?.id, query: debouncedQuery })
    );

    if (queryIsLoading) return <LoadingSpinner />;

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

    let motifCountString = "";
    if (queryData?.motif_count) {
        motifCountString = queryData.motif_count.toLocaleString();
    }

    function downloadResults(format: string) {
        if (format === "json") {
            const blob = new Blob([JSON.stringify(queryData)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "motif_results.json";
            a.click();
        } else if (format === "csv") {
            const csv = queryData.motif_results.map((result: any) => {
                return queryData.motif_entities.map((entity: string) => result[entity].id).join(",");
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
                        className="bg-blue-500  hover:bg-blue-700 text-white font-bold px-4 rounded"
                        onClick={() => downloadResults("json")}
                    >
                        JSON
                    </button>
                    <button
                        className="bg-blue-500  hover:bg-blue-700 text-white font-bold px-4 rounded"
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
                                <tr key={i} className="border-b-2 hover:bg-gray-100">
                                    <a
                                        href={neuroglancerUrlFromHostVolumetricData(
                                            queryData?.host_volumetric_data?.uri,
                                            queryData?.host_volumetric_data?.other_channels || [],
                                            Object.values(result).map((v: any) => v?.__segmentation_id__ || v.id)
                                        )}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        <b>View</b>
                                    </a>
                                    {queryData?.motif_entities ? (
                                        queryData.motif_entities.map((entity: string, j: number) => (
                                            <td key={j} className="truncate max-w-xs" title={result[entity].id}>
                                                {result[entity].id}
                                            </td>
                                        ))
                                    ) : (
                                        <div></div>
                                    )}
                                </tr>
                            ))
                        ) : (
                            <div>
                                {queryData?.error ? (
                                    <div className="text-red-500">{errorText}</div>
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
