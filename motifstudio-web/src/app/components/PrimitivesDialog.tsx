"use client";

import { Dialog } from "@headlessui/react";
import { CodeBracketIcon, DocumentTextIcon, ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import { PRIMITIVES } from "../utils/primitives";
import { Primitive } from "../types/fileMenu";
import { useState } from "react";

interface PrimitivesDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onInsertPrimitive: (dotmotif: string) => void;
}

export function PrimitivesDialog({ isOpen, onClose, onInsertPrimitive }: PrimitivesDialogProps) {
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

    const primitives = Object.entries(PRIMITIVES).map(([key, value]) => ({
        id: key,
        ...value,
    }));

    const handleInsert = (primitive: Primitive & { id: string }) => {
        onInsertPrimitive(primitive.dotmotif);
        onClose();
    };

    const toggleExpanded = (primitiveId: string) => {
        const newExpanded = new Set(expandedItems);
        if (newExpanded.has(primitiveId)) {
            newExpanded.delete(primitiveId);
        } else {
            newExpanded.add(primitiveId);
        }
        setExpandedItems(newExpanded);
    };

    const isExpanded = (primitiveId: string) => expandedItems.has(primitiveId);

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/25" />
            <div className="fixed inset-0 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4">
                    <Dialog.Panel className="w-full max-w-4xl rounded-lg bg-white shadow-xl flex flex-col dark:bg-gray-800">
                        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
                            <div>
                                <Dialog.Title className="text-lg font-medium text-gray-900 dark:text-gray-200">
                                    Motif Primitives
                                </Dialog.Title>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    Choose a primitive motif pattern to insert into your query. These are common network
                                    structures that can be combined to build more complex queries.
                                </p>
                            </div>
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
                            <div className="h-full flex flex-col">
                                <div className="px-6 py-3 bg-gray-50 border-b dark:bg-gray-700 dark:border-gray-700">
                                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                        {primitives.length} available primitive{primitives.length !== 1 ? "s" : ""}
                                    </h3>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4">
                                    <div className="grid grid-cols-1 gap-4">
                                        {primitives.map((primitive) => {
                                            const expanded = isExpanded(primitive.id);
                                            const descriptionTruncated = primitive.description.length > 150;
                                            const displayDescription = expanded
                                                ? primitive.description
                                                : primitive.description.slice(0, 150) +
                                                  (descriptionTruncated ? "..." : "");

                                            return (
                                                <div
                                                    key={primitive.id}
                                                    className="group p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-150 dark:border-gray-700 dark:hover:border-blue-300 dark:hover:bg-blue-900/20"
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-start space-x-3 flex-1 min-w-0">
                                                            <div className="flex-shrink-0 mt-1">
                                                                <CodeBracketIcon className="h-6 w-6 text-blue-500" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="text-base font-semibold text-gray-900 group-hover:text-blue-900 dark:text-gray-200 dark:group-hover:text-blue-300">
                                                                    {primitive.name}
                                                                </h4>

                                                                {/* Description with scroll and fade effect */}
                                                                <div className="mt-1 relative">
                                                                    <div
                                                                        className={`text-sm text-gray-600 transition-all duration-300 dark:text-gray-300 ${
                                                                            expanded
                                                                                ? "max-h-none"
                                                                                : "max-h-20 overflow-hidden"
                                                                        }`}
                                                                    >
                                                                        <div
                                                                            className={`${
                                                                                expanded
                                                                                    ? "max-h-40 overflow-y-auto pr-2"
                                                                                    : ""
                                                                            }`}
                                                                        >
                                                                            {displayDescription}
                                                                        </div>
                                                                    </div>

                                                                    {/* Fade-out gradient effect */}
                                                                    {!expanded && descriptionTruncated && (
                                                                        <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white via-white/80 to-transparent dark:from-gray-800 dark:via-gray-800/80 pointer-events-none" />
                                                                    )}

                                                                    {/* Expand/Collapse button */}
                                                                    {descriptionTruncated && (
                                                                        <button
                                                                            onClick={() => toggleExpanded(primitive.id)}
                                                                            className="mt-2 inline-flex items-center text-xs text-blue-600 hover:text-blue-800 font-medium dark:text-blue-400 dark:hover:text-blue-200"
                                                                        >
                                                                            {expanded ? (
                                                                                <>
                                                                                    <ChevronUpIcon className="h-3 w-3 mr-1" />
                                                                                    Show less
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <ChevronDownIcon className="h-3 w-3 mr-1" />
                                                                                    Show more
                                                                                </>
                                                                            )}
                                                                        </button>
                                                                    )}
                                                                </div>

                                                                {/* DotMotif code section */}
                                                                <div className="mt-3 p-3 bg-gray-100 rounded-md dark:bg-gray-700">
                                                                    <div className="flex items-center space-x-2 mb-2">
                                                                    <DocumentTextIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                                                        <span className="text-xs font-medium text-gray-700 uppercase tracking-wide dark:text-gray-200">
                                                                            DotMotif Code
                                                                        </span>
                                                                    </div>
                                                                    <div className="relative">
                                                                        <div className="max-h-32 overflow-y-auto">
                                                                            <pre className="text-xs text-gray-800 font-mono leading-relaxed whitespace-pre-wrap pr-2 dark:text-gray-200">
                                                                                {primitive.dotmotif}
                                                                            </pre>
                                                                        </div>
                                                                        {/* Fade-out for code if it's too long */}
                                                                        {primitive.dotmotif.split("\n").length > 8 && (
                                                                            <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-gray-100 via-gray-100/80 to-transparent dark:from-gray-700 dark:via-gray-700/80 pointer-events-none" />
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col gap-2 ml-4">
                                                            <button
                                                                onClick={() => handleInsert(primitive)}
                                                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                                                            >
                                                                Insert
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end dark:bg-gray-700 dark:border-gray-700">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                            >
                                Close
                            </button>
                        </div>
                    </Dialog.Panel>
                </div>
            </div>
        </Dialog>
    );
}
