"use client";
import { useState } from "react";
import { useEffect } from "react";
import { HostListing } from "./api";
import { ResultsFetcher } from "./ResultsFetcher";

export function ResultsWrapper({
    graph,
    query,
    queryType,
}: {
    graph: HostListing | null;
    query: string;
    queryType: "dotmotif" | "cypher";
}) {
    // Trigger results fetch on button click
    const [trigger, setTrigger] = useState(false);
    const [limit, setLimit] = useState(1000);
    // When graph or query changes, reset trigger
    useEffect(() => {
        setTrigger(false);
    }, [graph, query, queryType]);

    return (
        <section aria-label="Query results" className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                <h2 className="text-lg font-semibold tracking-tight">Query results</h2>
            </div>
            {!trigger ? (
                <div className="flex flex-wrap items-end justify-between gap-4 p-5">
                    <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                        Result limit
                        <input
                            type="number"
                            min={1}
                            max={10000}
                            value={limit}
                            onChange={(event) => setLimit(Math.min(10000, Math.max(1, Number(event.target.value) || 1)))}
                            className="w-32 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-sky-950"
                        />
                    </label>
                    <button
                        className="rounded-lg bg-sky-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 dark:bg-sky-600 dark:hover:bg-sky-500"
                        onClick={() => setTrigger(true)}
                    >
                        Run Query <span aria-hidden="true" className="ml-2">→</span>
                    </button>
                </div>
            ) : null}
            {trigger ? (
                <div className="space-y-4 p-5">
                    <ResultsFetcher
                        key={`${graph?.id}:${query}:${queryType}`}
                        graph={graph}
                        query={query}
                        queryType={queryType}
                        limit={limit}
                    />
                </div>
            ) : null}
        </section>
    );
}
