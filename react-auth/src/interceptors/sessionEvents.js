/**
 * Session lifecycle signals, with no network code, so anything can import
 * them without pulling in axios.
 *
 * - SESSION_ENDED_EVENT: this tab's session is gone (refresh failed,
 *   revoked, expired). Dispatched on window by the HTTP layer.
 * - Signed out elsewhere: an explicit sign-out in another tab of this
 *   browser, over a BroadcastChannel. One shared channel object sends and
 *   listens, and a channel never receives its own messages, so a tab is
 *   never told about its own sign-out.
 */
export const SESSION_ENDED_EVENT = "gait:session-ended";

const CHANNEL_NAME = "gait-session";
const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(CHANNEL_NAME) : null;

/** Tell the browser's other tabs this tab signed out. */
export function broadcastSignedOut() {
    try {
        channel?.postMessage({ type: "signed-out" });
    } catch {
        // A closed or unsupported channel just means no other tab hears it.
    }
}

/** Run `listener` when another tab signs out. Returns an unsubscribe function. */
export function onSignedOutElsewhere(listener) {
    if (!channel) return () => {};
    const handler = (event) => {
        if (event?.data?.type === "signed-out") listener();
    };
    channel.addEventListener("message", handler);
    return () => channel.removeEventListener("message", handler);
}
