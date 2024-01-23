import motifStudioLogo from "./motif-studio.png";
import Image from "next/image";
export function Appbar() {
    return (
        <div className="w-full items-center justify-between font-mono text-sm lg:flex p-4">
            <div className="flex flex-col justify-center w-full h-full p-4 bg-white rounded-lg shadow-lg">
                <Image src={motifStudioLogo} alt="Motif Studio" className="object-contain h-8 object-left" />
            </div>
        </div>
    );
}
