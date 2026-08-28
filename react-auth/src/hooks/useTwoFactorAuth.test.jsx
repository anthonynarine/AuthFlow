import { renderHook, act } from "@testing-library/react";
import { useTwoFactorAuth } from "./useTwoFactorAuth";
import { authAxios } from "../interceptors/axios";
import { persistAuthTokens } from "../interceptors/tokenStorage";

const mockNavigate = jest.fn();
const mockSetIsLoggedIn = jest.fn();
const mockSetUser = jest.fn();

jest.mock("react-router-dom", () => ({
    useNavigate: () => mockNavigate,
}));

jest.mock("../interceptors/axios", () => ({
    authAxios: {
        post: jest.fn(),
        patch: jest.fn(),
        get: jest.fn(),
    },
}));

jest.mock("../interceptors/tokenStorage", () => ({
    persistAuthTokens: jest.fn(),
}));

jest.mock("../context/auth/BasicAuthContext", () => ({
    useBasicAuthServices: () => ({
        setIsLoggedIn: mockSetIsLoggedIn,
        setUser: mockSetUser,
    }),
}));

describe("useTwoFactorAuth A1.5 integration", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockNavigate.mockClear();
        mockSetIsLoggedIn.mockClear();
        mockSetUser.mockClear();
    });

    test("2FA login stores access and refresh tokens", async () => {
        authAxios.post.mockResolvedValue({
            status: 200,
            data: { access_token: "access-2fa", refresh_token: "refresh-2fa" },
        });
        const { result } = renderHook(() => useTwoFactorAuth());

        await act(async () => {
            await result.current.verify2FA("123456");
        });

        expect(authAxios.post).toHaveBeenCalledWith("/two-factor-login/", { otp: "123456" });
        expect(persistAuthTokens).toHaveBeenCalledWith({
            accessToken: "access-2fa",
            refreshToken: "refresh-2fa",
        });
        expect(mockSetIsLoggedIn).toHaveBeenCalledWith(true);
        expect(mockNavigate).toHaveBeenCalledWith("/");
    });
});
