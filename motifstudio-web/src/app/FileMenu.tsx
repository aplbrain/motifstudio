"use client";

import { useState, Fragment } from "react";
import { Menu, Transition } from "@headlessui/react";
import { ChevronDownIcon, DocumentIcon, FolderOpenIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { FileMenuProps, SavedProject } from "./types/fileMenu";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { SaveDialog } from "./components/SaveDialog";
import { OpenDialog } from "./components/OpenDialog";
import { DeleteConfirmDialog } from "./components/DeleteConfirmDialog";
import { exportAsJSON } from "./utils/exportUtils";

export function FileMenu({ queryText, currentGraph, onLoad }: FileMenuProps) {
    const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
    const [isOpenDialogOpen, setIsOpenDialogOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<SavedProject | null>(null);

    const { savedProjects, saveProject, deleteProject } = useLocalStorage();

    const handleSave = (project: SavedProject) => {
        saveProject(project);
    };

    const handleLoad = (project: SavedProject) => {
        onLoad({
            queryText: project.queryText,
            graph: project.graph,
        });
        setIsOpenDialogOpen(false);
    };

    const handleDeleteClick = (project: SavedProject) => {
        setProjectToDelete(project);
        setIsDeleteConfirmOpen(true);
    };

    const handleDeleteConfirm = (projectId: string) => {
        deleteProject(projectId);
        setIsDeleteConfirmOpen(false);
        setProjectToDelete(null);
    };

    const handleExport = () => {
        exportAsJSON(queryText, currentGraph, true);
    };

    return (
        <>
            <Menu as="div" className="relative inline-block text-left">
                <div>
                    <Menu.Button className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
                        File
                        <ChevronDownIcon className="-mr-1 h-5 w-5 text-gray-400 dark:text-gray-300" aria-hidden="true" />
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
                    <Menu.Items className="absolute left-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800 dark:ring-gray-700 dark:ring-opacity-50">
                        <div className="py-1">
                            <Menu.Item>
                                {({ active }) => (
                                    <button
                                        onClick={() => setIsSaveDialogOpen(true)}
                                        className={`${
                                            active
                                                ? "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-200"
                                                : "text-gray-700 dark:text-gray-200"
                                        } group flex w-full items-center px-4 py-2 text-sm`}
                                    >
                                        <DocumentIcon className="mr-3 h-5 w-5 text-gray-400 dark:text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300" />
                                        Save
                                    </button>
                                )}
                            </Menu.Item>
                            <Menu.Item>
                                {({ active }) => (
                                    <button
                                        onClick={() => setIsOpenDialogOpen(true)}
                                        className={`${
                                            active
                                                ? "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-200"
                                                : "text-gray-700 dark:text-gray-200"
                                        } group flex w-full items-center px-4 py-2 text-sm`}
                                    >
                                        <FolderOpenIcon className="mr-3 h-5 w-5 text-gray-400 dark:text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300" />
                                        Open
                                    </button>
                                )}
                            </Menu.Item>
                            <Menu.Item>
                                {({ active }) => (
                                    <button
                                        onClick={handleExport}
                                        className={`${
                                            active
                                                ? "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-200"
                                                : "text-gray-700 dark:text-gray-200"
                                        } group flex w-full items-center px-4 py-2 text-sm`}
                                    >
                                        <ArrowDownTrayIcon className="mr-3 h-5 w-5 text-gray-400 dark:text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300" />
                                        Export
                                    </button>
                                )}
                            </Menu.Item>
                        </div>
                    </Menu.Items>
                </Transition>
            </Menu>

            <SaveDialog
                isOpen={isSaveDialogOpen}
                onClose={() => setIsSaveDialogOpen(false)}
                queryText={queryText}
                currentGraph={currentGraph}
                savedProjects={savedProjects}
                onSave={handleSave}
            />

            <OpenDialog
                isOpen={isOpenDialogOpen}
                onClose={() => setIsOpenDialogOpen(false)}
                savedProjects={savedProjects}
                onLoad={handleLoad}
                onDelete={handleDeleteClick}
            />

            <DeleteConfirmDialog
                isOpen={isDeleteConfirmOpen}
                onClose={() => setIsDeleteConfirmOpen(false)}
                project={projectToDelete}
                onConfirm={handleDeleteConfirm}
            />
        </>
    );
}
