import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ResultsWrapper } from "./ResultsWrapper";

vi.mock("./ResultsFetcher", () => ({
    ResultsFetcher: ({ query, queryType, limit }: { query: string; queryType: string; limit: number }) => (
        <div data-testid="results">{`${query}:${queryType}:${limit}`}</div>
    ),
}));

const graph = { id: "graph-1", name: "Graph", uri: "", provider: {} };

describe("ResultsWrapper", () => {
    it("uses the selected result limit", () => {
        render(<ResultsWrapper graph={graph} query="A -> B" queryType="dotmotif" />);

        fireEvent.change(screen.getByLabelText("Result limit"), { target: { value: "250" } });
        fireEvent.click(screen.getByRole("button", { name: "Run Query" }));

        expect(screen.getByTestId("results")).toHaveTextContent("A -> B:dotmotif:250");
    });

    it("requires another run when graph, query, or language changes", async () => {
        const { rerender } = render(<ResultsWrapper graph={graph} query="A -> B" queryType="dotmotif" />);
        fireEvent.click(screen.getByRole("button", { name: "Run Query" }));

        rerender(<ResultsWrapper graph={graph} query="MATCH (n)" queryType="cypher" />);

        await waitFor(() => expect(screen.queryByTestId("results")).not.toBeInTheDocument());
        expect(screen.getByRole("button", { name: "Run Query" })).toBeInTheDocument();
    });
});
