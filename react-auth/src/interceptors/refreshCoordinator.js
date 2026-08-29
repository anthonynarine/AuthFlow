import { getAccessToken, getRefreshToken, persistAuthTokens } from "./tokenStorage";

const REFRESH_LOCK_NAME = "auth-refresh";

function getBrowserLocks() {
    if (typeof navigator === "undefined") {
        return null;
    }

    return navigator.locks || null;
}

export function isBrowserRefreshCoordinationAvailable() {
    const locks = getBrowserLocks();
    return Boolean(locks && typeof locks.request === "function");
}

/**
 * Coordinate refresh-token rotation across same-origin tabs.
 *
 * The coordinator re-reads the current access token after the browser-wide
 * lock is acquired. If another tab already rotated the token, the refresh
 * operation is skipped and the current access token is returned.
 *
 * @param {Object} params
 * @param {string | null | undefined} params.failedAccessToken - Access token
 *     that triggered the 401 response.
 * @param {Function} params.refreshAction - Performs the refresh request when
 *     coordination still requires it.
 * @returns {Promise<{accessToken: string | null, refreshToken: string | null, rotated: boolean}>}
 */
export async function refreshWithBrowserCoordination({
    failedAccessToken,
    refreshAction,
}) {
    const locks = getBrowserLocks();

    if (!locks || typeof locks.request !== "function") {
        throw new Error("Browser refresh coordination is unavailable.");
    }

    return locks.request(REFRESH_LOCK_NAME, { mode: "exclusive" }, async () => {
        const currentAccessToken = getAccessToken();

        if (
            currentAccessToken &&
            failedAccessToken &&
            currentAccessToken !== failedAccessToken
        ) {
            return {
                accessToken: currentAccessToken,
                refreshToken: getRefreshToken(),
                rotated: false,
            };
        }

        const currentRefreshToken = getRefreshToken();

        if (!currentRefreshToken) {
            throw new Error("Refresh token is missing.");
        }

        const refreshedTokens = await refreshAction({
            currentAccessToken,
            currentRefreshToken,
            failedAccessToken,
        });

        if (!refreshedTokens || !refreshedTokens.accessToken) {
            throw new Error("Refresh action did not return a new access token.");
        }

        persistAuthTokens({
            accessToken: refreshedTokens.accessToken,
            refreshToken: refreshedTokens.refreshToken || null,
        });

        return {
            accessToken: refreshedTokens.accessToken,
            refreshToken: refreshedTokens.refreshToken || null,
            rotated: true,
        };
    });
}
