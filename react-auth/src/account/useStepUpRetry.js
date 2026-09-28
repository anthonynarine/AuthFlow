import { useCallback, useRef } from "react";
import { useStepUpDialog } from "../hooks/useStepUpDialog";
import { isStepUpRequiredError } from "../utils/stepUpUtils";

/**
 * Runs an account action; if Gait answers 403 STEP_UP_REQUIRED, asks the
 * person to confirm it's them (ConfirmItsYouDialog) and then runs the same
 * action again. Resolves {ok: true, value} on success or {ok: false,
 * cancelled: true} if they close the dialog; other errors reject as usual.
 */
export function useStepUpRetry() {
    const stepUp = useStepUpDialog();
    const pending = useRef(null);

    const run = useCallback(
        (action, label) =>
            new Promise((resolve, reject) => {
                const attempt = async () => {
                    try {
                        resolve({ ok: true, value: await action() });
                    } catch (error) {
                        if (isStepUpRequiredError(error)) {
                            pending.current = { attempt, resolve };
                            stepUp.requestStepUp(error, label);
                        } else {
                            reject(error);
                        }
                    }
                };
                attempt();
            }),
        [stepUp]
    );

    const confirm = useCallback(
        async (proof) => {
            const result = await stepUp.submitStepUp(proof);
            if (result.ok) {
                const next = pending.current;
                pending.current = null;
                stepUp.closeStepUp();
                next?.attempt();
            }
            return result;
        },
        [stepUp]
    );

    const cancel = useCallback(() => {
        pending.current?.resolve({ ok: false, cancelled: true });
        pending.current = null;
        stepUp.closeStepUp();
    }, [stepUp]);

    return { run, dialog: { state: stepUp.state, confirm, cancel } };
}

export default useStepUpRetry;
