import { afterEach, describe, expect, it, vi } from "vitest";
import { bodiedFetcher, fetcher } from "./api";

describe("API fetchers", () => {
    afterEach(() => vi.restoreAllMocks());

    it("returns parsed successful responses", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }))));

        await expect(fetcher("/api/test")).resolves.toEqual({ ok: true });
    });

    it("surfaces API error details", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue(
                new Response(JSON.stringify({ detail: "Graph not found" }), {
                    status: 404,
                    headers: { "Content-Type": "application/json" },
                })
            )
        );

        await expect(fetcher("/api/test")).rejects.toThrow("Graph not found");
    });

    it("preserves request options while posting JSON", async () => {
        const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true })));
        vi.stubGlobal("fetch", fetchMock);
        const controller = new AbortController();

        await bodiedFetcher("/api/test", { query: "A -> B" }, { signal: controller.signal });

        expect(fetchMock).toHaveBeenCalledWith("/api/test", {
            method: "POST",
            signal: controller.signal,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: "A -> B" }),
        });
    });
});
