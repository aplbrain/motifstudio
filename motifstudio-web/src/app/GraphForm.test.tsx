import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { GraphForm } from "./GraphForm";

vi.mock("swr", () => ({
    default: () => ({
        data: { hosts: [{ id: "graph-1", name: "Example connectome", uri: "", provider: {} }] },
        error: undefined,
        isLoading: false,
    }),
}));
vi.mock("./hooks/useClientOnly", () => ({ useClientOnly: () => true }));
vi.mock("./GraphUpload", () => ({ GraphUpload: () => null }));

describe("GraphForm", () => {
    it("opens the graph list when its input is focused", async () => {
        const user = userEvent.setup();
        render(<GraphForm />);

        await user.click(screen.getByRole("combobox", { name: "Search host graphs" }));

        expect(await screen.findByRole("option", { name: /Example connectome/ })).toBeVisible();
    });
});
