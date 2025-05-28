import Cytoscape from "cytoscape";
import CytoscapeComponent from "react-cytoscapejs";
import COSEBilkent from "cytoscape-cose-bilkent";
import { useThrottle } from "./useDebounce";
import useSWR from "swr";
import { BASE_URL, bodiedFetcher } from "./api";
import { useRef } from "react";
import ColorHash from "color-hash";

Cytoscape.use(COSEBilkent);

export const MotifVisualizer = ({ motifSource }: { motifSource: string }) => {
    // Construct the motif graph:
    const debouncedQuery = useThrottle(motifSource, 1000);
    let elements = useRef([]);

    const colorhash = new ColorHash({
        lightness: 0.5,
    });

    function hexHash(item: { id?: string }, opts = { seed: 0, without: [] }) {
        const nodeWithoutID = { ...item, __seed: opts.seed };
        delete nodeWithoutID.id;
        opts.without.forEach((key) => {
            delete nodeWithoutID[key];
        });
        return colorhash.hex(JSON.stringify(nodeWithoutID));
    }

    const {
        data: queryData,
        error: queryError,
        isLoading: queryIsLoading,
    } = useSWR(
        [`${BASE_URL}/queries/motifs/_parse`, "", debouncedQuery],
        () => bodiedFetcher(`${BASE_URL}/queries/motifs/_parse`, { host_id: "", query: debouncedQuery }),
        {
            onSuccess: (data) => {
                // Construct the motif graph:
                const motifGraph = JSON.parse(data?.motif_nodelink_json || "{}");
                elements.current = [
                    ...(motifGraph?.nodes || []).map((node) => {
                        return {
                            data: {
                                ...node,
                                label: node.id,
                                color: hexHash(node),
                            },
                        };
                    }),
                    ...(motifGraph?.links || []).map((link) => {
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
