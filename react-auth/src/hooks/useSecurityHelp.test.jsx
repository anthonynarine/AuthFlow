import { renderHook, waitFor } from "@testing-library/react";
import { useSecurityHelp, __resetSecurityHelpCacheForTests } from "./useSecurityHelp";
import { authAxios } from "../interceptors/axios";

jest.mock("../interceptors/axios", () => ({
  authAxios: {
    get: jest.fn(),
  },
}));

describe("useSecurityHelp", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __resetSecurityHelpCacheForTests();
  });

  test("loads the help registry once and exposes topic lookup by key", async () => {
    authAxios.get.mockResolvedValue({
      data: [
        { key: "security_posture", title: "Security Posture", short_description: "Summary." },
        { key: "controls", title: "Controls", short_description: "Protections." },
      ],
    });

    const { result } = renderHook(() => useSecurityHelp());

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(authAxios.get).toHaveBeenCalledWith("/security/help/");
    expect(result.current.getTopic("security_posture")).toEqual({
      key: "security_posture",
      title: "Security Posture",
      short_description: "Summary.",
    });
    expect(result.current.getTopic("unknown_topic")).toBe(null);
    expect(result.current.error).toBe(null);
  });

  test("fetches the registry only once across multiple hook instances", async () => {
    authAxios.get.mockResolvedValue({ data: [{ key: "controls", title: "Controls", short_description: "x" }] });

    const { result: first } = renderHook(() => useSecurityHelp());
    const { result: second } = renderHook(() => useSecurityHelp());

    await waitFor(() => expect(first.current.isLoading).toBe(false));
    await waitFor(() => expect(second.current.isLoading).toBe(false));

    expect(authAxios.get).toHaveBeenCalledTimes(1);
    expect(second.current.getTopic("controls")).toBeTruthy();
  });

  test("does not throw on failure and leaves topic lookup returning null", async () => {
    const error = { response: { status: 500 } };
    authAxios.get.mockRejectedValue(error);

    const { result } = renderHook(() => useSecurityHelp());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe(error);
    expect(result.current.getTopic("security_posture")).toBe(null);
  });
});
