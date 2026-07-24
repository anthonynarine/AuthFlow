import axios from "axios";
import Cookies from "js-cookie";

// Define a variable 'baseURL' that will store the base URL for API requests.
const baseURL = process.env.REACT_APP_USE_PRODUCTION_API === 'true'
    // First, check if the REACT_APP_USE_PRODUCTION_API environment variable is explicitly set to 'true'.
    ? process.env.REACT_APP_PRODUCTION_URL
    // If it is true, set 'baseURL' to the value of the REACT_APP_PRODUCTION_URL environment variable.
    : process.env.NODE_ENV === 'development'
        // If REACT_APP_USE_PRODUCTION_API is not 'true', check if the application is running in development mode.
        ? process.env.REACT_APP_DEV_URL
        // If the NODE_ENV is 'development', set 'baseURL' to the value of the REACT_APP_DEV_URL environment variable.
        : process.env.REACT_APP_PRODUCTION_URL;
        // If none of the above conditions are met, default to using the production URL.
        // This covers scenarios where NODE_ENV might be set to 'test' or 'production', or any other non-development environment.

const isProduction = baseURL.includes("ant-django-auth-62cf01255868.herokuapp.com");

// Function to log and handle errors in Axios requests or responses.
const logError = (error) => {
    console.error(`Error in request to ${error.config.url}: ${error.message}`);
    return Promise.reject(error);
};


// Axios instance for public (non-authenticated) requests. Configured with base URL and CSRF token handling.
const publicAxios = axios.create({
    baseURL: baseURL,
    withCredentials: true, // Necessary for cookies, especially if CSRF protection is enabled server-side.
});

// Interceptor to attach CSRF token for every public request
publicAxios.interceptors.request.use((config) => {
    const csrfToken = Cookies.get("csrftoken");
    if (csrfToken) {
        config.headers["X-CSRFToken"] = csrfToken;
    }

    return config;
}, logError);

publicAxios.interceptors.response.use((response) => {
    // Update CSRF token if a new one is provided in the response
    const newCsrfToken = response.headers["x-csrftoken"];
    if (newCsrfToken) {
        Cookies.set("csrftoken", newCsrfToken, {
            secure: isProduction,
            sameSite: isProduction ? "None" : "Lax"
        });
    }
    // Set access and refresh tokens if present in the response
    const accessToken = response.data.access_token;
    const refreshToken = response.data.refresh_token;

    if (accessToken) {
        Cookies.set("access_token", accessToken, {
            expires: 1 / 96, // 15 minutes expiry
            secure: isProduction,
            sameSite: isProduction ? "None" : "Lax"
        });
    }

    if (refreshToken) {
        Cookies.set("refresh_token", refreshToken, {
            expires: 7, // 7 days expiry
            secure: isProduction,
            sameSite: isProduction ? "None" : "Lax"
        });
    }

    // Handle logout response and remove tokens
    if (response.config.url.includes("/logout/")) {
      Cookies.remove("access_token");
      Cookies.remove("refresh_token");
      Cookies.remove("csrftoken");
      Cookies.remove("sessionid");
    }

    return response;
}, logError);

// AUTHENTICATED AXIOS INSTANCE for private (authenticated) requests with token and CSRF handling.
const authAxios = axios.create({
    baseURL: baseURL,
    withCredentials: true,
});

// Interceptor to attach the access token to each request
authAxios.interceptors.request.use((config) => {
    const accessToken = Cookies.get("access_token");
    // Don't override an Authorization header a caller already set explicitly
    // (e.g. the /token-refresh/ call below, which must send the refresh token,
    // not the expired access token).
    if (accessToken && !config.headers["Authorization"]) {
        config.headers["Authorization"] = `Bearer ${accessToken}`;
    }
    const csrfToken = Cookies.get("csrftoken");
    if (csrfToken) {
        config.headers["X-CSRFToken"] = csrfToken;
    }

    return config;
}, logError);

// Response interceptor for handling automatic token refresh on authentication failures
authAxios.interceptors.response.use(
    (response) => {
        // Check for and update the CSRF token as needed
        const newCsrfToken = response.headers["x-csrftoken"];
        if (newCsrfToken) {
            Cookies.set("csrftoken", newCsrfToken, {
                secure: isProduction,
                sameSite: isProduction ? "None" : "Lax"
            });
        }
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        // Handle expired access tokens and attempt to refresh them once
        if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const refreshToken = Cookies.get("refresh_token");
                // The backend's RefreshAPIView reads the refresh token from the
                // Authorization header only (it never reads the request body), so
                // it must be sent explicitly here rather than in the JSON body.
                const response = await authAxios.post(
                    "/token-refresh/",
                    {},
                    {
                        headers: { Authorization: `Bearer ${refreshToken}` },
                        withCredentials: true
                    }
                );
                if (response.status === 200) {
                    const newAccessToken = response.data.access_token;
                    // RefreshAPIView only returns a new access_token today (refresh
                    // tokens aren't rotated), so only overwrite the refresh_token
                    // cookie if the backend actually sends one back.
                    const newRefreshToken = response.data.refresh_token;
                    Cookies.set("access_token", newAccessToken, {
                        expires: 1 / 96,
                        secure: isProduction,
                        sameSite: isProduction ? "None" : "Lax"
                    });
                    if (newRefreshToken) {
                        Cookies.set("refresh_token", newRefreshToken, {
                            expires: 7,
                            secure: isProduction,
                            sameSite: isProduction ? "None" : "Lax"
                        });
                    }
                    originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
                    // Update Axios default headers for subsequent requests
                    authAxios.defaults.headers.common[
                        "Authorization"
                    ] = `Bearer ${newAccessToken}`;
                    return authAxios(originalRequest);
                }
            } catch (refreshError) {
                console.error("Failed to refresh token", refreshError);
                return Promise.reject(refreshError);
            }
        }
        return logError(error);
    }
);


export { authAxios, publicAxios };
