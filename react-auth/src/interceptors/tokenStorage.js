import Cookies from "js-cookie";

const baseURL = process.env.REACT_APP_USE_PRODUCTION_API === "true"
    ? process.env.REACT_APP_PRODUCTION_URL
    : process.env.NODE_ENV === "development"
        ? process.env.REACT_APP_DEV_URL
        : process.env.REACT_APP_PRODUCTION_URL;

const isProduction = baseURL?.includes("ant-django-auth-62cf01255868.herokuapp.com");

const accessTokenCookieOptions = {
    expires: 1 / 96,
    secure: isProduction,
    sameSite: isProduction ? "None" : "Lax",
};

const refreshTokenCookieOptions = {
    expires: 7,
    secure: isProduction,
    sameSite: isProduction ? "None" : "Lax",
};

export function getAccessToken() {
    return Cookies.get("access_token");
}

export function getRefreshToken() {
    return Cookies.get("refresh_token");
}

export function persistAuthTokens({ accessToken, refreshToken }) {
    if (!accessToken) {
        return;
    }

    Cookies.set("access_token", accessToken, accessTokenCookieOptions);

    if (refreshToken) {
        Cookies.set("refresh_token", refreshToken, refreshTokenCookieOptions);
    }
}

export function clearAuthTokens() {
    Cookies.remove("access_token");
    Cookies.remove("refresh_token");
    Cookies.remove("csrftoken");
    Cookies.remove("sessionid");
}

export { accessTokenCookieOptions, refreshTokenCookieOptions, isProduction };
