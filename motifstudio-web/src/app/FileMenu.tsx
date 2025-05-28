"use client";

import { useState, Fragment } from "react";
import { Menu, Transition, Dialog } from "@headlessui/react";
import { ChevronDownIcon, DocumentIcon, FolderOpenIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { HostListing } from "./api";

interface SavedProject {
    id: string;
    name: string;
    queryText: string;
    graph?: HostListing;
    timestamp: string;
}

interface FileMenuProps {
    queryText: string;
    currentGraph?: HostListing;
    onLoad: (data: { queryText: string; graph?: HostListing }) => void;
}

export function FileMenu({ queryText, currentGraph, onLoad }: FileMenuProps) {
    const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
    const [isOpenDialogOpen, setIsOpenDialogOpen] = useState(false);
    const [saveName, setSaveName] = useState("");
    const [includeGraph, setIncludeGraph] = useState(true);
    const [savedProjects, setSavedProjects] = useState<SavedProject[]>(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("motifstudio-projects");
            return saved ? JSON.parse(saved) : [];
        }
        return [];
    });

    const saveProject = () => {
        if (!saveName.trim()) return;

        const project: SavedProject = {
            id: Date.now().toString(),
            name: saveName.trim(),
            queryText,
            graph: includeGraph ? currentGraph : undefined,
            timestamp: new Date().toISOString(),
        };

        const updatedProjects = [project, ...savedProjects];
        setSavedProjects(updatedProjects);
        localStorage.setItem("motifstudio-projects", JSON.stringify(updatedProjects));

        setSaveName("");
        setIsSaveDialogOpen(false);
    };

    const loadProject = (project: SavedProject) => {
        onLoad({
            queryText: project.queryText,
            graph: project.graph,
        });
        setIsOpenDialogOpen(false);
    };

    const deleteProject = (projectId: string) => {
        const updatedProjects = savedProjects.filter((p) => p.id !== projectId);
        setSavedProjects(updatedProjects);
        localStorage.setItem("motifstudio-projects", JSON.stringify(updatedProjects));
    };

    const exportAsJSON = () => {
        const exportData = {
            queryText,
            graph: includeGraph ? currentGraph : undefined,
            exportedAt: new Date().toISOString(),
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `motifstudio-export-${new Date().getTime()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <>
            <Menu as="div" className="relative inline-block text-left">
                <div>
                    <Menu.Button className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50">
                        File
                        <ChevronDownIcon className="-mr-1 h-5 w-5 text-gray-400" aria-hidden="true" />
                    </Menu.Button>
                </div>

                <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                >
                    <Menu.Items className="absolute left-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <div className="py-1">
                            <Menu.Item>
                                {({ active }) => (
                                    <button
                                        onClick={() => setIsSaveDialogOpen(true)}
                                        className={`${
                                            active ? "bg-gray-100 text-gray-900" : "text-gray-700"
                                        } group flex w-full items-center px-4 py-2 text-sm`}
                                    >
                                        <DocumentIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                                        Save
                                    </button>
                                )}
                            </Menu.Item>
                            <Menu.Item>
                                {({ active }) => (
                                    <button
                                        onClick={() => setIsOpenDialogOpen(true)}
                                        className={`${
                                            active ? "bg-gray-100 text-gray-900" : "text-gray-700"
                                        } group flex w-full items-center px-4 py-2 text-sm`}
                                    >
                                        <FolderOpenIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                                        Open
                                    </button>
                                )}
                            </Menu.Item>
                            <Menu.Item>
                                {({ active }) => (
                                    <button
                                        onClick={exportAsJSON}
                                        className={`${
                                            active ? "bg-gray-100 text-gray-900" : "text-gray-700"
                                        } group flex w-full items-center px-4 py-2 text-sm`}
                                    >
                                        <ArrowDownTrayIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                                        Export
                                    </button>
                                )}
                            </Menu.Item>
                        </div>
                    </Menu.Items>
                </Transition>
            </Menu>

            {/* Save Dialog */}
            <Dialog open={isSaveDialogOpen} onClose={() => setIsSaveDialogOpen(false)} className="relative z-50">
                <div className="fixed inset-0 bg-black/25" />
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Dialog.Panel className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                            <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">Save Project</Dialog.Title>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Project Name</label>
                                    <input
                                        type="text"
                                        value={saveName}
                                        onChange={(e) => setSaveName(e.target.value)}
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="Enter project name..."
                                        onKeyDown={(e) => e.key === "Enter" && saveProject()}
                                    />
                                </div>
                                <div className="flex items-center">
                                    <input
                                        id="include-graph"
                                        type="checkbox"
                                        checked={includeGraph}
                                        onChange={(e) => setIncludeGraph(e.target.checked)}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="include-graph" className="ml-2 block text-sm text-gray-700">
                                        Include connectome host graph selection
                                    </label>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    onClick={() => setIsSaveDialogOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={saveProject}
                                    disabled={!saveName.trim()}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Save
                                </button>
                            </div>
                        </Dialog.Panel>
                    </div>
                </div>
            </Dialog>

            {/* Open Dialog */}
            <Dialog open={isOpenDialogOpen} onClose={() => setIsOpenDialogOpen(false)} className="relative z-50">
                <div className="fixed inset-0 bg-black/25" />
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Dialog.Panel className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
                            <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">Open Project</Dialog.Title>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {savedProjects.length === 0 ? (
                                    <p className="text-gray-500 text-center py-8">No saved projects found.</p>
                                ) : (
                                    savedProjects.map((project) => (
                                        <div
                                            key={project.id}
                                            className="flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-gray-50"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-medium text-gray-900 truncate">
                                                    {project.name}
                                                </h4>
                                                <p className="text-xs text-gray-500">
                                                    {new Date(project.timestamp).toLocaleString()}
                                                </p>
                                                {project.graph && (
                                                    <p className="text-xs text-blue-600">Graph: {project.graph.name}</p>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => loadProject(project)}
                                                    className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                                                >
                                                    Load
                                                </button>
                                                <button
                                                    onClick={() => deleteProject(project.id)}
                                                    className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="mt-6 flex justify-end">
                                <button
                                    onClick={() => setIsOpenDialogOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                                >
                                    Close
                                </button>
                            </div>
                        </Dialog.Panel>
                    </div>
                </div>
            </Dialog>
        </>
    );
}
