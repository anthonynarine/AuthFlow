import React from "react";
import { useNavigate } from "react-router-dom";
import { useBasicAuthServices } from "../context/auth/BasicAuthContext";
import { UserMenu } from "./UserMenu";

/**
 * The console's user menu (Account, with the amber "2FA off" flag; Docs;
 * Sign out) for every other signed-in shell: the home page, the workspace
 * nav and the security pages. It reads the person from the auth context.
 * After signing out it goes to `afterSignOut` (sign-in by default); pass
 * null to stay on the page.
 */
export function AccountMenu({ status, afterSignOut = "/login" }) {
    const { user, logout } = useBasicAuthServices();
    const navigate = useNavigate();
    if (!user) return null;
    const onSignOut = async () => {
        await logout();
        if (afterSignOut) navigate(afterSignOut, { replace: true });
    };
    return <UserMenu user={user} status={status} onSignOut={onSignOut} />;
}

export default AccountMenu;
