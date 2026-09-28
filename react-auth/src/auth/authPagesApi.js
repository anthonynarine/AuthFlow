import { publicAxios } from "../interceptors/axios";

/*
 * Calls for the signed-out pages (register, forgot and reset password). They
 * return Gait's answer or throw, so each page can show its own states; the
 * older useBasicAuth helpers swallow errors and redirect on a timer.
 */

export async function registerAccount({ firstName, lastName, email, password, confirmPassword }) {
    const { data } = await publicAxios.post("/register/", {
        first_name: firstName,
        last_name: lastName,
        email,
        password,
        password_confirm: confirmPassword,
    });
    return data;
}

/** Same answer whether or not the address has an account (Gait doesn't say). */
export async function requestPasswordReset(email) {
    const { data } = await publicAxios.post("/forgot-password/", { email });
    return data;
}

/**
 * The reset token goes only in the POST body (it arrives in the link's
 * #fragment, which browsers never send to a server).
 */
export async function resetPassword({ token, password, confirmPassword }) {
    const { data } = await publicAxios.post("/reset-password/", {
        token,
        password,
        password_confirm: confirmPassword,
    });
    return data;
}

/** Gait's one answer for an unknown, used or expired reset link. */
export const INVALID_RESET_LINK = "This password reset link is invalid or has expired.";

/**
 * A message Gait sent as a list, a plain string, or a Python list turned into
 * a string (str() of a Django ValidationError: "['Too short.', \"Can't be…\"]"),
 * as plain sentences: never brackets or quotes on screen.
 */
export function readableMessages(value) {
    if (Array.isArray(value)) return value.map(readableMessages).filter(Boolean).join(" ");
    if (typeof value !== "string") return "";
    const text = value.trim();
    if (!/^\[.*\]$/s.test(text)) return text;
    const items = text.match(/'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"/g);
    return items ? items.map((item) => item.slice(1, -1).replace(/\\(['"\\])/g, "$1")).join(" ") : text;
}

/**
 * Gait's register errors come as {error: {field: "..." | [...]}} (or a plain
 * string); map them onto the form's fields, the rest to one general message.
 */
export function fieldErrors(error, fieldMap, fallback) {
    const payload = error?.response?.data?.error ?? error?.response?.data;
    if (!error?.response) return { general: "We couldn't reach Gait. Check your connection and try again." };
    if (typeof payload === "string" || Array.isArray(payload)) return { general: readableMessages(payload) || fallback };
    if (payload && typeof payload === "object") {
        const result = {};
        const general = [];
        Object.entries(payload).forEach(([key, value]) => {
            const text = readableMessages([value].flat());
            if (!text) return;
            if (fieldMap[key]) result[fieldMap[key]] = text;
            else general.push(text);
        });
        if (general.length) result.general = general.join(" ");
        if (Object.keys(result).length) return result;
    }
    return { general: fallback };
}
