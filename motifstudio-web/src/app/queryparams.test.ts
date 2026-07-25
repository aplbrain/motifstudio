import { beforeEach, describe, expect, it } from "vitest";
import { getQueryParams, updateQueryParams } from "./queryparams";

describe("query parameters", () => {
    beforeEach(() => {
        window.history.replaceState({}, "", "/studio?untouched=value");
    });

    it("round-trips query text without double encoding", () => {
        const motif = "A -> B\nB[weight >= 2]";

        updateQueryParams({ motif, query_type: "cypher" });

        expect(getQueryParams()).toMatchObject({ motif, query_type: "cypher" });
        expect(window.location.search).toContain("motif=A+-%3E+B%0AB%5Bweight+%3E%3D+2%5D");
        expect(window.location.search).toContain("untouched=value");
    });

    it("removes empty values and defaults the query language", () => {
        updateQueryParams({ untouched: "", host_id: "graph-1" });

        expect(window.location.search).toBe("?host_id=graph-1");
        expect(getQueryParams().query_type).toBe("dotmotif");
    });
});
