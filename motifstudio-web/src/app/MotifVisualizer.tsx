import CytoscapeComponent from "react-cytoscapejs";

export const MotifVisualizer = ({
    motifSource,
    graph,
    entities,
}: {
    motifSource: string;
    graph: any;
    entities: { [key: string]: string };
}) => {
    // Construct the motif graph:
    console.log(motifSource);
    return (
        <CytoscapeComponent
            elements={[
                {
                    data: {
                        id: "motif",
                        label: "hi",
                    },
                    position: { x: 100, y: 100 },
                    classes: ["motif"],
                },
            ]}
            style={{ width: "600px", height: "600px" }}
        />
    );
};
