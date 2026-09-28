import motifStudioLogo from "./motif-studio.png";
import Image from "next/image";
import { FileMenu } from "./FileMenu";
import { PrimitivesMenu } from "./components/PrimitivesMenu";
import { HostListing } from "./api";
import { HelpMenu } from "./components/HelpMenu";

interface AppbarProps {
    queryText: string;
    queryType: "dotmotif" | "cypher";
    currentGraph?: HostListing;
    onLoad: (data: { queryText: string; graph?: HostListing }) => void;
    onInsertPrimitive: (dotmotif: string) => void;
}

export function Appbar({ queryText, queryType, currentGraph, onLoad, onInsertPrimitive }: AppbarProps) {
    return (
        <header className="w-full border-b border-slate-200 bg-white/95 dark:border-slate-800 dark:bg-slate-950">
            <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
                <nav aria-label="Workspace menu" className="flex items-center gap-1 text-sm">
                    <FileMenu queryText={queryText} queryType={queryType} currentGraph={currentGraph} onLoad={onLoad} />
                    <PrimitivesMenu onInsertPrimitive={onInsertPrimitive} />
                    <HelpMenu />
                </nav>
                <Image src={motifStudioLogo} alt="Motif Studio" className="ml-auto h-8 w-auto dark:invert" priority />
            </div>
        </header>
    );
}
