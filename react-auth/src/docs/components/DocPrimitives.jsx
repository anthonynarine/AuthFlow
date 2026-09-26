import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { docPath } from "../manifest";

/** A top-level section of a docs page. Its h2 feeds the "On this page" list. */
export function DocSection({ id, title, children }) {
    return (
        <section className="doc-section" aria-labelledby={id}>
            <h2 id={id} className="doc-h2">
                {title}
            </h2>
            {children}
        </section>
    );
}

/** Link to another docs page (optionally a section of it): <DocLink to="troubleshooting#invites">. */
export function DocLink({ to, children }) {
    const [slug, hash] = to.split("#");
    return <Link to={`${docPath(slug)}${hash ? `#${hash}` : ""}`}>{children}</Link>;
}

const CALLOUT_LABELS = {
    availability: "Availability",
    note: "Note",
    warning: "Important",
};

export function Callout({ kind = "note", title, children }) {
    return (
        <aside className={`doc-callout doc-callout--${kind}`} aria-label={title || CALLOUT_LABELS[kind]}>
            <p className="doc-callout-title">{title || CALLOUT_LABELS[kind]}</p>
            <div className="doc-callout-body">{children}</div>
        </aside>
    );
}

/**
 * Wraps a <table> so a wide table scrolls inside itself (keyboard-focusable)
 * instead of making the whole page scroll sideways on a phone.
 */
export function DocTable({ caption, children }) {
    return (
        <div className="doc-table-wrap" role="region" aria-label={caption} tabIndex={0}>
            <table className="doc-table">
                <caption className="doc-visually-hidden">{caption}</caption>
                {children}
            </table>
        </div>
    );
}

const COPY_TIMEOUT_MS = 2000;

/** A code block with a copy button. Only ever holds example text, never secrets. */
export function CodeBlock({ code, label = "Code" }) {
    const [status, setStatus] = useState("idle");
    const resetTimer = useRef(null);

    useEffect(() => () => clearTimeout(resetTimer.current), []);

    const onCopy = async () => {
        clearTimeout(resetTimer.current);
        try {
            if (!navigator.clipboard?.writeText) {
                throw new Error("Clipboard unavailable");
            }
            // Some browsers leave writeText pending forever (e.g. a background
            // tab); treat that as a failure instead of showing nothing.
            await Promise.race([
                navigator.clipboard.writeText(code),
                new Promise((_, reject) => {
                    resetTimer.current = setTimeout(() => reject(new Error("Clipboard timed out")), COPY_TIMEOUT_MS);
                }),
            ]);
            clearTimeout(resetTimer.current);
            setStatus("copied");
        } catch {
            setStatus("failed");
        }
        resetTimer.current = setTimeout(() => setStatus("idle"), 2500);
    };

    return (
        <div className="doc-code">
            <div className="doc-code-head">
                <span className="doc-code-label">{label}</span>
                <button type="button" className="doc-code-copy" onClick={onCopy} aria-label={`Copy ${label.toLowerCase()}`}>
                    {status === "copied" ? "Copied" : "Copy"}
                </button>
            </div>
            <pre className="doc-code-pre" tabIndex={0}>
                <code>{code}</code>
            </pre>
            <p className={status === "failed" ? "doc-code-error" : "doc-visually-hidden"} role="status" aria-live="polite">
                {status === "copied" && "Copied to clipboard"}
                {status === "failed" && "Couldn't copy. Select the text and copy it manually."}
            </p>
        </div>
    );
}
