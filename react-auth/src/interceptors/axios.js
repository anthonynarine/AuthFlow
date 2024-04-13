import axios from "axios";
import Cookies from "js-cookie";

// Development and production base URLs
const DEV_URL = "http://localhost:8000/api";
const Production_URL = "https://ant-django-auth-62cf01255868.herokuapp.com/api";

// Function to log request details
const logRequest = (request) => {
    console.log(`Request made to ${request.url} with method ${request.method}`);
    return request;
};

// Function to log response details
const logResponse = (response) => {
    console.log(`Received response from ${response.config.url}`);
    return response;
};

// Function to log errors
const logError = (error) => {
    console.error(`Error in request to ${error.config.url}: ${error.message}`);
    return Promise.reject(error);
}

// Axios instance for public (non-authenticated) requests.
// Uses CSRF token for necessary security in public requests.
const publicAxios = axios.create({
    baseURL: DEV_URL,
    withCredentials: true // Necessary for cookies if endpoint still requires CSRF protection
});

// Interceptor to attach CSRF token for public requests
publicAxios.interceptors.request.use(config => {
    const csrfToken = Cookies.get("csrftoken");
    if (csrfToken) {
        config.headers["X-CSRFToken"] = csrfToken;
    }
    // Start timing the request
    config.metadata = { startTime: new Date() };
    return logRequest(config);
}, logError);

publicAxios.interceptors.response.use(response => {
    // Log timing information
    const duration = new Date() - response.config.metadata.startTime;
    console.log(`Response from ${response.config.url} took ${duration} ms`);
    return logResponse(response);
}, logError);


// Authenticated Axios instance for private (authenticated) requests.
// Handles both access token and CSRF token attachments.
const authAxios = axios.create({
    baseURL: DEV_URL,
    withCredentials: true, // This is necessary for the Axios to send cookies with the request, important for sessions and CSRF tokens.
});

// Request interceptor to attach the access token
authAxios.interceptors.request.use(config => {
    // Retrieve the access token from cookies
    const accessToken = Cookies.get("accessToken");
    if (accessToken) {
        config.headers["Authorization"] = `Bearer ${accessToken}`;
    }
    // Retrieve CSRF token from the cookies and attach it to the request headers
    const csrfToken = Cookies.get("csrftoken");
    if (csrfToken) {
        config.headers["X-CSRFToken"] = csrfToken;
    }
    // Start timing the request
    config.metadata = { startTime: new Date() };
    return logRequest(config);
}, logError);

// Response interceptor to handle automatic token refresh
authAxios.interceptors.response.use((response) => {
    // Directly resolve success responses
    // Log timing information
    const duration = new Date() - response.config.metadata.startTime;
    console.log(`Response from ${response.config.url} took ${duration} ms`);
    return logResponse(response);
}, async (error) => {
    const originalRequest = error.config;
    // Check if the error is due to an expired token and ensure we do not enter an infinite loop
    if (error.response.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true; // Mark that we already tried refreshing the token
        try {
            // Attempt to refresh the token by hitting the refresh token endpoint
            const response = await authAxios.post("/token-refresh/", {}, { withCredentials: true });
            if (response.status === 200) {
                // If the token refresh was successful, update the cookie with the new access token
                const newAccessToken = response.data.access_token;
                Cookies.set("accessToken", newAccessToken);
                // Retry the original request with the new token
                return authAxios(originalRequest);
            }
        } catch (refreshError) {
            // Handle the case where the token refresh fails
            console.error("Failed to refresh token", refreshError);
            return Promise.reject(refreshError);
        }
    }
    // Log and propagate other errors as is
    return logError(error);
});

export { authAxios, publicAxios };
