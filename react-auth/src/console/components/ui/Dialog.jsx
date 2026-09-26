import React, { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

const FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * A modal dialog: labelled by its title, focus moves inside on open and
 * stays inside (Tab wraps), Escape closes, and focus returns to whatever
 * opened it. `closeOnBackdrop` is off for dialogs whose content must not be
 * dismissed by a stray click (e.g. a one-time secret).
 */
export function Dialog({ title, description, children, footer, onClose, closeOnBackdrop = true, initialFocusRef }) {
    const titleId = useId();
    const descriptionId = useId();
    const panelRef = useRef(null);

    useEffect(() => {
        const opener = document.activeElement;
        const target = initialFocusRef?.current || panelRef.current?.querySelector(FOCUSABLE) || panelRef.current;
        target?.focus();
        return () => {
            if (opener && typeof opener.focus === "function") opener.focus();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onKeyDown = (event) => {
        if (event.key === "Escape") {
            event.stopPropagation();
            onClose();
            return;
        }
        if (event.key !== "Tab") return;
        const focusable = Array.from(panelRef.current.querySelectorAll(FOCUSABLE));
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    };

    return createPortal(
        <div
            className="gc-dialog-backdrop"
            onMouseDown={(event) => {
                if (closeOnBackdrop && event.target === event.currentTarget) onClose();
            }}
        >
            <div
                ref={panelRef}
                className="gc-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={description ? descriptionId : undefined}
                tabIndex={-1}
                onKeyDown={onKeyDown}
            >
                <h2 id={titleId} className="gc-dialog-title">{title}</h2>
                {description ? <p id={descriptionId} className="gc-dialog-description">{description}</p> : null}
                <div className="gc-dialog-body">{children}</div>
                {footer ? <div className="gc-dialog-footer">{footer}</div> : null}
            </div>
        </div>,
        document.body
    );
}

export default Dialog;
