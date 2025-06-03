import Cytoscape from "cytoscape";
import CytoscapeComponent from "react-cytoscapejs";
import COSEBilkent from "cytoscape-cose-bilkent";
import { useThrottle } from "./useDebounce";
import useSWR from "swr";
import { BASE_URL, bodiedFetcher } from "./api";
import { useRef } from "react";
import ColorHash from "color-hash";
import { getQueryParams } from "./queryparams";

Cytoscape.use(COSEBilkent);

export const MotifVisualizer = ({ motifSource }: { motifSource: string }) => {
    // All React hooks must be called before any conditional returns
    const debouncedQuery = useThrottle(motifSource, 1000);
    let elements = useRef<any[]>([]);

    // Get query type from URL parameters
    const { query_type } = typeof window !== "undefined" ? getQueryParams() : { query_type: "dotmotif" };

    const colorhash = new ColorHash({
        lightness: 0.5,
    });

    function hexHash(item: { id?: string }, opts = { seed: 0, without: [] }) {
        const nodeWithoutID = { ...item, __seed: opts.seed };
        delete nodeWithoutID.id;
        opts.without.forEach((key) => {
            delete (nodeWithoutID as any)[key];
        });
        return colorhash.hex(JSON.stringify(nodeWithoutID));
    }

    const {
        data: queryData,
        error: queryError,
        isLoading: queryIsLoading,
    } = useSWR(
        [`${BASE_URL}/queries/motifs/_parse`, "", debouncedQuery],
        () => bodiedFetcher(`${BASE_URL}/queries/motifs/_parse`, { host_id: "", query: debouncedQuery, query_type }),
        {
            onSuccess: (data) => {
                // Construct the motif graph:
                const motifGraph = JSON.parse(data?.motif_nodelink_json || "{}");
                elements.current = [
                    ...(motifGraph?.nodes || []).map((node: any) => {
                        return {
                            data: {
                                ...node,
                                label: node.id,
                                color: hexHash(node),
                            },
                        };
                    }),
                    ...(motifGraph?.links || []).map((link: any) => {
                        return {
                            data: {
                                ...link,
                                color: link.exists ? hexHash(link, { without: ["source", "target"] }) : "#fcc",
                            },
                            directed: true,
                        };
                    }),
                ];
            },
        }
    );

    // If it's a Cypher query, show a message that visualization is not supported
    if (query_type === "cypher") {
        return (
            <div className="flex flex-col items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="text-center">
                    <div className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Cypher Query Visualization
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        Visualization is not available for Cypher queries.
                        <br />
                        Cypher queries can return arbitrary data structures that cannot be displayed as traditional
                        motif graphs.
                    </div>
                </div>
            </div>
        );
    }

    if (queryError) {
        return <div>Error loading motif</div>;
    }

    if (queryIsLoading) {
        return <div>Loading...</div>;
    }

    if (!queryData) {
        return <div>No motif data</div>;
    }

    return (
        <CytoscapeComponent
            layout={{
                name: "cose-bilkent",
                animate: false,
            }}
            elements={[...elements.current]}
            style={{ width: "100%", height: "100%", minHeight: "400px" }}
            stylesheet={[
                {
                    selector: "node",
                    style: {
                        label: "data(label)",
                        "text-valign": "center",
                        "text-halign": "center",
                        "background-color": "data(color)",
                        color: "white",
                        "text-outline-width": 1,
                        "text-outline-color": "#11479e",
                        shape: "roundrectangle",
                        width: "label",
                        height: "label",
                        // Margin:
                        padding: "4",
                    },
                },
                {
                    selector: "edge",
                    style: {
                        "curve-style": "bezier",
                        "target-arrow-shape": "triangle",
                        "target-arrow-color": "#9dbaea",
                        // "line-color": "#9dbaea",
                        "line-color": "data(color)",
                        "text-outline-width": 2,
                        "text-outline-color": "#9dbaea",
                        "font-size": "10px",
                        label: "data(label)",
                    },
                },
            ]}
        />
    );
};
