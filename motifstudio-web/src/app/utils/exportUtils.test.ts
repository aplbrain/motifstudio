import { afterEach, describe, expect, it, vi } from "vitest";
import { exportAsJSON } from "./exportUtils";

describe("exportAsJSON", () => {
    afterEach(() => vi.restoreAllMocks());

    it("exports the query language and revokes its object URL", async () => {
        const createObjectURL = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:export");
        const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
        const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
        let blob: Blob | undefined;
        createObjectURL.mockImplementation((value) => {
            blob = value as Blob;
            return "blob:export";
        });

        exportAsJSON("MATCH (n)", "cypher", undefined, false);

        expect(click).toHaveBeenCalledOnce();
        expect(revokeObjectURL).toHaveBeenCalledWith("blob:export");
        await expect(blob?.text()).resolves.toContain('"queryType": "cypher"');
    });
});
