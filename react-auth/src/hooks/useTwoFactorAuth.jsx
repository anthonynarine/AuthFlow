import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { afterSignIn } from "../auth/returnTo";
import { publicAxios, SESSION_TRANSPORT } from "../interceptors/axios";
import { persistAuthTokens } from "../interceptors/tokenStorage";
import { useBasicAuthServices } from "../context/auth/BasicAuthContext";

function recoveryNotice(remaining) {
    if (remaining === 0) {
        return "You signed in with your last recovery code. Make new codes now, or turn two-step verification off and on again with your new phone.";
    }
    const left = remaining === 1 ? "1 recovery code" : `${remaining} recovery codes`;
    return `You signed in with a recovery code. You have ${left} left. If your phone is gone, set up two-step again with your new one.`;
}

/**
 * The sign-in code step: a 6-digit code from the authenticator app, or one of
 * the account's single-use recovery codes (AUTH-B). Setup lives on
 * /account/two-step (accountApi), not here.
 */
export const useTwoFactorAuth = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [twoFactorError, setTwoFactorError] = useState(null);
    const [sessionExpired, setSessionExpired] = useState(false);

    const { setIsLoggedIn, cancelTwoFactor } = useBasicAuthServices();
    const navigate = useNavigate();

    // returnTo survives the code step. A recovery-code sign-in goes to the
    // Account page instead, where a lost phone gets sorted out.
    const verify2FA = useCallback(async (value, { returnTo, recovery = false } = {}) => {
        setIsLoading(true);
        setTwoFactorError(null);
        setSessionExpired(false);
        try {
            // The refresh token comes back only as an HttpOnly cookie; the
            // body carries the access token (and a count, for recovery codes).
            const proof = recovery ? { recovery_code: value.trim() } : { otp: value };
            const { data } = await publicAxios.post("/two-factor-login/", { ...proof, ...SESSION_TRANSPORT }, { withCredentials: true });
            persistAuthTokens({ accessToken: data.access_token });
            setIsLoggedIn(true);
            if (recovery) {
                navigate("/account", { state: { notice: recoveryNotice(data.recovery_codes_remaining ?? 0) } });
            } else {
                navigate(afterSignIn(returnTo));
            }
        } catch (error) {
            // Gait refuses a wrong or expired code and says little; say what
            // to do instead of "an error occurred".
            const status = error.response?.status;
            if (status === 401) {
                // The password step's token is spent or expired: start again.
                setSessionExpired(true);
                cancelTwoFactor?.();
            } else if (status === 429) {
                setTwoFactorError(
                    recovery ? "Too many attempts. Wait a minute, then try again." : "Too many attempts. Wait a minute, then enter the code showing now."
                );
            } else if (status && status < 500) {
                setTwoFactorError(
                    recovery
                        ? "That recovery code didn't work. Check it, or try another one. Each works only once."
                        : "That code didn't work. Codes change every 30 seconds; enter the one showing now."
                );
            } else {
                setTwoFactorError("We couldn't check that code just now. Try again in a moment.");
            }
        } finally {
            setIsLoading(false);
        }
    }, [navigate, setIsLoggedIn, cancelTwoFactor]);

    return { isLoading, twoFactorError, sessionExpired, verify2FA };
};
