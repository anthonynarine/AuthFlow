/**
 * Console logging for failed requests that never carries credentials.
 *
 * An axios error holds the whole request: `config.data` (the login body, with
 * the password), `config.headers` (the Bearer token), the full URL with its
 * query string, and the response body (which can hold tokens). Logging the
 * error object itself prints all of that to the console, where browser
 * extensions, screen shares and any future error reporter can read it.
 *
 * safeLogError prints only:
 *   - the caller's fixed context string
 *   - the HTTP method
 *   - the request path, without origin, userinfo, query string or fragment;
 *     any segment that does not look like a route word or a numeric id
 *     (see SAFE_SEGMENT) is replaced by ":redacted"
 *   - the HTTP status
 *   - the error code (axios's `code`, and the server's `code` when it is a
 *     plain UPPER_SNAKE identifier)
 * For an error that is not an HTTP error, only its class name (TypeError, ...).
 */

const IDENTIFIER = /^[A-Z][A-Z0-9_]{0,63}$/;
const ERROR_CLASS = /^[A-Za-z]{1,40}Error$/;
const METHOD = /^[A-Za-z]{1,10}$/;
// Gait's route segments are lowercase words (`organizations`,
// `two-factor-login`, `accept-risk`) or numeric ids. Anything else -- mixed
// case, `@`, `%`, `.`, `=`, `+` ... -- may be a token, an email or other
// personal data, so it is redacted (GAIT-SEC-095). A very long segment is
// redacted even when lowercase (hex tokens), unless it is purely numeric.
const NUMERIC_SEGMENT = /^[0-9]+$/;
const SAFE_SEGMENT = /^[a-z0-9_-]+$/;
const MAX_SAFE_SEGMENT_LENGTH = 23;
// Absolute (scheme://) or protocol-relative (//host) URL.
const ABSOLUTE_URL = /^(?:[a-z][a-z0-9+.-]*:)?\/\//i;

function stripQueryAndFragment(url) {
    return url.split(/[?#]/, 1)[0];
}

function pathOf(url) {
    // Absolute or protocol-relative URL: keep the path only (never the
    // userinfo, host or query).
    const match = /^(?:[a-z][a-z0-9+.-]*:)?\/\/[^/?#]*(.*)$/i.exec(url);
    return match ? match[1] || "/" : url;
}

function safeSegment(segment) {
    if (segment === "" || NUMERIC_SEGMENT.test(segment)) return segment;
    if (segment.includes("@")) return ":redacted";
    if (!SAFE_SEGMENT.test(segment) || segment.length > MAX_SAFE_SEGMENT_LENGTH) return ":redacted";
    return segment;
}

/** The request path for logs: no origin, no query string, no fragment, no token-shaped segments. */
export function safeRequestPath(config) {
    if (!config || typeof config.url !== "string") return undefined;
    const url = stripQueryAndFragment(config.url);
    let path;
    if (ABSOLUTE_URL.test(url)) {
        path = pathOf(url);
    } else {
        const base = typeof config.baseURL === "string"
            ? pathOf(stripQueryAndFragment(config.baseURL)).replace(/\/+$/, "")
            : "";
        path = `${base}/${url.replace(/^\/+/, "")}`;
    }
    return path
        .split("/")
        .map(safeSegment)
        .join("/");
}

/** The safe summary of an error, as a plain object of strings and numbers. */
export function summarizeError(err) {
    const summary = {};
    if (!err || typeof err !== "object") return summary;

    const config = err.config;
    if (config && typeof config.method === "string" && METHOD.test(config.method)) {
        summary.method = config.method.toUpperCase();
    }
    const path = safeRequestPath(config);
    if (path) summary.path = path;

    const status = err.response?.status;
    if (Number.isInteger(status)) summary.status = status;

    if (typeof err.code === "string" && IDENTIFIER.test(err.code)) {
        summary.code = err.code;
    }
    const serverCode = err.response?.data?.code;
    if (typeof serverCode === "string" && IDENTIFIER.test(serverCode)) {
        summary.serverCode = serverCode;
    }

    if (!config && typeof err.name === "string" && ERROR_CLASS.test(err.name)) {
        summary.name = err.name;
    }
    return summary;
}

/** Format the safe summary as one line. */
export function formatSafeError(context, err) {
    const s = summarizeError(err);
    const parts = [];
    if (s.method || s.path) parts.push([s.method, s.path].filter(Boolean).join(" "));
    if (s.status !== undefined) parts.push(`status ${s.status}`);
    if (s.code) parts.push(`code ${s.code}`);
    if (s.serverCode) parts.push(`server code ${s.serverCode}`);
    if (s.name) parts.push(s.name);
    const label = typeof context === "string" && context ? context : "Error";
    return parts.length ? `${label}: ${parts.join(", ")}` : label;
}

/** Log a failed request without its body, headers, query string or response. */
export function safeLogError(context, err) {
    console.error(formatSafeError(context, err));
}

export default safeLogError;
