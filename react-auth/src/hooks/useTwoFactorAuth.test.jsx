import { renderHook, act } from "@testing-library/react";
import { useTwoFactorAuth } from "./useTwoFactorAuth";
import { authAxios, publicAxios } from "../interceptors/axios";
import { persistAuthTokens } from "../interceptors/tokenStorage";

const mockNavigate = jest.fn();
const mockSetIsLoggedIn = jest.fn();
const mockSetUser = jest.fn();

jest.mock("react-router-dom", () => ({
    useNavigate: () => mockNavigate,
}));

jest.mock("../interceptors/axios", () => ({
    authAxios: { post: jest.fn(), patch: jest.fn(), get: jest.fn() },
    publicAxios: { post: jest.fn() },
    SESSION_TRANSPORT: { session_transport: "cookie" },
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

describe("useTwoFactorAuth session transport", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("2FA login asks for cookie transport and keeps only the access token", async () => {
        publicAxios.post.mockResolvedValue({
            status: 200,
            data: { access_token: "access-2fa" },
        });
        const { result } = renderHook(() => useTwoFactorAuth());

        await act(async () => {
            await result.current.verify2FA("123456");
        });

        expect(publicAxios.post).toHaveBeenCalledWith("/two-factor-login/", {
            otp: "123456",
            session_transport: "cookie",
        });
        expect(authAxios.post).not.toHaveBeenCalled();
        expect(persistAuthTokens).toHaveBeenCalledWith(expect.objectContaining({ accessToken: "access-2fa" }));
        expect(mockSetIsLoggedIn).toHaveBeenCalledWith(true);
        expect(mockNavigate).toHaveBeenCalledWith("/workspace");
    });
});
