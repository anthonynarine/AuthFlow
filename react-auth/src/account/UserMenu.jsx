import React, { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "../ds/ds.css";

function initials(user) {
    const fromName = [user?.first_name, user?.last_name].filter(Boolean).map((part) => part[0]).join("");
    return (fromName || user?.email?.[0] || "?").toUpperCase().slice(0, 2);
}

/**
 * The person's menu in the top bar: Account (flagged while two-step
 * verification is off), Docs, Sign out. A menu button: Enter/Space/ArrowDown
 * open it, arrows move, Escape closes and returns focus, a click outside closes.
 * `status` (e.g. "Read only" on the security pages) shows beside the email.
 */
export function UserMenu({ user, onSignOut, status }) {
    const [open, setOpen] = useState(false);
    const menuId = useId();
    const buttonRef = useRef(null);
    const menuRef = useRef(null);
    const twoFactorOff = user?.is_2fa_enabled === false;
    const name = [user?.first_name, user?.last_name].filter(Boolean).join(" ");

    const items = () => Array.from(menuRef.current?.querySelectorAll('[role="menuitem"]') || []);

    useEffect(() => {
        if (!open) return undefined;
        items()[0]?.focus();
        const onPointer = (event) => {
            if (!menuRef.current?.contains(event.target) && !buttonRef.current?.contains(event.target)) setOpen(false);
        };
        document.addEventListener("mousedown", onPointer);
        return () => document.removeEventListener("mousedown", onPointer);
    }, [open]);

    const close = (refocus = true) => {
        setOpen(false);
        if (refocus) buttonRef.current?.focus();
    };

    const onMenuKeyDown = (event) => {
        const list = items();
        const index = list.indexOf(document.activeElement);
        if (event.key === "Escape") {
            event.preventDefault();
            close();
        } else if (event.key === "ArrowDown") {
            event.preventDefault();
            list[(index + 1) % list.length]?.focus();
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            list[(index - 1 + list.length) % list.length]?.focus();
        } else if (event.key === "Home") {
            event.preventDefault();
            list[0]?.focus();
        } else if (event.key === "End") {
            event.preventDefault();
            list[list.length - 1]?.focus();
        } else if (event.key === "Tab") {
            setOpen(false);
        }
    };

    return (
        <div className="ds-user">
            <button
                type="button"
                ref={buttonRef}
                className="ds-user-button"
                aria-haspopup="menu"
                aria-expanded={open}
                aria-controls={open ? menuId : undefined}
                aria-label={`Your account${twoFactorOff ? ", two-step verification is off" : ""}`}
                onClick={() => setOpen((value) => !value)}
                onKeyDown={(event) => {
                    if (event.key === "ArrowDown" && !open) {
                        event.preventDefault();
                        setOpen(true);
                    }
                }}
            >
                <span className="ds-avatar" aria-hidden="true">{initials(user)}</span>
                <span className="ds-user-email">{user?.email}</span>
                {status ? <span className="ds-user-status">{status}</span> : null}
                {twoFactorOff ? <span className="ds-dot" aria-hidden="true" /> : null}
            </button>
            {open ? (
                <div className="ds-menu" id={menuId} role="menu" aria-label="Your account" ref={menuRef} onKeyDown={onMenuKeyDown}>
                    <div className="ds-menu-head" role="none">
                        {name ? <strong>{name}</strong> : null}
                        {user?.email}
                        {status ? <span className="ds-menu-status">{status}</span> : null}
                    </div>
                    <Link role="menuitem" className="ds-menu-item" to="/account" onClick={() => close(false)}>
                        Account
                        {twoFactorOff ? <span className="ds-menu-note">2FA off</span> : null}
                    </Link>
                    <Link role="menuitem" className="ds-menu-item" to="/docs" onClick={() => close(false)}>
                        Docs
                    </Link>
                    <button
                        type="button"
                        role="menuitem"
                        className="ds-menu-item"
                        onClick={() => {
                            close(false);
                            onSignOut();
                        }}
                    >
                        Sign out
                    </button>
                </div>
            ) : null}
        </div>
    );
}

export default UserMenu;
