import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ROLE_LABELS } from "../pages/members/memberRules";
import "../pages/members/Members.css";

/**
 * One-time "Welcome, you're an Admin" after joining through an invite. The
 * accept page passes {welcome: {company, role}} as router state; it's shown
 * once, then dropped from history so a reload or Back doesn't repeat it.
 */
export function WelcomeNote() {
    const location = useLocation();
    const navigate = useNavigate();
    const [welcome, setWelcome] = useState(() => location.state?.welcome || null);
    // The entry the initial state already showed. Its effect may run after a
    // quick Dismiss, and must not bring the note back.
    const shownOnMount = useRef(location.state?.welcome ? location.key : null);

    useEffect(() => {
        if (!location.state?.welcome) return;
        if (shownOnMount.current !== location.key) setWelcome(location.state.welcome);
        shownOnMount.current = null;
        navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
    }, [location, navigate]);

    if (!welcome) return null;
    return (
        <div className="gc-welcome" role="status">
            <span>
                <strong>Welcome to {welcome.company}.</strong> You're {welcome.role === "ADMIN" || welcome.role === "OWNER" ? "an" : "a"}{" "}
                {ROLE_LABELS[welcome.role] || welcome.role} here.
            </span>
            <button type="button" className="gc-button gc-button--ghost gc-button--small" onClick={() => setWelcome(null)}>
                Dismiss
            </button>
        </div>
    );
}

export default WelcomeNote;
