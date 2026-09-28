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

/** uidb64/token come from today's link path; AUTH-B moves them to the #fragment. */
export async function resetPassword({ uidb64, token, password, confirmPassword }) {
    const { data } = await publicAxios.post("/reset-password/", {
        uidb64,
        token,
        password,
        password_confirm: confirmPassword,
    });
    return data;
}

/**
 * Gait's register errors come as {error: {field: "..." | [...]}} (or a plain
 * string); map them onto the form's fields, the rest to one general message.
 */
export function fieldErrors(error, fieldMap, fallback) {
    const payload = error?.response?.data?.error ?? error?.response?.data;
    if (!error?.response) return { general: "We couldn't reach Gait. Check your connection and try again." };
    if (typeof payload === "string") return { general: payload };
    if (payload && typeof payload === "object") {
        const result = {};
        const general = [];
        Object.entries(payload).forEach(([key, value]) => {
            const text = [value].flat().filter(Boolean).join(" ");
            if (!text) return;
            if (fieldMap[key]) result[fieldMap[key]] = text;
            else general.push(text);
        });
        if (general.length) result.general = general.join(" ");
        if (Object.keys(result).length) return result;
    }
    return { general: fallback };
}
