import motifStudioLogo from "./motif-studio.png";
import Image from "next/image";
export function Appbar() {
    return (
        <div className="w-full items-center justify-between font-mono text-sm lg:flex p-4">
            <div className="flex flex-col justify-center w-full h-full p-4 bg-white rounded-lg shadow-lg dark:bg-gray-800">
                <Image
                    src={motifStudioLogo}
                    alt="Motif Studio"
                    // In dark mode, invert the logo colors. (Check theme with tailwind)
                    className="object-contain h-8 object-left w-auto dark:filter dark:invert"
                />
            </div>
        </div>
    );
}
