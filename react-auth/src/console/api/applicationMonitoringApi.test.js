import { fetchApplicationMonitoring } from "./consoleApi";
import { authAxios } from "../../interceptors/axios";
jest.mock("../../interceptors/axios", () => ({ authAxios: { get: jest.fn() }, publicAxios: {} }));
test("monitoring GET uses scoped authenticated path and exact environment without any operator fallback", async () => {
 authAxios.get.mockResolvedValue({ data: { schema_version: 1 } });
 expect(await fetchApplicationMonitoring("org/a", "app/b", "production")).toEqual({ schema_version: 1 });
 expect(authAxios.get).toHaveBeenCalledWith("/organizations/org%2Fa/applications/app%2Fb/monitoring/", { params: { environment: "production" } });
 expect(authAxios.get).toHaveBeenCalledTimes(1);
});
