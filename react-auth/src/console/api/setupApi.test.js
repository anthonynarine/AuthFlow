import { fetchSetupHelp, deleteUnusedApplication } from "./consoleApi";
import { authAxios } from "../../interceptors/axios";
jest.mock("../../interceptors/axios", () => ({ authAxios: { post: jest.fn(), delete: jest.fn() }, publicAxios: {} }));
beforeEach(() => jest.clearAllMocks());
test("setup helper forwards only categorical values to the scoped authenticated endpoint", async () => {
 authAxios.post.mockResolvedValue({ data: { source: "guide", explanation: "Help" } });
 await fetchSetupHelp("org/a", "id/b", { framework: "django", step: "storage", issue: "missing_key", raw_secret: "never-forward" });
 expect(authAxios.post).toHaveBeenCalledWith("/organizations/org%2Fa/applications/id%2Fb/setup-help/", { framework: "django", step: "storage", issue: "missing_key" });
});
test("deletion uses authenticated scope and explicit confirmation; denial propagates", async () => {
 authAxios.delete.mockRejectedValue({ response: { status: 409 } });
 await expect(deleteUnusedApplication("org/a", "id/b", "moneta")).rejects.toEqual({ response: { status: 409 } });
 expect(authAxios.delete).toHaveBeenCalledWith("/organizations/org%2Fa/applications/id%2Fb/", { data: { confirmation_slug: "moneta" } });
});
