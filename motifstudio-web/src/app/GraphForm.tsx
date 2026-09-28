"use client";
import { useState, useEffect } from "react";
import { Combobox, Tab } from "@headlessui/react";
import useSWR from "swr";
import { DatabaseIcon } from "./DatabaseIcon";
import { HostListing, fetcher, BASE_URL } from "./api";
import { useClientOnly } from "./hooks/useClientOnly";
import { GraphUpload } from "./GraphUpload";

/**
 * Dropdown to select a host graph from a list of available graphs.
 *
 * @param {HostListing} startValue - Optional starting value for the dropdown.
 * @param {(graph?: HostListing) => void} onGraphChange - Optional callback
 *      function for when the selected graph changes. This is used mainly in
 *      the "Home" component to update the graph in top level app state.
 */
export function GraphForm({
    startValue,
    onGraphChange,
}: {
    startValue?: HostListing;
    onGraphChange?: (graph: HostListing) => void;
}) {
    // Pull graphs from web server with axios:
    const { data, error, isLoading } = useSWR<{ hosts: HostListing[] }>(`${BASE_URL}/providers/hostlist`, fetcher);
    const [selectedGraph, setSelectedGraph] = useState<HostListing | undefined>(startValue);
    const [query, setQuery] = useState("");
    const [selectedTab, setSelectedTab] = useState(0);
    const isClient = useClientOnly();

    // Update selectedGraph when startValue changes
    useEffect(() => {
        setSelectedGraph(startValue);
    }, [startValue]);

    const handleGraphUploaded = (uploadedGraph: HostListing) => {
        if (onGraphChange) {
            onGraphChange(uploadedGraph);
        }
        setSelectedGraph(uploadedGraph);
        setSelectedTab(0); // Switch back to "Browse Graphs" tab to show the selection
    };

    // Simple loading/error handling.
    // Note that if the host cannot be reached, this is likely the first place
    // that the user will see an error message.
    // Use client-only check to avoid hydration mismatch
    if (!isClient || isLoading) return <div className="h-11 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" aria-label="Loading graphs" />;
    if (error) return <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">Could not load host graphs.</div>;
    if (!data) return <div className="text-sm text-slate-500">No graphs available.</div>;

    // Filter graphs based on query string.
    const filteredGraphs =
        query === ""
            ? data.hosts
            : data.hosts.filter((graph: any) => graph.name.toLowerCase().includes(query.toLowerCase()));

    // Return the dropdown with the filtered graphs as the options.
    return (
        <div>
            <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
                <Tab.List className="mb-3 inline-flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
                    <Tab
                        className={({ selected }) =>
                            `rounded-md px-4 py-1.5 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                                selected
                                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                            }`
                        }
                    >
                        Browse Graphs
                    </Tab>
                    <Tab
                        className={({ selected }) =>
                            `rounded-md px-4 py-1.5 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                                selected
                                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                            }`
                        }
                    >
                        Upload Graph
                    </Tab>
                </Tab.List>
                <Tab.Panels>
                    <Tab.Panel>
                        {/* Database Host Selection */}
                        <div className="flex items-center gap-3">
                            <div className="hidden rounded-lg bg-sky-50 p-2.5 text-sky-700 dark:bg-sky-950 dark:text-sky-300 sm:block">
                                <DatabaseIcon />
                            </div>
                            <div className="min-w-0 flex-1">
                                <Combobox
                                    immediate
                                    onChange={(v) => {
                                        if (!v) {
                                            return;
                                        }
                                        if (onGraphChange) {
                                            onGraphChange(v);
                                        }
                                        setSelectedGraph(v);
                                    }}
                                    value={selectedGraph}
                                >
                                    <div className="relative">
                                        <label htmlFor="host-graph-search" className="sr-only">Search host graphs</label>
                                        <Combobox.Input
                                            id="host-graph-search"
                                            onChange={(event) => setQuery(event.target.value)}
                                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-sm outline-none placeholder:font-normal placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-sky-950"
                                            placeholder="Search or select a host graph…"
                                            displayValue={(graph: HostListing) => graph?.name}
                                        />
                                        {/* Show indicator for uploaded graphs */}
                                        {selectedGraph && !data.hosts.some((host) => host.id === selectedGraph.id) && (
                                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                <span className="inline-flex items-center rounded-full bg-sky-100 px-2 py-1 text-xs font-medium text-sky-800 dark:bg-sky-900 dark:text-sky-200">
                                                    Uploaded
                                                </span>
                                            </div>
                                        )}
                                        <Combobox.Options className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                                            {filteredGraphs.map((graph) => (
                                                <Combobox.Option
                                                    key={graph.id}
                                                    value={graph}
                                                    className={({ active }) => `relative flex cursor-default select-none items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm ${active ? "bg-sky-50 text-sky-900 dark:bg-sky-950 dark:text-sky-100" : "text-slate-700 dark:text-slate-200"}`}
                                                >
                                                    <span className="min-w-0 truncate font-medium">{graph.name}</span>
                                                    <span className="shrink-0 font-mono text-xs text-slate-400">{graph.id}</span>
                                                </Combobox.Option>
                                            ))}
                                        </Combobox.Options>
                                    </div>
                                </Combobox>
                            </div>
                        </div>
                    </Tab.Panel>
                    <Tab.Panel>
                        <GraphUpload onGraphUploaded={handleGraphUploaded} />
                    </Tab.Panel>
                </Tab.Panels>
            </Tab.Group>
        </div>
    );
}
