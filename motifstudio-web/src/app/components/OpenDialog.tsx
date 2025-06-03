"use client";

import { Dialog } from "@headlessui/react";
import { DocumentIcon, FolderOpenIcon } from "@heroicons/react/24/outline";
import { OpenDialogProps } from "../types/fileMenu";

export function OpenDialog({ isOpen, onClose, savedProjects, onLoad, onDelete }: OpenDialogProps) {
    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/25" />
            <div className="fixed inset-0 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4">
                    <Dialog.Panel className="w-full max-w-4xl max-h-[80vh] rounded-lg bg-white shadow-xl flex flex-col dark:bg-gray-800">
                        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
                            <Dialog.Title className="text-lg font-medium text-gray-900 dark:text-gray-200">Open Project</Dialog.Title>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200">
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

                        <div className="flex-1 overflow-hidden">
                            {savedProjects.length === 0 ? (
                                <div className="flex items-center justify-center h-64">
                                    <div className="text-center">
                                        <FolderOpenIcon className="mx-auto h-16 w-16 text-gray-300 dark:text-gray-400" />
                                        <p className="mt-4 text-lg text-gray-500 font-medium dark:text-gray-200">
                                            No saved projects found
                                        </p>
                                        <p className="mt-1 text-sm text-gray-400 dark:text-gray-400">
                                            Create your first project using the Save option
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col">
                                    <div className="px-6 py-3 bg-gray-50 border-b dark:bg-gray-700 dark:border-gray-700">
                                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                            {savedProjects.length} saved project
                                            {savedProjects.length !== 1 ? "s" : ""}
                                        </h3>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-4">
                                        <div className="grid grid-cols-1 gap-3">
                                            {savedProjects.map((project) => (
                                                <div
                                                    key={project.id}
                                                className="group p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-150 dark:border-gray-700 dark:hover:border-blue-300 dark:hover:bg-blue-900/20"
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-start space-x-3 flex-1 min-w-0">
                                                            <div className="flex-shrink-0 mt-1">
                                                                <DocumentIcon className="h-6 w-6 text-blue-500" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                    <h4 className="text-base font-semibold text-gray-900 truncate group-hover:text-blue-900 dark:text-gray-200 dark:group-hover:text-blue-300">
                                                                    {project.name}
                                                                </h4>
                                                                    <div className="mt-1 flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                                                                    <span>Saved on</span>
                                                                    <span className="font-medium">
                                                                        {new Date(
                                                                            project.timestamp
                                                                        ).toLocaleDateString()}
                                                                    </span>
                                                                    <span>at</span>
                                                                    <span className="font-medium">
                                                                        {new Date(
                                                                            project.timestamp
                                                                        ).toLocaleTimeString()}
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
                                                                    <p className="text-xs text-gray-400 dark:text-gray-400 line-clamp-2">
                                                                        Query:{" "}
                                                                        {project.queryText.length > 100
                                                                            ? project.queryText.substring(0, 100) +
                                                                              "..."
                                                                            : project.queryText}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col gap-2 ml-4">
                                                            <button
                                                                onClick={() => onLoad(project)}
                                                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                                                            >
                                                                Open
                                                            </button>
                                                            <button
                                                                onClick={() => onDelete(project)}
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

                        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end dark:bg-gray-700 dark:border-gray-700">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                            >
                                Cancel
                            </button>
                        </div>
                    </Dialog.Panel>
                </div>
            </div>
        </Dialog>
    );
}
