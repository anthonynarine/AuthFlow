import { renderHook, act } from "@testing-library/react";
import { useBasicAuth } from "./useBasicAuth";
import { publicAxios } from "../interceptors/axios";
import { getRefreshToken } from "../interceptors/tokenStorage";

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
    useNavigate: () => mockNavigate,
}));

jest.mock("../interceptors/axios", () => ({
    publicAxios: {
        post: jest.fn(),
    },
}));

jest.mock("../interceptors/tokenStorage", () => ({
    getRefreshToken: jest.fn(),
}));

describe("useBasicAuth A1.5 integration", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockNavigate.mockClear();
    });

    test("logout uses the current rotated refresh token", async () => {
        getRefreshToken.mockReturnValue("refresh-a2");
        publicAxios.post.mockResolvedValue({ data: { message: "Signed out" } });
        const { result } = renderHook(() => useBasicAuth());

        await act(async () => {
            await result.current.logout();
        });

        expect(publicAxios.post).toHaveBeenCalledWith(
            "/logout/",
            {},
            { headers: { Authorization: "Bearer refresh-a2" } }
        );
        expect(result.current.isLoggedIn).toBe(false);
    });
});
