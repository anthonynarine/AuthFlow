import { authAxios } from "../../interceptors/axios";

// Local claims bind responses to the current credential; only the server
// authenticates them and supplies policy/deadlines.
export function sessionBinding(token) {
    try {
        const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
        const { sid, sub, aud } = JSON.parse(atob(part));
        return [sid, sub, aud].every((v) => typeof v === "string" && v.length > 0)
            ? JSON.stringify([sid, sub, aud]) : null;
    } catch { return null; }
}

export function createActivitySession({ token, now = () => performance.now(), onChange, onExpire }) {
    const binding = sessionBinding(token());
    let stopped = false, busy = false, current = null, deadline = null, lastSent = -Infinity;
    const valid = () => !stopped && binding && sessionBinding(token()) === binding;
    const expire = () => { if (valid()) { stopped = true; onExpire(); } };
    function accept(data, started) {
        if (!valid()) return;
        const [sid, , aud] = JSON.parse(binding);
        if (data?.sid !== sid || data?.aud !== aud || typeof data.policy_enabled !== "boolean" ||
            !Number.isSafeInteger(data.activity_generation) || data.activity_generation < 0) throw new Error("Invalid session status");
        let remaining = null;
        if (data.policy_enabled) {
            const times = [data.server_time, data.idle_expires_at, data.overall_expires_at].map((v) => typeof v === "string" ? Date.parse(v) : NaN);
            if (!times.every(Number.isFinite)) throw new Error("Invalid session deadlines");
            remaining = Math.min(times[1], times[2]) - times[0];
        }
        current = data; deadline = remaining === null ? null : started + remaining;
        tick();
    }
    const config = (skipAuthRefresh) => ({ skipAuthRefresh, headers: { Authorization: `Bearer ${token()}` } });
    async function status() {
        if (!valid()) return;
        const started = now();
        try { const { data } = await authAxios.get("/auth/session/status/", config(false)); accept(data, started); }
        catch (e) {
            if (!valid()) return;
            if (e.response?.status === 401) expire();
            else if (e.response?.status === 404 && !current) onChange({ inactive: true });
            else onChange({ unavailable: true });
        }
    }
    function tick() {
        if (!valid() || !current) return;
        if (deadline !== null && now() >= deadline) { expire(); return; }
        onChange({ warning: deadline !== null && deadline - now() <= 120000, inactive: current?.policy_enabled === false });
    }
    async function activity(event) {
        if (!valid() || !event?.isTrusted || document.visibilityState !== "visible" || busy ||
            !current?.policy_enabled || now() - lastSent < 60000) return;
        tick(); if (!valid()) return;
        busy = true; lastSent = now();
        // Consume this intent once. Reconciliation never queues or replays it.
        const generation = current.activity_generation;
        const started = now();
        try {
            const { data } = await authAxios.post("/auth/session/activity/", { generation }, config(true));
            accept(data, started);
        } catch (e) {
            if (!valid()) return;
            if (e.response?.status === 401 && e.response?.data?.code === "SESSION_EXPIRED") expire();
            else await status();
        } finally { busy = false; }
    }
    async function observe() {
        tick();
        if (!valid() || busy) return;
        busy = true;
        try { await status(); } finally { busy = false; }
    }
    return { start: observe, observe, activity, tick, stop: () => { stopped = true; } };
}
