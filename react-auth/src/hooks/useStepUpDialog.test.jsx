import { act, renderHook } from "@testing-library/react";
import { useStepUpDialog } from "./useStepUpDialog";
import { authAxios } from "../interceptors/axios";

jest.mock("../interceptors/axios", () => ({
  authAxios: {
    post: jest.fn(),
  },
}));

describe("useStepUpDialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("flattens object-shaped API proof errors into dialog-safe text", async () => {
    authAxios.post.mockRejectedValue({
      response: {
        status: 400,
        data: {
          error: {
            current_password: "Current password is incorrect.",
          },
        },
      },
    });

    const { result } = renderHook(() => useStepUpDialog());

    act(() => {
      result.current.requestStepUp(
        {
          response: {
            status: 403,
            data: {
              code: "STEP_UP_REQUIRED",
              required_strength: "password",
            },
          },
        },
        "changing your password"
      );
    });

    await act(async () => {
      await result.current.submitStepUp({ currentPassword: "wrong", otp: "" });
    });

    expect(result.current.state.status).toBe("failed");
    expect(result.current.state.error).toBe("Current password is incorrect.");
  });
});
