/**
 * Where to go after signing in. An allowlist, never "anything starting with
 * /": only the invite accept page and in-app console paths are accepted.
 * Everything else (//evil.com, /\evil.com, https://..., javascript:, odd
 * characters) falls back to the default, so this can't become an open
 * redirect.
 */
export const DEFAULT_AFTER_SIGN_IN = "/workspace";
export const INVITE_ACCEPT_PATH = "/console/invites/accept";

// /console or /console/<segment>/... ; segments are letters, digits, - and _;
// an optional plain query (?env=production&status=OPEN).
const CONSOLE_PATH = /^\/console(\/[A-Za-z0-9_-]+)*\/?(\?[A-Za-z0-9_=&-]*)?$/;

export function safeReturnTo(value) {
    if (typeof value !== "string" || value.length > 300) return null;
    if (value === INVITE_ACCEPT_PATH) return value;
    return CONSOLE_PATH.test(value) ? value : null;
}

/** The destination after sign-in: an allowed `returnTo`, else the default. */
export function afterSignIn(returnTo) {
    return safeReturnTo(returnTo) || DEFAULT_AFTER_SIGN_IN;
}
