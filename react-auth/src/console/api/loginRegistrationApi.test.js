import { fetchLoginRegistration, saveLoginRegistration, challengeLoginRegistration, verifyLoginRegistration, revokeLoginRegistration, changeLoginRegistrationTransport } from "./consoleApi";
import { authAxios } from "../../interceptors/axios";
jest.mock("../../interceptors/axios", () => ({ authAxios: { get: jest.fn(), put: jest.fn(), post: jest.fn() }, publicAxios: {} }));
beforeEach(() => { jest.clearAllMocks(); authAxios.get.mockResolvedValue({ data: {} }); authAxios.put.mockResolvedValue({ data: {} }); authAxios.post.mockResolvedValue({ data: {} }); });
test("all registration calls use authenticated encoded tenant/application scope", async () => {
 await fetchLoginRegistration("org/a", "id/b"); await saveLoginRegistration("org/a", "id/b", { backend_url: "https://backend.test", login_origin: "https://front.test", audience: "must-not-send", raw_secret: "must-not-send" });
 await challengeLoginRegistration("org/a", "id/b"); await verifyLoginRegistration("org/a", "id/b"); await revokeLoginRegistration("org/a", "id/b");
 const path = "/organizations/org%2Fa/applications/id%2Fb/login-registration/";
 expect(authAxios.get).toHaveBeenCalledWith(path);
 expect(authAxios.put).toHaveBeenCalledWith(path, { backend_url: "https://backend.test", login_origin: "https://front.test" });
 expect(authAxios.post.mock.calls).toEqual([[path + "challenge/", {}], [path + "verify/", {}], [path + "revoke/", {}]]);
});

 test("transport uses the authenticated scoped endpoint with one allowed field", async () => {
 await changeLoginRegistrationTransport("org/a", "id/b", "cookie");
 expect(authAxios.post).toHaveBeenCalledWith("/organizations/org%2Fa/applications/id%2Fb/login-registration/transport/", { session_transport: "cookie" });
 });
