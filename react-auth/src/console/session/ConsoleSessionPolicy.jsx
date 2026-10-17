import React, { useEffect, useState, useSyncExternalStore, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { clearAuthTokens, getAccessToken, subscribeAccessToken } from "../../interceptors/tokenStorage";
import { SESSION_ENDED_EVENT } from "../../interceptors/axios";
import { createActivitySession, sessionBinding } from "./activitySession";

export function ConsoleSessionPolicy({ user, children }) {
    const [state, setState] = useState({});
    const [expiredBinding, setExpiredBinding] = useState(null);
    const accessToken = useSyncExternalStore(subscribeAccessToken, getAccessToken);
    const navigate = useNavigate();
    const location = useLocation();
    const returnPath = useRef("");
    returnPath.current = location.pathname + location.search;
    const binding = user ? sessionBinding(accessToken) : null;
    useEffect(() => {
        if (!binding) return undefined;
        let timer;
        const controller = createActivitySession({ token: getAccessToken, onChange: (next) => {
            setState({ ...next, binding });
            if (next.inactive) { window.clearInterval(timer); timer = undefined; }
            else if (next.inactive === false && timer === undefined) timer = window.setInterval(controller.tick, 1000);
        }, onExpire: () => {
            setExpiredBinding(binding);
            clearAuthTokens();
            window.dispatchEvent(new Event(SESSION_ENDED_EVENT));
            navigate("/login", { replace: true, state: { from: returnPath.current } });
        } });
        controller.start();
        const events = ["pointerdown", "keydown", "touchstart"];
        events.forEach((name) => window.addEventListener(name, controller.activity, { passive: true }));
        window.addEventListener("focus", controller.observe);
        document.addEventListener("visibilitychange", controller.observe);
        return () => { controller.stop(); window.clearInterval(timer); window.removeEventListener("focus", controller.observe); document.removeEventListener("visibilitychange", controller.observe); events.forEach((name) => window.removeEventListener(name, controller.activity)); };
    }, [binding, navigate]);
    // Navigation is already covered by its trusted pointer/keyboard action;
    // route changes and visibility changes alone never count as activity.
    if (expiredBinding && (!binding || expiredBinding === binding)) return null;
    const currentState = state.binding === binding ? state : {};
    return <>{currentState.warning && <p role="alert">Your session expires in less than two minutes. Activity can extend the inactivity deadline, but you must sign in again when the overall session ends.</p>}{currentState.unavailable && <p role="status">Session status is temporarily unavailable.</p>}{children}</>;
}
