"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

import { Appbar } from "./Appbar";
import { GraphForm } from "./GraphForm";
import { HostListing } from "./api";
import { GraphStats } from "./GraphStats";
import { ResultsWrapper } from "./ResultsWrapper";
import { getQueryParams, updateQueryParams } from "./queryparams";
import { useDebounce } from "./useDebounce";

const WrappedEditor = dynamic(() => import("./WrappedEditor").then((module) => module.WrappedEditor), {
    ssr: false,
    loading: () => <div className="h-[420px] animate-pulse bg-slate-100 dark:bg-slate-800" aria-label="Loading editor" />,
});

const MotifVisualizer = dynamic(() => import("./MotifVisualizer").then((module) => module.MotifVisualizer), {
    ssr: false,
    loading: () => (
        <div className="h-[320px] animate-pulse bg-slate-100 dark:bg-slate-800" aria-label="Loading motif visualization" />
    ),
});

/**
 * The main page of the application.
 *
 * This component is the main entry point for the application, and it contains
 * the main layout of the application. It is responsible for managing the state
 * of the graph, the motif query, and the entities in the graph.
 */
export default function Home() {
    // URL parameters are only available in the browser. Start from the same
    // state on the server and client, then restore a shared link after React
    // has hydrated the page.
    const [currentGraph, setCurrentGraph] = useState<HostListing | undefined>();
    const [queryText, setQueryText] = useState("");
    const debouncedQueryText = useDebounce(queryText, 500);
    const [queryType, setQueryType] = useState<"dotmotif" | "cypher">("dotmotif");
    const [entities, setEntities] = useState<{ [key: string]: string }>({});
    const [hasLoadedQueryParams, setHasLoadedQueryParams] = useState(false);

    useEffect(() => {
        const { host_id, motif, host_name, query_type } = getQueryParams();

        setCurrentGraph(
            host_id && host_name
                ? {
                      id: host_id,
                      name: host_name,
                      uri: "",
                      provider: {},
                  }
                : undefined
        );
        setQueryText(motif);
        setQueryType((query_type as "dotmotif" | "cypher") || "dotmotif");
        setHasLoadedQueryParams(true);
    }, []);

    useEffect(() => {
        // On the first client render, the debounced value still reflects the
        // empty SSR state. Wait until it catches up before writing the URL.
        if (!hasLoadedQueryParams || debouncedQueryText !== queryText) return;

        updateQueryParams({ motif: debouncedQueryText });
    }, [debouncedQueryText, hasLoadedQueryParams, queryText]);

    function setSelectedGraph(graph: HostListing) {
        setCurrentGraph(graph);
        if (typeof window !== "undefined") {
            updateQueryParams({ host_id: graph.id, host_name: graph.name });
        }
    }

    function updateMotifTest(value: string) {
        setQueryText(value);
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
        <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
            <Appbar
                queryText={queryText}
                queryType={queryType}
                currentGraph={currentGraph}
                onLoad={handleLoad}
                onInsertPrimitive={handleInsertPrimitive}
            />
            <div className="mx-auto w-full max-w-[1600px] px-4 pb-12 pt-8 sm:px-6 lg:px-8">
                <section aria-label="Host graph selection" className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <h2 className="text-lg font-semibold tracking-tight">Host graph</h2>
                        {currentGraph ? (
                            <span className="inline-flex max-w-full items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                                <span className="truncate">{currentGraph.name}</span>
                            </span>
                        ) : (
                            <span className="text-xs text-slate-400">Select a graph to run queries</span>
                        )}
                    </div>
                    <GraphForm startValue={currentGraph} onGraphChange={setSelectedGraph} />
                </section>

                <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(360px,0.8fr)]">
                    <div className="contents xl:flex xl:min-w-0 xl:flex-col xl:gap-5">
                        <section aria-label="Query editor" className="order-1 min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                                <h2 className="text-lg font-semibold tracking-tight">Query editor</h2>
                                <label className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                                    Language
                                    <select
                                        value={queryType}
                                        onChange={(e) => updateQueryType(e.target.value as "dotmotif" | "cypher")}
                                        className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-sky-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                    >
                                        <option value="dotmotif">DotMotif</option>
                                        <option value="cypher">Cypher</option>
                                    </select>
                                </label>
                            </div>
                            <div className="pt-3">
                                <WrappedEditor
                                    startValue={queryText}
                                    queryType={queryType}
                                    entityNames={currentGraph ? Object.keys(entities) : undefined}
                                    onChange={(value) => updateMotifTest(value || "")}
                                />
                            </div>
                        </section>
                        <div className="order-3 min-w-0">
                            {currentGraph ? (
                                <ResultsWrapper graph={currentGraph} query={queryText} queryType={queryType} />
                            ) : (
                                <section className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-5 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
                                    Choose a host graph above to run your query.
                                </section>
                            )}
                        </div>
                    </div>
                    <aside className="contents xl:flex xl:min-w-0 xl:flex-col xl:gap-5" aria-label="Query context">
                        <section className="order-2 min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                                <h2 className="text-lg font-semibold tracking-tight">Motif preview</h2>
                                <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                                    {queryType === "dotmotif" ? "DotMotif" : "Cypher"}
                                </span>
                            </div>
                            <div className="motif-preview relative h-[320px] overflow-hidden">
                                {queryText && queryType === "dotmotif" ? (
                                    <MotifVisualizer motifSource={queryText} />
                                ) : (
                                    <div className="flex h-full items-center justify-center px-8 text-center text-sm text-slate-500 dark:text-slate-400">
                                        {queryType === "cypher"
                                            ? "Visual preview is available for DotMotif queries."
                                            : "Write a DotMotif query to preview its structure."}
                                    </div>
                                )}
                            </div>
                            {queryText && queryType === "dotmotif" ? (
                                <div className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                                    Drag to pan · Scroll to zoom
                                </div>
                            ) : null}
                        </section>
                        {currentGraph ? (
                            <div className="order-4 min-w-0">
                                <GraphStats graph={currentGraph} onAttributesLoaded={setEntities} />
                            </div>
                        ) : null}
                    </aside>
                </div>
            </div>
        </main>
    );
}
