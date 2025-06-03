"use client";

import { useState, useEffect } from "react";

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
    const { host_id, motif, host_name, query_type } =
        typeof window !== "undefined"
            ? getQueryParams()
            : { host_id: "", motif: "", host_name: "", query_type: "dotmotif" };
    const [currentGraph, setCurrentGraph] = useState<HostListing | undefined>(
        host_id && host_name
            ? {
                  id: host_id,
                  name: host_name,
                  uri: "",
                  provider: {},
              }
            : undefined
    );
    const [queryText, setQueryText] = useState(motif || "");
    const [queryType, setQueryType] = useState<"dotmotif" | "cypher">(
        (query_type as "dotmotif" | "cypher") || "dotmotif"
    );
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

    function updateQueryType(type: "dotmotif" | "cypher") {
        setQueryType(type);
        if (typeof window !== "undefined") {
            updateQueryParams({ query_type: type });
        }
    }

    function handleLoad(data: { queryText: string; graph?: HostListing; queryType?: "dotmotif" | "cypher" }) {
        // Update query text directly
        setQueryText(data.queryText);

        // Update query type if provided
        if (data.queryType) {
            setQueryType(data.queryType);
        }

        // Update graph selection directly
        if (data.graph) {
            setCurrentGraph(data.graph);
        } else {
            setCurrentGraph(undefined);
        }

        // Update URL parameters without triggering loops
        if (typeof window !== "undefined") {
            updateQueryParams({
                motif: data.queryText,
                host_id: data.graph?.id || "",
                host_name: data.graph?.name || "",
                query_type: data.queryType || queryType,
            });
        }
    }

    function handleInsertPrimitive(dotmotif: string) {
        // Append the primitive to the current query text
        const newQueryText = queryText ? `${queryText}\n\n${dotmotif}` : dotmotif;
        updateMotifTest(newQueryText);
    }

    return (
        <main className="flex min-h-screen flex-col items-center">
            <Appbar
                queryText={queryText}
                currentGraph={currentGraph}
                onLoad={handleLoad}
                onInsertPrimitive={handleInsertPrimitive}
            />
            <div className="w-full justify-between text-sm lg:flex flex-row px-4 gap-4">
                <div className="flex flex-col justify-center w-full h-full p-4 gap-4">
                    <div className="bg-white rounded-lg shadow-lg pt-1 dark:bg-gray-800">
                        <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-medium dark:text-gray-200">Query Editor</h3>
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-medium dark:text-gray-200">Language:</label>
                                <select
                                    value={queryType}
                                    onChange={(e) => updateQueryType(e.target.value as "dotmotif" | "cypher")}
                                    className="px-3 py-1 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent dark:bg-gray-900 dark:text-gray-200"
                                >
                                    <option value="dotmotif">DotMotif</option>
                                    <option value="cypher">Cypher</option>
                                </select>
                            </div>
                        </div>
                        <WrappedEditor
                            startValue={queryText}
                            queryType={queryType}
                            entityNames={currentGraph ? Object.keys(entities) : undefined}
                            onChange={(value) => updateMotifTest(value || "")}
                        />
                    </div>
                    <GraphForm startValue={currentGraph} onGraphChange={setSelectedGraph} />
                </div>
                <div className="div flex w-full flex-col py-4 gap-4">
                    {motif && queryType === "dotmotif" ? (
                        <MotifVisualizer
                            motifSource={motif}
                            // graph={currentGraph}
                            // entities={entities}
                        />
                    ) : null}
                    {currentGraph ? <GraphStats graph={currentGraph} onAttributesLoaded={setEntities} /> : null}
                    {currentGraph ? (
                        <ResultsWrapper graph={currentGraph} query={queryText} queryType={queryType} />
                    ) : null}
                </div>
            </div>
        </main>
    );
}
