"use client";
import { useState } from "react";
import { useEffect } from "react";
import { Appbar } from "./Appbar";
import { GraphForm } from "./GraphForm";
import { WrappedEditor } from "./WrappedEditor";
import useSWR from "swr";
import { HostListing, bodiedFetcher, BASE_URL } from "./api";

function GraphStats({
    graph,
    onAttributesLoaded,
}: {
    graph: HostListing;
    onAttributesLoaded?: (attributes: { [key: string]: string }) => void;
}) {
    const {
        data: vertData,
        error: vertError,
        isLoading: vertIsLoading,
    } = useSWR<{ vertex_count: number }>([`${BASE_URL}/queries/vertices/count`, graph?.id], () =>
        bodiedFetcher(`${BASE_URL}/queries/vertices/count`, {
            host_id: graph?.id,
        })
    );
    const {
        data: edgeData,
        error: edgeError,
        isLoading: edgeIsLoading,
    } = useSWR<{ edge_count: number }>([`${BASE_URL}/queries/edges/count`, graph?.id], () =>
        bodiedFetcher(`${BASE_URL}/queries/edges/count`, {
            host_id: graph?.id,
        })
    );
    const {
        data: vertAttrData,
        error: vertAttrError,
        isLoading: vertAttrIsLoading,
    } = useSWR<{
        attributes: { [key: string]: string };
    }>([`${BASE_URL}/queries/vertices/attributes`, graph?.id], () =>
        bodiedFetcher(`${BASE_URL}/queries/vertices/attributes`, {
            host_id: graph?.id,
        })
    );

    useEffect(() => {
        if (vertAttrData?.attributes) {
            onAttributesLoaded?.(vertAttrData.attributes);
        }
    }, [vertAttrData?.attributes, onAttributesLoaded]);

    if (vertIsLoading || edgeIsLoading) return <div>Loading...</div>;
    if (vertError || edgeError) return <div>Error: {vertError}</div>;
    if (!vertData || !edgeData) return <div>No data</div>;

    return graph ? (
        <div className="flex w-full h-full p-4 bg-white rounded-lg shadow-lg">
            <div className="flex flex-col gap-2 w-full">
                <h2 className="text-xl font-mono w-full">Graph Properties for {graph.name}</h2>
                <hr className="my-2 w-full" />
                <div className="flex flex-col gap-2">
                    <div className="flex flex-row gap-2 items-center">
                        <div className="w-1/2">
                            <b>Nodes</b>
                        </div>
                        <div className="w-1/2">{vertData?.vertex_count}</div>
                    </div>
                    <div className="flex flex-row gap-2 items-center">
                        <div className="w-1/2">
                            <b>Edges</b>
                        </div>
                        <div className="w-1/2">{edgeData?.edge_count}</div>
                    </div>
                    <div className="flex flex-row gap-2 items-center">
                        <div className="w-1/2">
                            <b>Density</b>
                        </div>
                        <div className="w-1/2">
                            {((edgeData?.edge_count || 0) / Math.pow(vertData?.vertex_count || 0, 2)).toFixed(6)}
                        </div>
                    </div>
                </div>
                <hr className="my-2 w-full" />
                <h3 className="text-lg font-mono w-full">Vertex Attributes</h3>
                <div className="flex gap-2">
                    {vertAttrData?.attributes
                        ? Object.entries(vertAttrData?.attributes).map(([key, value]) => (
                              <span
                                  key={key}
                                  className="px-2 py-1 bg-blue-50 rounded-md shadow-sm text-sm font-medium text-blue-800"
                              >
                                  {key} <b className="font-mono">({value})</b>
                              </span>
                          ))
                        : null}
                </div>
            </div>
        </div>
    ) : (
        <div></div>
    );
}

function useDebounce(value: any, delay: number) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

function ResultsWrapper({ graph, query }: { graph: HostListing | null; query: string }) {
    // Trigger results fetch on button click
    const [trigger, setTrigger] = useState(false);
    // When graph or query changes, reset trigger
    useEffect(() => {
        setTrigger(false);
    }, [graph, query]);

    return (
        <div className="flex flex-col gap-2 w-full h-full p-4 bg-white rounded-lg shadow-lg">
            {!trigger ? (
                <button
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    onClick={() => setTrigger(!trigger)}
                >
                    Run Query
                </button>
            ) : null}
            {trigger ? <ResultsFetcher graph={graph} query={query} /> : null}
        </div>
    );
}
function ResultsFetcher({ graph, query }: { graph: HostListing | null; query: string }) {
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
            <div className="flex flex-col gap-2 max-h-64 overflow-y-scroll">
                <table className="table-auto">
                    <thead className="border-b-2">
                        <tr className="border-b-2">
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
                                    {queryData?.motif_entities ? (
                                        queryData.motif_entities.map((entity: string, j: number) => (
                                            <td key={j} className="truncate max-w-xs" title={result[entity]}>
                                                {result[entity]}
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

function LoadingSpinner() {
    return (
        <div className="flex flex-col items-center justify-center">
            <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
            >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
        </div>
    );
}

export default function Home() {
    const [currentGraph, setCurrentGraph] = useState<HostListing | null>();
    const [queryText, setQueryText] = useState("");
    const [entities, setEntities] = useState<{ [key: string]: string }>({});
    return (
        <main className="flex min-h-screen flex-col items-center">
            <Appbar />
            <div className="w-full justify-between text-sm lg:flex flex-row px-4 gap-4">
                <div className="flex flex-col justify-center w-full h-full p-4 gap-4">
                    <div className="bg-white rounded-lg shadow-lg pt-1">
                        <WrappedEditor
                            entityNames={currentGraph ? Object.keys(entities) : undefined}
                            onChange={(value) => setQueryText(value || "")}
                        />
                    </div>
                    <GraphForm onGraphChange={setCurrentGraph} />
                </div>
                <div className="div flex w-full flex-col py-4 gap-4">
                    {currentGraph ? <GraphStats graph={currentGraph} onAttributesLoaded={setEntities} /> : null}
                    {currentGraph ? <ResultsWrapper graph={currentGraph} query={queryText} /> : null}
                </div>
            </div>
        </main>
    );
}
