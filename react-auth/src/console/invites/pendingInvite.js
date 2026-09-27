import { SESSION_ENDED_EVENT, onSignedOutElsewhere } from "../../interceptors/sessionEvents";

/**
 * The invite being accepted, kept in memory only: never storage, cookies,
 * the URL or history. It survives in-app navigation (e.g. to sign in and
 * back) and nothing else. Cleared when:
 *   - the invite is joined, or its preview comes back invalid;
 *   - its own expiry (from the preview) passes;
 *   - any sign-out: this tab's, another tab's, or the session ending --
 *     except a deliberate "Switch account", which keeps it for exactly one
 *     sign-out (keepThroughNextSignOut).
 */
let current = null; // { token, preview }
let expiryTimer = null;
let keepOnce = false;
const listeners = new Set();

// setTimeout can't wait longer than ~24.8 days; invites last 7.
const MAX_TIMER_MS = 2 ** 31 - 1;

// Listeners get (invite, reason); reason says why it was cleared:
// "expired" | "signed-out" | "cleared".
function notify(reason) {
    listeners.forEach((listener) => listener(current, reason));
}

function clearTimer() {
    if (expiryTimer) clearTimeout(expiryTimer);
    expiryTimer = null;
}

export function getPendingInvite() {
    return current;
}

/** A new token from a link (replaces any other). */
export function setPendingToken(token) {
    clearTimer();
    current = { token, preview: null };
    notify();
}

/** Remember what the preview said, and forget the invite when it expires. */
export function setPendingPreview(preview) {
    if (!current) return;
    current = { ...current, preview };
    clearTimer();
    const remaining = new Date(preview.expires_at).getTime() - Date.now();
    if (!(remaining > 0)) {
        clearPendingInvite("expired");
        return;
    }
    expiryTimer = setTimeout(() => clearPendingInvite("expired"), Math.min(remaining, MAX_TIMER_MS));
    notify();
}

export function clearPendingInvite(reason = "cleared") {
    clearTimer();
    keepOnce = false;
    if (current === null) return;
    current = null;
    notify(reason);
}

/** "Switch account": keep the invite through the sign-out that follows. */
export function keepThroughNextSignOut() {
    keepOnce = true;
}

/** Called for every sign-out, from any source. */
export function handleSignedOut() {
    if (keepOnce) {
        keepOnce = false;
        return;
    }
    clearPendingInvite("signed-out");
}

export function subscribePendingInvite(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

// Session ended in this tab (refresh failed, session revoked or expired),
// or another tab signed out.
if (typeof window !== "undefined") {
    window.addEventListener(SESSION_ENDED_EVENT, handleSignedOut);
}
onSignedOutElsewhere(handleSignedOut);
