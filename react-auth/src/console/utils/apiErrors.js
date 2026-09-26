/**
 * One place that turns a Gait API error into plain words for the console.
 *
 * - 401 never reaches here as a message: the session layer refreshes or ends
 *   the session.
 * - 403: the caller's role can't do it. 404: doesn't exist or no access
 *   (never which one).
 * - Refusals ({detail, code}, e.g. INVALID_TRANSITION, APPLICATION_NOT_ACTIVE)
 *   and field errors ({name: ["..."]}) show Gait's own wording.
 * - 429 honours Retry-After.
 */
export const NOT_FOUND_MESSAGE = "This doesn't exist, or you don't have access to it.";
export const FORBIDDEN_MESSAGE = "Your role in this organization can't do that.";
const GENERIC_MESSAGE = "Something went wrong talking to Gait. Please try again.";

function fieldErrors(data) {
    if (!data || typeof data !== "object") return null;
    const messages = Object.entries(data)
        .filter(([key]) => key !== "code")
        .flatMap(([, value]) => (Array.isArray(value) ? value : []))
        .filter((value) => typeof value === "string");
    return messages.length ? messages.join(" ") : null;
}

export function apiErrorMessage(error) {
    const status = error?.response?.status;
    const data = error?.response?.data;
    if (status === 404) return NOT_FOUND_MESSAGE;
    if (status === 403) return FORBIDDEN_MESSAGE;
    if (status === 429) {
        const retryAfter = Number(error.response.headers?.["retry-after"]);
        return retryAfter > 0
            ? `Too many requests. Try again in ${retryAfter} seconds.`
            : "Too many requests. Try again in a moment.";
    }
    if (status && status < 500) {
        if (typeof data?.detail === "string") return data.detail;
        return fieldErrors(data) || GENERIC_MESSAGE;
    }
    return GENERIC_MESSAGE;
}

/** Field-level messages from a DRF 400, e.g. { name: "This field may not be blank." }. */
export function apiFieldErrors(error) {
    const data = error?.response?.status === 400 ? error.response.data : null;
    if (!data || typeof data !== "object") return {};
    return Object.fromEntries(
        Object.entries(data)
            .filter(([key, value]) => key !== "detail" && key !== "code" && Array.isArray(value))
            .map(([key, value]) => [key, value.join(" ")])
    );
}
