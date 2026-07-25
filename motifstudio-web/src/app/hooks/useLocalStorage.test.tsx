import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useLocalStorage } from "./useLocalStorage";

describe("useLocalStorage", () => {
    beforeEach(() => localStorage.clear());

    it("restores saved query languages and defaults legacy projects", async () => {
        localStorage.setItem(
            "motifstudio-projects",
            JSON.stringify([
                { id: "1", name: "Cypher", queryText: "MATCH (n)", queryType: "cypher", timestamp: "2026-01-01" },
                { id: "2", name: "Legacy", queryText: "A -> B", timestamp: "2026-01-02" },
            ])
        );

        const { result } = renderHook(() => useLocalStorage());

        await waitFor(() => expect(result.current.savedProjects).toHaveLength(2));
        expect(result.current.savedProjects.map((project) => project.queryType)).toEqual(["cypher", "dotmotif"]);
    });

    it("persists new projects and deletes them", () => {
        const { result } = renderHook(() => useLocalStorage());

        act(() => {
            result.current.saveProject({
                id: "",
                name: "Saved query",
                queryText: "MATCH (n)",
                queryType: "cypher",
                timestamp: "",
            });
        });

        expect(JSON.parse(localStorage.getItem("motifstudio-projects") || "[]")[0].queryType).toBe("cypher");

        act(() => result.current.deleteProject(result.current.savedProjects[0].id));
        expect(localStorage.getItem("motifstudio-projects")).toBe("[]");
    });
});
