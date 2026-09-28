import React, { useLayoutEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { GateMark } from "../brand/GateMark";
import "./ds.css";

/**
 * The frame for signed-out and onboarding pages (DS-AUTH): black page, top
 * bar with the gate mark, one centered card. `wide` for onboarding.
 */
export function AuthLayout({ children, wide = false, backTo = "/", backLabel = "Back to site", footer }) {
    return (
        <div className="ds-page">
            <header className="ds-top">
                <Link className="ds-brand" to="/" aria-label="Gait home">
                    <GateMark className="ds-gate-mark" />
                    <span>Gait</span>
                </Link>
                <div className="ds-top-end">
                    <Link className="ds-top-link" to={backTo}>{backLabel}</Link>
                </div>
            </header>
            <main className={`ds-main ds-main--auth${wide ? " ds-main--auth-wide" : ""}`}>
                <section className="ds-card">{children}</section>
                {footer ? <p className="ds-foot">{footer}</p> : null}
            </main>
        </div>
    );
}

/**
 * The page's one <h1>. When a step replaces the card's content, the new
 * heading takes focus so screen readers hear where they are (`focusOnMount`).
 */
export function AuthHeading({ eyebrow, title, lede, focusOnMount = false }) {
    const ref = useRef(null);
    // Layout effect: focus lands in the same commit the heading appears.
    useLayoutEffect(() => {
        if (focusOnMount) ref.current?.focus();
    }, [focusOnMount]);
    return (
        <div className="ds-head">
            {eyebrow ? <p className="ds-eyebrow">{eyebrow}</p> : null}
            <h1 className="ds-title" tabIndex={-1} ref={ref}>{title}</h1>
            {lede ? <p className="ds-lede">{lede}</p> : null}
        </div>
    );
}

export default AuthLayout;
