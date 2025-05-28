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
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<SavedProject | null>(null);
    const [saveName, setSaveName] = useState("");
    const [includeGraph, setIncludeGraph] = useState(true);
    const [savedProjects, setSavedProjects] = useState<SavedProject[]>(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("motifstudio-projects");
            return saved ? JSON.parse(saved) : [];
        }
        return [];
    });    const saveProject = () => {
        if (!saveName.trim()) return;

        // Check if a project with this name already exists
        const existingProjectIndex = savedProjects.findIndex(p => p.name === saveName.trim());
        
        const project: SavedProject = {
            id: existingProjectIndex >= 0 ? savedProjects[existingProjectIndex].id : Date.now().toString(),
            name: saveName.trim(),
            queryText,
            graph: includeGraph ? currentGraph : undefined,
            timestamp: new Date().toISOString(),
        };

        let updatedProjects;
        if (existingProjectIndex >= 0) {
            // Replace existing project
            updatedProjects = [...savedProjects];
            updatedProjects[existingProjectIndex] = project;
        } else {
            // Add new project
            updatedProjects = [project, ...savedProjects];
        }

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
        setIsDeleteConfirmOpen(false);
        setProjectToDelete(null);
    };

    const handleDeleteClick = (project: SavedProject) => {
        setProjectToDelete(project);
        setIsDeleteConfirmOpen(true);
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
                                        onClick={() => {
                                            setSaveName("");
                                            setIsSaveDialogOpen(true);
                                        }}
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
                        <Dialog.Panel className="w-full max-w-4xl max-h-[80vh] rounded-lg bg-white shadow-xl flex flex-col">
                            <div className="flex items-center justify-between p-6 border-b">
                                <Dialog.Title className="text-lg font-medium text-gray-900">Save Project</Dialog.Title>
                                <button
                                    onClick={() => setIsSaveDialogOpen(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="flex-1 flex min-h-0">
                                {/* File Explorer Panel */}
                                <div className="w-2/3 border-r flex flex-col">
                                    <div className="px-4 py-3 bg-gray-50 border-b">
                                        <h3 className="text-sm font-medium text-gray-700">Saved Projects</h3>
                                    </div>
                                    <div className="flex-1 overflow-y-auto">
                                        {savedProjects.length === 0 ? (
                                            <div className="flex items-center justify-center h-32">
                                                <div className="text-center">
                                                    <DocumentIcon className="mx-auto h-12 w-12 text-gray-300" />
                                                    <p className="mt-2 text-sm text-gray-500">No saved projects yet</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-gray-200">
                                                {savedProjects.map((project) => (
                                                    <div
                                                        key={project.id}
                                                        className={`px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors ${
                                                            saveName.trim() === project.name ? 'bg-blue-100 border-r-2 border-blue-500' : ''
                                                        }`}
                                                        onClick={() => setSaveName(project.name)}
                                                    >
                                                        <div className="flex items-start space-x-3">
                                                            <DocumentIcon className="flex-shrink-0 h-5 w-5 text-gray-400 mt-0.5" />
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                                    {project.name}
                                                                </p>
                                                                <div className="mt-1 flex items-center space-x-1 text-xs text-gray-500">
                                                                    <span>{new Date(project.timestamp).toLocaleDateString()}</span>
                                                                    <span>•</span>
                                                                    <span>{new Date(project.timestamp).toLocaleTimeString()}</span>
                                                                </div>
                                                                {project.graph && (
                                                                    <div className="mt-1 flex items-center space-x-1">
                                                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                                        <span className="text-xs text-blue-600">{project.graph.name}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Save Form Panel */}
                                <div className="w-1/3 flex flex-col">
                                    <div className="px-4 py-3 bg-gray-50 border-b">
                                        <h3 className="text-sm font-medium text-gray-700">Project Details</h3>
                                    </div>
                                    <div className="flex-1 p-4 space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Project Name
                                            </label>
                                            <input
                                                type="text"
                                                value={saveName}
                                                onChange={(e) => setSaveName(e.target.value)}
                                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                placeholder="Enter project name..."
                                                onKeyDown={(e) => e.key === "Enter" && saveProject()}
                                            />
                                            {saveName.trim() && savedProjects.some(p => p.name === saveName.trim()) && (
                                                <div className="mt-2 flex items-start space-x-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
                                                    <svg className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                    <div>
                                                        <p className="text-xs text-amber-700 font-medium">File exists</p>
                                                        <p className="text-xs text-amber-600">This will overwrite the existing project.</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center">
                                                <input
                                                    id="include-graph"
                                                    type="checkbox"
                                                    checked={includeGraph}
                                                    onChange={(e) => setIncludeGraph(e.target.checked)}
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                />
                                                <label htmlFor="include-graph" className="ml-2 block text-sm text-gray-700">
                                                    Include graph selection
                                                </label>
                                            </div>
                                            {includeGraph && currentGraph && (
                                                <div className="ml-6 p-2 bg-blue-50 border border-blue-200 rounded-md">
                                                    <p className="text-xs text-blue-700 font-medium">Current Graph:</p>
                                                    <p className="text-xs text-blue-600">{currentGraph.name}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
                                <button
                                    onClick={() => setIsSaveDialogOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
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
                        <Dialog.Panel className="w-full max-w-4xl max-h-[80vh] rounded-lg bg-white shadow-xl flex flex-col">
                            <div className="flex items-center justify-between p-6 border-b">
                                <Dialog.Title className="text-lg font-medium text-gray-900">Open Project</Dialog.Title>
                                <button
                                    onClick={() => setIsOpenDialogOpen(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="flex-1 overflow-hidden">
                                {savedProjects.length === 0 ? (
                                    <div className="flex items-center justify-center h-64">
                                        <div className="text-center">
                                            <FolderOpenIcon className="mx-auto h-16 w-16 text-gray-300" />
                                            <p className="mt-4 text-lg text-gray-500 font-medium">No saved projects found</p>
                                            <p className="mt-1 text-sm text-gray-400">Create your first project using the Save option</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col">
                                        <div className="px-6 py-3 bg-gray-50 border-b">
                                            <h3 className="text-sm font-medium text-gray-700">
                                                {savedProjects.length} saved project{savedProjects.length !== 1 ? 's' : ''}
                                            </h3>
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-4">
                                            <div className="grid grid-cols-1 gap-3">
                                                {savedProjects.map((project) => (
                                                    <div
                                                        key={project.id}
                                                        className="group p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-150"
                                                    >
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex items-start space-x-3 flex-1 min-w-0">
                                                                <div className="flex-shrink-0 mt-1">
                                                                    <DocumentIcon className="h-6 w-6 text-blue-500" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <h4 className="text-base font-semibold text-gray-900 truncate group-hover:text-blue-900">
                                                                        {project.name}
                                                                    </h4>
                                                                    <div className="mt-1 flex items-center space-x-2 text-sm text-gray-500">
                                                                        <span>Saved on</span>
                                                                        <span className="font-medium">
                                                                            {new Date(project.timestamp).toLocaleDateString()}
                                                                        </span>
                                                                        <span>at</span>
                                                                        <span className="font-medium">
                                                                            {new Date(project.timestamp).toLocaleTimeString()}
                                                                        </span>
                                                                    </div>
                                                                    {project.graph && (
                                                                        <div className="mt-2 flex items-center space-x-2">
                                                                            <div className="flex items-center space-x-1">
                                                                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                                                <span className="text-sm text-blue-600 font-medium">
                                                                                    Graph: {project.graph.name}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                    <div className="mt-2">
                                                                        <p className="text-xs text-gray-400 line-clamp-2">
                                                                            Query: {project.queryText.length > 100 
                                                                                ? project.queryText.substring(0, 100) + '...' 
                                                                                : project.queryText}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col gap-2 ml-4">
                                                                <button
                                                                    onClick={() => loadProject(project)}
                                                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                                                                >
                                                                    Open
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteClick(project)}
                                                                    className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 hover:border-red-300 transition-colors"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end">
                                <button
                                    onClick={() => setIsOpenDialogOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </Dialog.Panel>
                    </div>
                </div>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteConfirmOpen} onClose={() => setIsDeleteConfirmOpen(false)} className="relative z-50">
                <div className="fixed inset-0 bg-black/25" />
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Dialog.Panel className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                            <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0">
                                    <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <Dialog.Title className="text-lg font-medium text-gray-900">
                                        Delete Project
                                    </Dialog.Title>
                                    <div className="mt-2">
                                        <p className="text-sm text-gray-500">
                                            Are you sure you want to delete "{projectToDelete?.name}"? This action cannot be undone.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    onClick={() => setIsDeleteConfirmOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => projectToDelete && deleteProject(projectToDelete.id)}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                                >
                                    Delete
                                </button>
                            </div>
                        </Dialog.Panel>
                    </div>
                </div>
            </Dialog>
        </>
    );
}
