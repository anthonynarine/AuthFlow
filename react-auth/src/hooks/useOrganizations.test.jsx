import { renderHook, waitFor } from "@testing-library/react";
import { useOrganizations } from "./useOrganizations";
import { authAxios } from "../interceptors/axios";

jest.mock("../interceptors/axios", () => ({
    authAxios: { get: jest.fn(), post: jest.fn() },
}));

describe("useOrganizations", () => {
    test("reports loading from the moment it is enabled until the first fetch finishes", async () => {
        let resolveFetch;
        authAxios.get.mockReturnValue(new Promise((resolve) => { resolveFetch = resolve; }));

        const { result, rerender } = renderHook(({ enabled }) => useOrganizations(enabled), {
            initialProps: { enabled: false },
        });
        expect(result.current.isLoading).toBe(false);

        // Session restored: the hook becomes enabled. It must never report
        // "not loading, zero organizations" before its fetch completes --
        // callers would send an existing customer to onboarding.
        rerender({ enabled: true });
        expect(result.current.isLoading).toBe(true);
        expect(result.current.organizations).toEqual([]);

        resolveFetch({ data: [{ id: "1", name: "Acme", slug: "acme" }] });
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.organizations).toHaveLength(1);
    });
});
