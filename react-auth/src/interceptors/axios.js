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
  
// Debugging
console.log("Base URL:", baseURL); // Debugging line to check if the baseURL is correctly set

const isProduction = baseURL.includes("ant-django-auth-62cf01255868.herokuapp.com");

// Function to log request details, useful for debugging and monitoring.
const logRequest = (request) => {
    console.log(`Request made to ${request.url} with method ${request.method}`);
    return request;
};

// Function to log response details, helps in understanding response times and sources.
const logResponse = (response) => {
    console.log(`Received response from ${response.config.url}`);
    return response;
};

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
    // Start timing the request for performance monitoring
    config.metadata = { startTime: new Date() };

    return logRequest(config);
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
      Cookies.remove("access_token", { path: '/' });
      Cookies.remove("refresh_token", { path: '/' });
      Cookies.remove("csrftoken", { path: '/' });
      Cookies.remove("sessionid", { path: '/', domain: 'ant-django-auth-62cf01255868.herokuapp.com' });
    }

    // Calculate and log the duration of the request
    const duration = new Date() - response.config.metadata.startTime;
    console.log(`Response from ${response.config.url} took ${duration} ms`);
    return logResponse(response);
}, logError);

// AUTHENTICATED AXIOS INSTANCE for private (authenticated) requests with token and CSRF handling.
const authAxios = axios.create({
    baseURL: baseURL,
    withCredentials: true,
});

// Interceptor to attach the access token to each request
authAxios.interceptors.request.use((config) => {
    const accessToken = Cookies.get("access_token");
    if (accessToken) {
        config.headers["Authorization"] = `Bearer ${accessToken}`;
    }
    const csrfToken = Cookies.get("csrftoken");
    if (csrfToken) {
        config.headers["X-CSRFToken"] = csrfToken;
    }
    config.metadata = { startTime: new Date() };

    return logRequest(config);
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
        const duration = new Date() - response.config.metadata.startTime;
        console.log(`Response from ${response.config.url} took ${duration} ms`);
        return logResponse(response);
    },
    async (error) => {
        const originalRequest = error.config;
        // Handle expired access tokens and attempt to refresh them once
        if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const refreshToken = Cookies.get("refresh_token");
                const response = await authAxios.post(
                    "/token-refresh/",
                    { refresh_token: refreshToken },
                    { withCredentials: true }
                );
                if (response.status === 200) {
                    const newAccessToken = response.data.access_token;
                    const newRefreshToken = response.data.refresh_token;
                    Cookies.set("access_token", newAccessToken, {
                        expires: 1 / 96,
                        secure: isProduction,
                        sameSite: isProduction ? "None" : "Lax"
                    });
                    Cookies.set("refresh_token", newRefreshToken, {
                        expires: 7,
                        secure: isProduction,
                        sameSite: isProduction ? "None" : "Lax"
                    });
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