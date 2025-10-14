import Image from "next/image";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import motifStudioLogo from "../motif-studio.png";

export function DocsNavbar() {
    return (
        <header className="flex justify-center px-4 pt-6">
            <div className="w-full max-w-5xl">
                <div className="flex items-center justify-between rounded-lg bg-white p-4 shadow-lg dark:bg-gray-800">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-900 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
                    >
                        <ArrowLeftIcon className="h-5 w-5" aria-hidden="true" />
                        Back to App
                    </Link>
                    <Image
                        src={motifStudioLogo}
                        alt="Motif Studio"
                        className="h-8 w-auto object-contain dark:filter dark:invert"
                    />
                </div>
            </div>
        </header>
    );
}
