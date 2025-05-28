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
    if (!isClient) return <div>Loading...</div>;
    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error: {JSON.stringify(error)}</div>;
    if (!data) return <div>No data</div>;

    // Filter graphs based on query string.
    const filteredGraphs =
        query === ""
            ? data.hosts
            : data.hosts.filter((graph: any) => graph.name.toLowerCase().includes(query.toLowerCase()));

    // Return the dropdown with the filtered graphs as the options.
    return (
        <div className="h-full bg-white p-4 rounded-lg shadow-lg dark:bg-gray-800">
            <h2 className="text-xl font-mono">Host Graph</h2>
            <hr className="my-2" />

            <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
                <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
                    <Tab
                        className={({ selected }) =>
                            `w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-blue-700 ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2 ${
                                selected
                                    ? "bg-white text-blue-700 shadow"
                                    : "text-blue-100 hover:bg-white/[0.12] hover:text-white"
                            }`
                        }
                    >
                        Browse Graphs
                    </Tab>
                    <Tab
                        className={({ selected }) =>
                            `w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-blue-700 ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2 ${
                                selected
                                    ? "bg-white text-blue-700 shadow"
                                    : "text-blue-100 hover:bg-white/[0.12] hover:text-white"
                            }`
                        }
                    >
                        Upload Graph
                    </Tab>
                </Tab.List>
                <Tab.Panels className="mt-4">
                    <Tab.Panel className="rounded-xl bg-white/5 p-3">
                        {/* Database Host Selection */}
                        <div className="flex flex-row gap-2 items-center">
                            <DatabaseIcon />
                            <div className="flow-col w-full">
                                <Combobox
                                    onChange={(v) => {
                                        if (onGraphChange) {
                                            onGraphChange(v);
                                        }
                                        setSelectedGraph(v);
                                    }}
                                    value={selectedGraph}
                                >
                                    <div className="relative">
                                        <Combobox.Input
                                            onChange={(event) => setQuery(event.target.value)}
                                            className="w-full p-4 rounded-lg shadow-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent font-bold dark:bg-gray-900 dark:text-gray-200"
                                            placeholder="Start typing or press the down arrow to choose a host graph..."
                                            displayValue={(graph: HostListing) => graph?.name}
                                        />
                                        {/* Show indicator for uploaded graphs */}
                                        {selectedGraph && !data.hosts.some((host) => host.id === selectedGraph.id) && (
                                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                    Uploaded
                                                </span>
                                            </div>
                                        )}
                                        <Combobox.Options className="p-3 rounded-lg shadow-lg border overflow-y-scroll max-h-64 absolute w-full z-10 bg-white dark:bg-gray-800">
                                            {filteredGraphs.map((graph) => (
                                                <Combobox.Option
                                                    key={graph.id}
                                                    value={graph}
                                                    className={({ active }) => `${
                                                        active
                                                            ? "text-white bg-blue-400 dark:bg-blue-400 dark:text-white"
                                                            : "text-gray-900 dark:text-gray-200"
                                                    }
                                                    cursor-default select-none relative py-2 pl-10 pr-4 hover:bg-blue-400 hover:text-white flex items-center justify-between text-sm
                                                    `}
                                                >
                                                    <b className="font-bold">{graph.name}</b>{" "}
                                                    <div className="text-xs inline font-mono ml-4">{graph.id}</div>
                                                </Combobox.Option>
                                            ))}
                                        </Combobox.Options>
                                    </div>
                                </Combobox>
                            </div>
                        </div>
                    </Tab.Panel>
                    <Tab.Panel className="rounded-xl bg-white/5 p-3">
                        <GraphUpload onGraphUploaded={handleGraphUploaded} />
                    </Tab.Panel>
                </Tab.Panels>
            </Tab.Group>
        </div>
    );
}
