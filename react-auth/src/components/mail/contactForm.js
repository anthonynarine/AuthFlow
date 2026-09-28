/*
 * The contact-form endpoint (/mail/send-email/) shared by the Contact and
 * Early access pages: the server's limits, counted after trimming (Gait H5),
 * and a readable message for whatever the server sends back.
 *
 *   over a limit   400 {"error": "<field> must be at most <n> characters", "field", "max_length"}
 *   missing field  400 {"error": "reply_to, subject, and content are all required"}
 *   bad email      400 {"error": "Invalid email format"}
 *   too many       429 (5 a minute per address)
 */
export const CONTACT_LIMITS = {
    reply_to: 254,
    subject: 200,
    content: 5000,
};

const FALLBACK = "Something went wrong sending your message. Please try again.";

/** `labels` maps the server's field names (reply_to, subject, content) to what the page calls them. */
export function contactErrorMessage(error, labels = {}) {
    const response = error?.response;
    const data = response?.data || {};
    if (data.field && data.max_length) {
        return `${labels[data.field] || data.field} is too long: keep it to ${data.max_length} characters.`;
    }
    if (response?.status === 429) {
        return "Too many messages in a short time. Please wait a minute and try again.";
    }
    return typeof data.error === "string" && data.error ? data.error : FALLBACK;
}

/** Names of the required fields that are empty or only spaces. */
export function blankFields(values, required) {
    return required.filter((name) => !String(values[name] ?? "").trim());
}
