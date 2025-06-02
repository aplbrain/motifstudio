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
    // When graph or query changes, reset trigger
    useEffect(() => {
        setTrigger(false);
    }, [graph, query, queryType]);

    return (
        <div className="flex flex-col gap-2 w-full h-full p-4 bg-white rounded-lg shadow-lg dark:bg-gray-800">
            {!trigger ? (
                <button
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    onClick={() => setTrigger(!trigger)}
                >
                    Run Query
                </button>
            ) : null}
            {trigger ? <ResultsFetcher graph={graph} query={query} queryType={queryType} /> : null}
        </div>
    );
}
