import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Home from "./page";
import { getQueryParams, updateQueryParams } from "./queryparams";

vi.mock("next/dynamic", () => ({
    default: () => () => <div />,
}));

vi.mock("./Appbar", () => ({ Appbar: () => <div /> }));
vi.mock("./GraphForm", () => ({ GraphForm: () => <div /> }));
vi.mock("./GraphStats", () => ({ GraphStats: () => <div /> }));
vi.mock("./ResultsWrapper", () => ({ ResultsWrapper: () => <div /> }));
vi.mock("./queryparams", () => ({
    getQueryParams: vi.fn(),
    updateQueryParams: vi.fn(),
}));

describe("Home URL initialization", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.mocked(getQueryParams).mockReturnValue({
            host_id: "",
            host_name: "",
            motif: "A -> B",
            query_type: "dotmotif",
        });
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    it("does not erase a shared motif before its debounced value is restored", () => {
        render(<Home />);

        expect(updateQueryParams).not.toHaveBeenCalled();

        act(() => {
            vi.advanceTimersByTime(500);
        });

        expect(updateQueryParams).toHaveBeenCalledWith({ motif: "A -> B" });
    });
});
