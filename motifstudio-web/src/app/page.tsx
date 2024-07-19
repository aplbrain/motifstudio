"use client";
import { useEffect, useState } from "react";

import { Appbar } from "./Appbar";
import { GraphForm } from "./GraphForm";
import { WrappedEditor } from "./WrappedEditor";
import { HostListing } from "./api";
import { GraphStats } from "./GraphStats";
import { ResultsWrapper } from "./ResultsWrapper";

function getQueryParams() {
    const search = window.location.search;
    const params = new URLSearchParams(search);
    return {
        host_id: decodeURIComponent(params.get("host_id") || ""),
        host_name: decodeURIComponent(params.get("host_name") || ""),
        motif: decodeURIComponent(params.get("motif") || ""),
    };
}

function updateQueryParams(params: { [key: string]: string }) {
    const search = new URLSearchParams(window.location.search);
    for (const key in params) {
        // URL-encode each value:
        search.set(key, encodeURIComponent(params[key]));
    }
    window.history.replaceState({}, "", `${window.location.pathname}?${search}`);
}

export default function Home() {
    const { host_id, motif, host_name } = getQueryParams();
    const [currentGraph, setCurrentGraph] = useState<HostListing | null>({
        id: host_id || "",
        name: host_name || "",
    });
    const [queryText, setQueryText] = useState(motif || "");
    const [entities, setEntities] = useState<{ [key: string]: string }>({});

    function setSelectedGraph(graph: HostListing) {
        setCurrentGraph(graph);
        updateQueryParams({ host_id: graph.id, host_name: graph.name });
    }

    function updateMotifTest(value: string) {
        setQueryText(value);
        updateQueryParams({ motif: value });
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
                    {currentGraph ? <GraphStats graph={currentGraph} onAttributesLoaded={setEntities} /> : null}
                    {currentGraph ? <ResultsWrapper graph={currentGraph} query={queryText} /> : null}
                </div>
            </div>
        </main>
    );
}
