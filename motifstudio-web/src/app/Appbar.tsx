import motifStudioLogo from "./motif-studio.png";
import Image from "next/image";
import { FileMenu } from "./FileMenu";
import { PrimitivesMenu } from "./components/PrimitivesMenu";
import { HostListing } from "./api";

interface AppbarProps {
    queryText: string;
    currentGraph?: HostListing;
    onLoad: (data: { queryText: string; graph?: HostListing }) => void;
    onInsertPrimitive: (dotmotif: string) => void;
}

export function Appbar({ queryText, currentGraph, onLoad, onInsertPrimitive }: AppbarProps) {
    return (
        <div className="w-full items-center justify-between font-mono text-sm lg:flex p-4">
            <div className="flex flex-row justify-between items-center w-full h-full p-4 bg-white rounded-lg shadow-lg dark:bg-gray-800">
                <div className="flex items-center space-x-4">
                    <FileMenu queryText={queryText} currentGraph={currentGraph} onLoad={onLoad} />
                    <PrimitivesMenu onInsertPrimitive={onInsertPrimitive} />
                </div>
                <Image
                    src={motifStudioLogo}
                    alt="Motif Studio"
                    // In dark mode, invert the logo colors. (Check theme with tailwind)
                    className="object-contain h-8 w-auto dark:filter dark:invert"
                />
            </div>
        </div>
    );
}
