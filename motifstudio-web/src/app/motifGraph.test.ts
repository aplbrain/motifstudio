import { describe, expect, it } from "vitest";
import { getMotifGraphEdges } from "./motifGraph";

describe("motif node-link edges", () => {
    it("reads the current NetworkX edges field", () => {
        const edges = [{ source: "A", target: "B" }];

        expect(getMotifGraphEdges({ edges })).toBe(edges);
    });

    it("continues to support NetworkX's legacy links field", () => {
        const links = [{ source: "A", target: "B" }];

        expect(getMotifGraphEdges({ links })).toBe(links);
    });

    it("handles malformed or missing edge lists without rendering invalid elements", () => {
        expect(getMotifGraphEdges({ edges: "not-an-array" })).toEqual([]);
        expect(getMotifGraphEdges({})).toEqual([]);
    });
});
