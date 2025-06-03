"use client";

import { useState } from "react";
import { Dialog } from "@headlessui/react";
import { DocumentIcon } from "@heroicons/react/24/outline";
import { SaveDialogProps, SavedProject } from "../types/fileMenu";

export function SaveDialog({ isOpen, onClose, queryText, currentGraph, savedProjects, onSave }: SaveDialogProps) {
    const [saveName, setSaveName] = useState("");
    const [includeGraph, setIncludeGraph] = useState(true);

    const handleSave = () => {
        if (!saveName.trim()) return;

        const project: SavedProject = {
            id: "", // Will be set by the hook
            name: saveName.trim(),
            queryText,
            graph: includeGraph ? currentGraph : undefined,
            timestamp: "", // Will be set by the hook
        };

        onSave(project);
        setSaveName("");
        onClose();
    };

    const handleClose = () => {
        setSaveName("");
        onClose();
    };

    const projectExists = savedProjects.some((p) => p.name === saveName.trim());

    return (
        <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/25" />
            <div className="fixed inset-0 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4">
                    <Dialog.Panel className="w-full max-w-4xl max-h-[80vh] rounded-lg bg-white shadow-xl flex flex-col dark:bg-gray-800">
                        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
                            <Dialog.Title className="text-lg font-medium text-gray-900 dark:text-gray-200">Save Project</Dialog.Title>
                            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>

                        <div className="flex-1 flex min-h-0">
                            {/* File Explorer Panel */}
                            <div className="w-2/3 border-r flex flex-col border-gray-200 dark:border-gray-700">
                                <div className="px-4 py-3 bg-gray-50 border-b dark:bg-gray-700 dark:border-gray-700">
                                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">Saved Projects</h3>
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                    {savedProjects.length === 0 ? (
                                        <div className="flex items-center justify-center h-32">
                                            <div className="text-center">
                                                <DocumentIcon className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-400" />
                                                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No saved projects yet</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {savedProjects.map((project) => (
                                                <div
                                                    key={project.id}
                                                    className={`px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors ${
                                                        saveName.trim() === project.name
                                                            ? "bg-blue-100 border-r-2 border-blue-500"
                                                            : ""
                                                    }`}
                                                    onClick={() => setSaveName(project.name)}
                                                >
                                                    <div className="flex items-start space-x-3">
                                                        <DocumentIcon className="flex-shrink-0 h-5 w-5 text-gray-400 mt-0.5" />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-gray-900 truncate dark:text-gray-200">
                                                                {project.name}
                                                            </p>
                                                            <div className="mt-1 flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                                                                <span>
                                                                    {new Date(project.timestamp).toLocaleDateString()}
                                                                </span>
                                                                <span>•</span>
                                                                <span>
                                                                    {new Date(project.timestamp).toLocaleTimeString()}
                                                                </span>
                                                            </div>
                                                            {project.graph && (
                                                                <div className="mt-1 flex items-center space-x-1">
                                                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                                    <span className="text-xs text-blue-600">
                                                                        {project.graph.name}
                                                                    </span>
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
                                <div className="px-4 py-3 bg-gray-50 border-b dark:bg-gray-700 dark:border-gray-700">
                                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">Project Details</h3>
                                </div>
                                <div className="flex-1 p-4 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-200">
                                            Project Name
                                        </label>
                                        <input
                                            type="text"
                                            value={saveName}
                                            onChange={(e) => setSaveName(e.target.value)}
                                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-600"
                                            placeholder="Enter project name..."
                                            onKeyDown={(e) => e.key === "Enter" && handleSave()}
                                        />
                                        {saveName.trim() && projectExists && (
                                            <div className="mt-2 flex items-start space-x-2 p-2 bg-amber-50 border border-amber-200 rounded-md dark:bg-amber-900/20 dark:border-amber-700">
                                                <svg
                                                    className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0 dark:text-amber-200"
                                                    fill="currentColor"
                                                    viewBox="0 0 20 20"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                                <div>
                                                    <p className="text-xs text-amber-700 font-medium dark:text-amber-200">File exists</p>
                                                    <p className="text-xs text-amber-600 dark:text-amber-300">
                                                        This will overwrite the existing project.
                                                    </p>
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
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:bg-gray-900 dark:border-gray-600"
                                                />
                                            <label htmlFor="include-graph" className="ml-2 block text-sm text-gray-700 dark:text-gray-200">
                                                Include graph selection
                                            </label>
                                        </div>
                                        {includeGraph && currentGraph && (
                                            <div className="ml-6 p-2 bg-blue-50 border border-blue-200 rounded-md dark:bg-blue-900/20 dark:border-blue-700">
                                                <p className="text-xs text-blue-700 font-medium dark:text-blue-200">Current Graph:</p>
                                                <p className="text-xs text-blue-600 dark:text-blue-200">{currentGraph.name}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3 dark:bg-gray-700 dark:border-gray-700">
                            <button
                                onClick={handleClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
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
    );
}
