import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Dialog } from "../components/ui/Dialog";
import { PendingInvites } from "../invites/PendingInvites";
import { useMyInvites } from "../invites/useMyInvites";

/**
 * INV-UX: people who already have a workspace can still be invited to
 * another one. When invites are pending, the top bar offers them; nothing
 * shows otherwise.
 */
export function InvitationsButton() {
    const { orgSlug } = useParams();
    const myInvites = useMyInvites();
    const [open, setOpen] = useState(false);

    // Joining lands in the new workspace: close the dialog there.
    useEffect(() => {
        setOpen(false);
    }, [orgSlug]);

    const count = myInvites.invites.length;
    if (count === 0) return null;

    return (
        <>
            <button
                type="button"
                className="gc-button gc-button--ghost gc-invitations"
                onClick={() => setOpen(true)}
                aria-label={count === 1 ? "Invitations: 1 pending" : `Invitations: ${count} pending`}
            >
                <span className="gc-invitations-label">Invitations</span>
                <span className="gc-invitations-count" aria-hidden="true">{count}</span>
            </button>
            {open ? (
                <Dialog
                    title="Your invitations"
                    description="Workspaces that invited your confirmed email address. Joining adds one; you keep this one."
                    onClose={() => setOpen(false)}
                    footer={
                        <button type="button" className="gc-button gc-button--ghost" onClick={() => setOpen(false)}>
                            Close
                        </button>
                    }
                >
                    <PendingInvites invites={myInvites.invites} label="Your invitations" />
                </Dialog>
            ) : null}
        </>
    );
}

export default InvitationsButton;
