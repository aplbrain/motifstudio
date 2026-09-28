import { StrictMode } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SWRConfig, useSWRConfig } from "swr";
import { BASE_URL } from "./api";
import { ResultsFetcher } from "./ResultsFetcher";

const graph = { id: "graph-1", name: "Example graph", uri: "", provider: {} };
const swrKey = [`${BASE_URL}/queries/motifs`, graph.id, "A -> B", "dotmotif", 10];

function RevalidateButton() {
    const { mutate } = useSWRConfig();
    return <button onClick={() => void mutate(swrKey)}>Revalidate</button>;
}

describe("ResultsFetcher", () => {
    afterEach(() => vi.unstubAllGlobals());

    it("keeps the initial query alive through development Strict Mode remounting", async () => {
        let abortCount = 0;
        const fetchMock = vi.fn((_url: string, init: RequestInit) =>
            new Promise<Response>((resolve, reject) => {
                const timer = setTimeout(
                    () =>
                        resolve(
                            new Response(
                                JSON.stringify({
                                    motif_count: 1,
                                    motif_results: [],
                                    motif_entities: ["A", "B"],
                                    response_duration_ms: 50,
                                })
                            )
                        ),
                    50
                );
                init.signal?.addEventListener(
                    "abort",
                    () => {
                        clearTimeout(timer);
                        abortCount += 1;
                        reject(new DOMException("The operation was aborted.", "AbortError"));
                    },
                    { once: true }
                );
            })
        );
        vi.stubGlobal("fetch", fetchMock);

        render(
            <SWRConfig value={{ provider: () => new Map(), shouldRetryOnError: false, revalidateOnFocus: false }}>
                <StrictMode>
                    <ResultsFetcher graph={graph} query="A -> B" queryType="dotmotif" limit={10} />
                </StrictMode>
            </SWRConfig>
        );

        expect(await screen.findByText("Result count")).toBeInTheDocument();
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(abortCount).toBe(0);
    });

    it("shares an in-flight request when the same query revalidates", async () => {
        const resolveRequests: Array<(response: Response) => void> = [];
        let abortCount = 0;
        const fetchMock = vi.fn((_url: string, init: RequestInit) =>
            new Promise<Response>((resolve, reject) => {
                resolveRequests.push(resolve);
                init.signal?.addEventListener("abort", () => {
                    abortCount += 1;
                    reject(new DOMException("The operation was aborted.", "AbortError"));
                });
            })
        );
        vi.stubGlobal("fetch", fetchMock);

        render(
            <SWRConfig value={{ provider: () => new Map() }}>
                <ResultsFetcher graph={graph} query="A -> B" queryType="dotmotif" limit={10} />
                <RevalidateButton />
            </SWRConfig>
        );

        expect(fetchMock).toHaveBeenCalledTimes(1);
        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: "Revalidate" }));
        });
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(abortCount).toBe(0);

        await act(async () => {
            resolveRequests[0](
                new Response(JSON.stringify({
                    motif_count: 1,
                    motif_results: [],
                    motif_entities: ["A", "B"],
                    response_duration_ms: 50,
                }))
            );
        });
        expect(await screen.findByText("Result count")).toBeInTheDocument();
        expect(screen.queryByText(/Error fetching query/)).not.toBeInTheDocument();
    });

    it("shows a real request error until the user retries it", async () => {
        const fetchMock = vi.fn()
            .mockRejectedValueOnce(new Error("Network unavailable"))
            .mockResolvedValueOnce(new Response(JSON.stringify({
                motif_count: 1,
                motif_results: [],
                motif_entities: ["A", "B"],
                response_duration_ms: 50,
            })));
        vi.stubGlobal("fetch", fetchMock);

        render(
            <SWRConfig value={{ provider: () => new Map() }}>
                <ResultsFetcher graph={graph} query="A -> B" queryType="dotmotif" limit={10} />
            </SWRConfig>
        );

        expect(await screen.findByText(/Error fetching query: Network unavailable/)).toBeInTheDocument();
        expect(fetchMock).toHaveBeenCalledTimes(1);
        fireEvent.click(screen.getByRole("button", { name: "Retry query" }));
        expect(await screen.findByText("Result count")).toBeInTheDocument();
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });
});
