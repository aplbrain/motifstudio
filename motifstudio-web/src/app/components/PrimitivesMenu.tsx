"use client";

import { useState, Fragment } from "react";
import { Menu, Transition } from "@headlessui/react";
import { ChevronDownIcon, CodeBracketIcon } from "@heroicons/react/24/outline";
import { PrimitivesDialog } from "./PrimitivesDialog";
import { PrimitivesMenuProps } from "../types/fileMenu";

export function PrimitivesMenu({ onInsertPrimitive }: PrimitivesMenuProps) {
    const [isPrimitivesDialogOpen, setIsPrimitivesDialogOpen] = useState(false);

    return (
        <>
            <Menu as="div" className="relative inline-block text-left">
                <div>
                    <Menu.Button className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
                        Primitives
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
                                        onClick={() => setIsPrimitivesDialogOpen(true)}
                                        className={`${
                                            active
                                                ? "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-200"
                                                : "text-gray-700 dark:text-gray-200"
                                        } group flex w-full items-center px-4 py-2 text-sm`}
                                    >
                                        <CodeBracketIcon className="mr-3 h-5 w-5 text-gray-400 dark:text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300" />
                                        Browse Primitives
                                    </button>
                                )}
                            </Menu.Item>
                        </div>
                    </Menu.Items>
                </Transition>
            </Menu>

            <PrimitivesDialog
                isOpen={isPrimitivesDialogOpen}
                onClose={() => setIsPrimitivesDialogOpen(false)}
                onInsertPrimitive={onInsertPrimitive}
            />
        </>
    );
}
