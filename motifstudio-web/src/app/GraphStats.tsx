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

    // Fetch graph statistics and attributes.
    // TODO: Perhaps these should all go in one combined query?
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

    // To handle the fact that the attributes are loaded asynchronously, we
    // provide a callback function to the parent component to share the
    // attributes when they are loaded.
    useEffect(() => {
        if (vertAttrData?.attributes) {
            onAttributesLoaded?.(vertAttrData.attributes);
        }
    }, [vertAttrData?.attributes, onAttributesLoaded]);

    // Use client-only check to avoid hydration mismatch
    if (!isClient) return <div>Loading...</div>;
    if (vertIsLoading || edgeIsLoading) return <div>Loading...</div>;
    if (vertError || edgeError) return <div>Error: {vertError}</div>;
    if (!vertData || !edgeData) return <div>No data</div>;

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
                Accept: format,
            },
            body: JSON.stringify({
                host_id: graph.id,
                format: format,
            }),
        })
            .then((res) => res.blob())
            .then((blob) => {
                // Create a URL for the blob and create a link to download it.
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${graph.name}.${format}`;
                a.click();
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

    // Render the attributes and statistics.
    return graph ? (
        <div className="flex w-full h-full p-4 bg-white rounded-lg shadow-lg dark:bg-gray-800">
            <div className="flex flex-col gap-2 w-full">
                <h2 className="text-xl font-mono w-full">Graph Properties for {graph.name}</h2>
                <hr className="my-2 w-full" />
                {/* A "table" showing nodes/edges/density */}
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

                {/* Vertex attributes list */}
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

                <hr className="my-2 w-full" />

                {/* Download graph buttons */}
                <h3 className="text-lg font-mono w-full">Download graph</h3>
                <div className="flex gap-2">
                    <button
                        onClick={() => downloadGraph("graphml")}
                        disabled={downloadingFormat !== null}
                        className={`font-bold rounded text-white px-4 py-2 flex items-center gap-2 ${
                            downloadingFormat === "graphml"
                                ? "bg-blue-400 cursor-not-allowed"
                                : "bg-blue-500 hover:bg-blue-700"
                        }`}
                    >
                        {downloadingFormat === "graphml" && (
                            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                            </svg>
                        )}
                        GraphML
                    </button>
                    <button
                        onClick={() => downloadGraph("gexf")}
                        disabled={downloadingFormat !== null}
                        className={`font-bold rounded text-white px-4 py-2 flex items-center gap-2 ${
                            downloadingFormat === "gexf"
                                ? "bg-blue-400 cursor-not-allowed"
                                : "bg-blue-500 hover:bg-blue-700"
                        }`}
                    >
                        {downloadingFormat === "gexf" && (
                            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                            </svg>
                        )}
                        GEXF
                    </button>
                </div>
            </div>
        </div>
    ) : (
        <div></div>
    );
}
