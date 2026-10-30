import { fetchHostedEnrollment, configureHostedEnrollment, revokeHostedEnrollment, saveLoginRegistration } from "./consoleApi";
import { authAxios } from "../../interceptors/axios";
jest.mock("../../interceptors/axios", () => ({ authAxios: { get: jest.fn(), put: jest.fn(), post: jest.fn() }, publicAxios: {} }));
test("hosted enrollment uses configured authenticated tenant app transport and strict payloads", async () => {
 authAxios.get.mockResolvedValue({ data: {} }); authAxios.put.mockResolvedValue({ data: {} }); authAxios.post.mockResolvedValue({ data: {} });
 await fetchHostedEnrollment("org/a", "id/b"); await configureHostedEnrollment("org/a", "id/b", ["http://localhost:3000"]); await revokeHostedEnrollment("org/a", "id/b");
 const path = "/organizations/org%2Fa/applications/id%2Fb/hosted-enrollment/";
 expect(authAxios.get).toHaveBeenCalledWith(path); expect(authAxios.put).toHaveBeenCalledWith(path, { origins: ["http://localhost:3000"] }); expect(authAxios.post).toHaveBeenCalledWith(path, { action: "revoke" });
});

test("MFA policy is included only when explicitly supplied in either registration flow", async () => {
 authAxios.put.mockResolvedValue({ data: {} });
 await configureHostedEnrollment("org/a", "id/b", ["http://localhost:5173"], "optional");
 expect(authAxios.put).toHaveBeenLastCalledWith("/organizations/org%2Fa/applications/id%2Fb/hosted-enrollment/", { origins: ["http://localhost:5173"], mfa_policy: "optional" });
 const values = { backend_url: "https://api.example.test", login_origin: "https://app.example.test" };
 await saveLoginRegistration("org/a", "id/b", { ...values, mfa_policy: "required", arbitrary: true });
 expect(authAxios.put).toHaveBeenLastCalledWith("/organizations/org%2Fa/applications/id%2Fb/login-registration/", { ...values, mfa_policy: "required" });
 await saveLoginRegistration("org/a", "id/b", values);
 expect(authAxios.put).toHaveBeenLastCalledWith("/organizations/org%2Fa/applications/id%2Fb/login-registration/", values);
});
