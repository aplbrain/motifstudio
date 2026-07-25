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
        <div className="flex flex-col gap-2 w-full h-full p-4 bg-white rounded-lg shadow-lg dark:bg-gray-800">
            {!trigger ? (
                <div className="flex items-end gap-3">
                    <label className="flex flex-col gap-1 text-sm font-medium dark:text-gray-200">
                        Result limit
                        <input
                            type="number"
                            min={1}
                            max={10000}
                            value={limit}
                            onChange={(event) => setLimit(Math.min(10000, Math.max(1, Number(event.target.value) || 1)))}
                            className="w-32 rounded border border-gray-300 px-3 py-2 dark:bg-gray-900 dark:border-gray-600"
                        />
                    </label>
                    <button
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        onClick={() => setTrigger(true)}
                    >
                        Run Query
                    </button>
                </div>
            ) : null}
            {trigger ? (
                <ResultsFetcher
                    key={`${graph?.id}:${query}:${queryType}`}
                    graph={graph}
                    query={query}
                    queryType={queryType}
                    limit={limit}
                />
            ) : null}
        </div>
    );
}
