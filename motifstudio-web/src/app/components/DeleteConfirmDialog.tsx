"use client";

import { Dialog } from "@headlessui/react";
import { DeleteConfirmDialogProps } from "../types/fileMenu";

export function DeleteConfirmDialog({ isOpen, onClose, project, onConfirm }: DeleteConfirmDialogProps) {
    const handleConfirm = () => {
        if (project) {
            onConfirm(project.id);
        }
    };

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/25" />
            <div className="fixed inset-0 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4">
                    <Dialog.Panel className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
                        <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                                <svg
                                    className="h-6 w-6 text-red-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                                    />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <Dialog.Title className="text-lg font-medium text-gray-900 dark:text-gray-200">
                                    Delete Project
                                </Dialog.Title>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Are you sure you want to delete "{project?.name}"? This action cannot be undone.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirm}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </Dialog.Panel>
                </div>
            </div>
        </Dialog>
    );
}
