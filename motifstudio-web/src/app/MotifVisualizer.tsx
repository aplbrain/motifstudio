import Cytoscape from "cytoscape";
import CytoscapeComponent from "react-cytoscapejs";
import COSEBilkent from "cytoscape-cose-bilkent";
import { useThrottle } from "./useDebounce";
import useSWR from "swr";
import { BASE_URL, bodiedFetcher } from "./api";
import { useEffect, useRef } from "react";

Cytoscape.use(COSEBilkent);

export const MotifVisualizer = ({
    motifSource,
}: // graph,
// entities,
{
    motifSource: string;
    // graph: any;
    // entities: { [key: string]: string };
}) => {
    // Construct the motif graph:
    // console.log(motifSource);
    const debouncedQuery = useThrottle(motifSource, 100);
    let elements = useRef([]);

    const {
        data: queryData,
        error: queryError,
        isLoading: queryIsLoading,
    } = useSWR([`${BASE_URL}/queries/motifs/_parse`, "", debouncedQuery], () =>
        bodiedFetcher(`${BASE_URL}/queries/motifs/_parse`, { host_id: "", query: debouncedQuery })
    );

    useEffect(() => {
        // Construct the motif graph:
        // console.log(JSON.parse(queryData?.motif_nodelink_json));
        const motifGraph = JSON.parse(queryData?.motif_nodelink_json || "{}");
        elements.current = [
            ...(motifGraph?.nodes || []).map((node) => {
                return {
                    data: { ...node, label: node.id },
                    // position: { x: 0, y: 100 },
                };
            }),
            ...(motifGraph?.links || []).map((link) => {
                return { data: { ...link } };
            }),
        ];
    });

    if (queryError) {
        return <div>Error loading motif</div>;
    }

    if (queryIsLoading) {
        return <div>Loading motif...</div>;
    }

    if (!queryData) {
        return <div>No motif data</div>;
    }

    return (
        <CytoscapeComponent
            cy={(cy) =>
                cy.on("add", "node", (_evt) => {
                    cy.layout({
                        name: "cose-bilkent",
                        animate: false,
                    }).run();
                    cy.fit();
                })
            }
            elements={[...elements.current]}
            style={{ width: "100%", height: "100%", minHeight: "400px" }}
        />
    );
};
