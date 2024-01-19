"use client";
import { useState } from "react";
import { Combobox } from "@headlessui/react";
import useSWR from "swr";
import { DatabaseIcon } from "./DatabaseIcon";
import { HostListing, fetcher } from "./api";

export function GraphForm({ onGraphChange }: { onGraphChange?: (graph?: HostListing) => void }) {
    // Pull graphs from web server with axios:
    const { data, error, isLoading } = useSWR<{ hosts: HostListing[] }>(
        "http://localhost:8000/providers/hostlist",
        fetcher
    );
    const [selectedGraph, setSelectedGraph] = useState<HostListing>();
    const [query, setQuery] = useState("");

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!data) return <div>No data</div>;

    const filteredGraphs =
        query === ""
            ? data.hosts
            : data.hosts.filter((graph: any) => graph.name.toLowerCase().includes(query.toLowerCase()));
    return (
        <div className="h-full bg-white p-4 rounded-lg shadow-lg">
            <h2 className="text-xl font-mono">Host Graph</h2>
            <hr className="my-2" />

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
                                className="w-full p-4 rounded-lg shadow-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent font-bold"
                                placeholder="Choose a host graph..."
                                displayValue={(graph) => graph?.name}
                            />
                            <Combobox.Options className="p-3 rounded-lg shadow-lg border border-gray-200 z-10 bg-white overflow-y-scroll max-h-64 absolute w-full">
                                {filteredGraphs.map((graph) => (
                                    <Combobox.Option
                                        key={graph.id}
                                        value={graph}
                                        className={({ active }) => `${
                                            active ? "text-white bg-blue-400" : "text-gray-900"
                                        }
                                        cursor-default select-none relative py-2 pl-10 pr-4 hover:bg-blue-400 hover:text-white flex items-center justify-between`}
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
        </div>
    );
}
