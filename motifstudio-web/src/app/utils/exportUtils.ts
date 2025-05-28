import { HostListing } from "../api";

export function exportAsJSON(queryText: string, currentGraph?: HostListing, includeGraph: boolean = true) {
    const exportData = {
        queryText,
        graph: includeGraph ? currentGraph : undefined,
        exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `motifstudio-export-${new Date().getTime()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}
