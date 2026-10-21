import { fetchHostedEnrollment, configureHostedEnrollment, revokeHostedEnrollment } from "./consoleApi";
import { authAxios } from "../../interceptors/axios";
jest.mock("../../interceptors/axios", () => ({ authAxios: { get: jest.fn(), put: jest.fn(), post: jest.fn() }, publicAxios: {} }));
test("hosted enrollment uses configured authenticated tenant app transport and strict payloads", async () => {
 authAxios.get.mockResolvedValue({ data: {} }); authAxios.put.mockResolvedValue({ data: {} }); authAxios.post.mockResolvedValue({ data: {} });
 await fetchHostedEnrollment("org/a", "id/b"); await configureHostedEnrollment("org/a", "id/b", ["http://localhost:3000"]); await revokeHostedEnrollment("org/a", "id/b");
 const path = "/organizations/org%2Fa/applications/id%2Fb/hosted-enrollment/";
 expect(authAxios.get).toHaveBeenCalledWith(path); expect(authAxios.put).toHaveBeenCalledWith(path, { origins: ["http://localhost:3000"] }); expect(authAxios.post).toHaveBeenCalledWith(path, { action: "revoke" });
});
