import React from "react";
import "./ui.css";

/**
 * Console UI primitives. Presentational only -- no data fetching, no
 * routing. Colors come from the app's design tokens (src/index.css).
 */

export function PageHeader({ title, description, actions }) {
    return (
        <header className="gc-page-header">
            <div>
                <h1 className="gc-page-title">{title}</h1>
                {description ? <p className="gc-page-description">{description}</p> : null}
            </div>
            {actions ? <div className="gc-page-actions">{actions}</div> : null}
        </header>
    );
}

export function Card({ title, subtitle, actions, children, className = "", as: Tag = "section" }) {
    return (
        <Tag className={`gc-card ${className}`.trim()}>
            {title || actions ? (
                <div className="gc-card-head">
                    <div>
                        {title ? <h2 className="gc-card-title">{title}</h2> : null}
                        {subtitle ? <p className="gc-card-subtitle">{subtitle}</p> : null}
                    </div>
                    {actions ? <div className="gc-card-actions">{actions}</div> : null}
                </div>
            ) : null}
            {children}
        </Tag>
    );
}

const TONES = {
    // posture / control status
    HEALTHY: "good",
    NEEDS_ATTENTION: "warn",
    CONTROL_FAILURE: "bad",
    UNKNOWN: "muted",
    // finding status
    OPEN: "bad",
    ACKNOWLEDGED: "warn",
    RESOLVED: "good",
    ACCEPTED_RISK: "info",
    FALSE_POSITIVE: "muted",
    // severity
    CRITICAL: "bad",
    HIGH: "bad",
    WARNING: "warn",
    INFO: "muted",
    // app / membership status
    ACTIVE: "good",
    SUSPENDED: "warn",
    REVOKED: "muted",
    PENDING: "info",
    // roles
    OWNER: "accent",
    ADMIN: "info",
    MEMBER: "muted",
    // evidence trust
    SELF_REPORTED: "warn",
    GAIT_VERIFIED: "good",
};

/** A status/severity/role/trust pill. `value` picks the tone; `label` defaults to a humanized value. */
export function Badge({ value, label, tone }) {
    const resolvedTone = tone || TONES[value] || "muted";
    const text = label || humanize(value);
    return <span className={`gc-badge gc-badge--${resolvedTone}`}>{text}</span>;
}

export function EmptyState({ title, children, action }) {
    return (
        <div className="gc-state gc-state--empty" role="status">
            <p className="gc-state-title">{title}</p>
            {children ? <div className="gc-state-body">{children}</div> : null}
            {action ? <div className="gc-state-action">{action}</div> : null}
        </div>
    );
}

export function LoadingState({ label = "Loading…" }) {
    return (
        <div className="gc-state gc-state--loading" role="status" aria-live="polite">
            <span className="gc-spinner" aria-hidden="true" />
            <span>{label}</span>
        </div>
    );
}

/** Explains an API failure without leaking internals; 403/404 get plain-language text. */
export function ErrorState({ error, onRetry }) {
    const status = error?.response?.status;
    const message =
        status === 404
            ? "This doesn't exist, or you don't have access to it."
            : status === 403
                ? "Your role in this workspace can't do that."
                : error?.response?.data?.detail || "Something went wrong talking to Gait.";
    return (
        <div className="gc-state gc-state--error" role="alert">
            <p className="gc-state-title">{message}</p>
            {onRetry && status !== 404 && status !== 403 ? (
                <button type="button" className="gc-button gc-button--ghost" onClick={onRetry}>
                    Try again
                </button>
            ) : null}
        </div>
    );
}

/**
 * A simple, accessible table. `columns`: [{ key, header, render?(row), align? }].
 * `rowKey(row)` must be stable.
 */
export function DataTable({ columns, rows, rowKey, emptyTitle = "Nothing here yet.", caption }) {
    if (!rows || rows.length === 0) {
        return <EmptyState title={emptyTitle} />;
    }
    return (
        <div className="gc-table-wrap">
            <table className="gc-table">
                {caption ? <caption className="gc-visually-hidden">{caption}</caption> : null}
                <thead>
                    <tr>
                        {columns.map((column) => (
                            <th key={column.key} scope="col" style={{ textAlign: column.align || "left" }}>
                                {column.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={rowKey(row)}>
                            {columns.map((column) => (
                                <td key={column.key} style={{ textAlign: column.align || "left" }}>
                                    {column.render ? column.render(row) : row[column.key]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function humanize(value) {
    if (!value) {
        return "";
    }
    const text = String(value).replace(/_/g, " ").toLowerCase();
    return text.charAt(0).toUpperCase() + text.slice(1);
}
