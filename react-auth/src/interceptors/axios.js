import axios from "axios";
import Cookies from "js-cookie";

// TODO: add access and refresh token logic to response interceptors. 

// Development and production base URLs
const DEV_URL = "http://localhost:8000/api";
const PRODUCTION_URL = "https://ant-django-auth-62cf01255868.herokuapp.com/api";

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
    baseURL: PRODUCTION_URL ,
    withCredentials: true // Necessary for cookies, especially if CSRF protection is enabled server-side.
});

// Interceptor to attach CSRF token for every public request
publicAxios.interceptors.request.use(config => {
    const csrfToken = Cookies.get("csrftoken");
    if (csrfToken) {
        config.headers["X-CSRFToken"] = csrfToken;
    }
    // Start timing the request for performance monitoring
    config.metadata = { startTime: new Date() };
    return logRequest(config);
}, logError);

publicAxios.interceptors.response.use(response => {
    // Update CSRF token if a new one is provided in the response
    const newCsrfToken = response.headers["x-csrftoken"];
    if (newCsrfToken) {
        Cookies.set("csrftoken", newCsrfToken);
    }
    // Calculate and log the duration of the request
    const duration = new Date() - response.config.metadata.startTime;
    console.log(`Response from ${response.config.url} took ${duration} ms`);
    return logResponse(response);
}, logError);


// AUTHENTICATED AXIOS INSTANCE for private (authenticated) requests with token and CSRF handling.
const authAxios = axios.create({
    baseURL: PRODUCTION_URL,
    withCredentials: true,
});

// Interceptor to attach the access token to each request
authAxios.interceptors.request.use(config => {
    // const accessToken = Cookies.get("access_token");
    // if (accessToken) {
    //     config.headers["Authorization"] = `Bearer ${accessToken}`;
    // };
    const csrfToken = Cookies.get("csrftoken");
    if (csrfToken) {
        config.headers["X-CSRFToken"] = csrfToken;
    }
    config.metadata = { startTime: new Date() }; 
    return logRequest(config);
}, logError);


// Response interceptor for handling automatic token refresh on authentication failures
authAxios.interceptors.response.use(response => {
    // Check for and update the CSRF token as needed
    const newCsrfToken = response.headers['x-csrftoken'];
    if (newCsrfToken) {
        Cookies.set('csrftoken', newCsrfToken);
    }
    const duration = new Date() - response.config.metadata.startTime;
    console.log(`Response from ${response.config.url} took ${duration} ms`);
    return logResponse(response);
}, async error => {
    const originalRequest = error.config;
    // Handle expired access tokens and attempt to refresh them once
    if (error.response.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
            const response = await authAxios.post('/token-refresh/', {}, { withCredentials: true });
            if (response.status === 200) {
                const newAccessToken = response.data.access_token;
                originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                // Update Axios default headers for subsequent requests
                authAxios.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
                return authAxios(originalRequest);
            }
        } catch (refreshError) {
            console.error('Failed to refresh token', refreshError);
            return Promise.reject(refreshError);
        }
    }
    return logError(error);
});

export { authAxios, publicAxios };