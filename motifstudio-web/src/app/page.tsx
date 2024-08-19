"use client";

import { useState } from "react";

import { Appbar } from "./Appbar";
import { GraphForm } from "./GraphForm";
import { WrappedEditor } from "./WrappedEditor";
import { HostListing } from "./api";
import { GraphStats } from "./GraphStats";
import { ResultsWrapper } from "./ResultsWrapper";
import { getQueryParams, updateQueryParams } from "./queryparams";
import { MotifVisualizer } from "./MotifVisualizer";

/**
 * The main page of the application.
 *
 * This component is the main entry point for the application, and it contains
 * the main layout of the application. It is responsible for managing the state
 * of the graph, the motif query, and the entities in the graph.
 */
export default function Home() {
    const { host_id, motif, host_name } =
        typeof window !== "undefined" ? getQueryParams() : { host_id: "", motif: "", host_name: "" };
    const [currentGraph, setCurrentGraph] = useState<HostListing | undefined>({
        id: host_id || "",
        name: host_name || "",
    });
    const [queryText, setQueryText] = useState(motif || "");
    const [entities, setEntities] = useState<{ [key: string]: string }>({});

    function setSelectedGraph(graph: HostListing) {
        setCurrentGraph(graph);
        if (typeof window !== "undefined") {
            updateQueryParams({ host_id: graph.id, host_name: graph.name });
        }
    }

    function updateMotifTest(value: string) {
        setQueryText(value);
        if (typeof window !== "undefined") {
            updateQueryParams({ motif: value });
        }
    }

    return (
        <main className="flex min-h-screen flex-col items-center">
            <Appbar />
            <div className="w-full justify-between text-sm lg:flex flex-row px-4 gap-4">
                <div className="flex flex-col justify-center w-full h-full p-4 gap-4">
                    <div className="bg-white rounded-lg shadow-lg pt-1">
                        <WrappedEditor
                            startValue={queryText}
                            entityNames={currentGraph ? Object.keys(entities) : undefined}
                            onChange={(value) => updateMotifTest(value || "")}
                        />
                    </div>
                    <GraphForm startValue={currentGraph} onGraphChange={setSelectedGraph} />
                </div>
                <div className="div flex w-full flex-col py-4 gap-4">
                    {motif ? <MotifVisualizer motifSource={motif} graph={currentGraph} entities={entities} /> : null}
                    {currentGraph ? <GraphStats graph={currentGraph} onAttributesLoaded={setEntities} /> : null}
                    {currentGraph ? <ResultsWrapper graph={currentGraph} query={queryText} /> : null}
                </div>
            </div>
        </main>
    );
}
