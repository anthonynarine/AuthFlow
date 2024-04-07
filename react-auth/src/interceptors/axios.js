import axios from "axios";
import Cookies from "js-cookie";

// Development and production base URLs
const DEV_URL = "http://localhost:8000/api";
const Production_URL = "https://ant-django-auth-62cf01255868.herokuapp.com/api";


// Create an Axios instance with the determined base URL
const axiosAPIinterceptor = axios.create({
    baseURL: DEV_URL,
    withCredentials: true, // This is necessary for the Axios to send cookies with the request, which is important for sessions and CSRF tokens.
});

// Request interceptor to attach the access token
axiosAPIinterceptor.interceptors.request.use(config => {
    // Retrieve the access token from cookies
    const accessToken = Cookies.get("accessToken");
    // If the access token exists, attach it to the request headers
    if (accessToken) {
        config.headers["Authorization"] = `Bearer ${accessToken}`;
    };

    // Retrieve CSRF token from the cookies and attatch it to the request headers.
    const csrfToken = Cookies.get("csrftoken");
    if (csrfToken) {
        config.headers["X-CSRFToken"] = csrfToken;
    };

    return config;
}, error => {
    // Handle request error
    return Promise.reject(error);
});

// Response interceptor to handle automatic token refresh
axiosAPIinterceptor.interceptors.response.use((response) => {
    // Directly resolve success responses
    return response;
}, async (error) => {
    const originalRequest = error.config;
    // Check if the error is due to an expired token and ensure we do not enter an infinite loop
    if (error.response.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true; // Mark that we already tried refreshing the token
        try {
            // Attempt to refresh the token by hitting the refresh token endpoint
            const response = await axiosAPIinterceptor.post("/token-refresh/", {}, { withCredentials: true });
            if (response.status === 200) {
                // If the token refresh was successful, update the cookie with the new access token
                const newAccessToken = response.data.access_token;
                Cookies.set("accessToken", newAccessToken);
                // Retry the original request with the new token
                return axiosAPIinterceptor(originalRequest);
            }
        } catch (refreshError) {
            // Handle the case where the token refresh fails
            console.error("Failed to refresh token", refreshError);
            return Promise.reject(refreshError);
        }
    }
    // Propagate other errors as is
    return Promise.reject(error);
});

export default axiosAPIinterceptor;
