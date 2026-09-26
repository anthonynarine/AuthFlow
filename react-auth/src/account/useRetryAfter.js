import { useCallback, useEffect, useState } from "react";

/** Seconds from a 429's Retry-After header, or `fallback` when it's missing or unreadable. */
export function retryAfterSeconds(error, fallback = 60) {
    const value = Number(error?.response?.headers?.["retry-after"]);
    return Number.isFinite(value) && value > 0 ? Math.ceil(value) : fallback;
}

/**
 * A countdown for "wait and try again": start(seconds) and read `remaining`,
 * which ticks down to 0. Used by the resend button (RESEND_COOLDOWN) and any
 * RATE_LIMITED response (verify now; invite preview/accept once that page exists).
 */
export function useRetryAfter() {
    const [until, setUntil] = useState(0);
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        if (until <= Date.now()) return undefined;
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, [until]);

    const start = useCallback((seconds) => {
        const current = Date.now();
        setNow(current);
        setUntil(current + seconds * 1000);
    }, []);

    const remaining = Math.max(0, Math.ceil((until - now) / 1000));
    return { remaining, waiting: remaining > 0, start };
}
