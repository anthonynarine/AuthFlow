/**
 * Serialize session refreshes.
 *
 * Gait rotates the refresh cookie on every refresh and treats a second use
 * of an already-rotated cookie as replay (it revokes the whole session).
 * The cookie jar is shared by every tab, so refreshes must never overlap:
 *
 *   - within a tab:  one in-flight promise shared by every caller
 *   - across tabs:   the Web Locks API -- only one tab holds the refresh
 *                    lock at a time, so each refresh presents the cookie the
 *                    previous one just set
 *
 * Without navigator.locks (very old browsers) only the in-tab guarantee
 * holds; the worst case is a replay-revoked session, i.e. a sign-out.
 */

const REFRESH_LOCK_NAME = "gait-auth-refresh";

let inFlight = null;

function getBrowserLocks() {
    if (typeof navigator === "undefined") {
        return null;
    }
    return navigator.locks && typeof navigator.locks.request === "function" ? navigator.locks : null;
}

/**
 * Run `refreshAction` so that no two refreshes ever overlap.
 *
 * @param {() => Promise<string>} refreshAction - performs the refresh and
 *     resolves to the new access token.
 * @returns {Promise<string>} the new access token.
 */
export function refreshWithBrowserCoordination(refreshAction) {
    if (inFlight) {
        return inFlight;
    }
    const locks = getBrowserLocks();
    const run = locks
        ? locks.request(REFRESH_LOCK_NAME, { mode: "exclusive" }, () => refreshAction())
        : refreshAction();

    inFlight = Promise.resolve(run).finally(() => {
        inFlight = null;
    });
    return inFlight;
}
