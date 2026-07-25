import { HostListing } from "../api";

export function exportAsJSON(
    queryText: string,
    queryType: "dotmotif" | "cypher",
    currentGraph?: HostListing,
    includeGraph: boolean = true
) {
    const exportData = {
        queryText,
        queryType,
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
