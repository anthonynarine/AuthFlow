/*
 * SDK facts and code shown in more than one place: the docs (Connecting your
 * software, Quickstart) and the console's onboarding instructions. Import
 * these; never copy them, so nothing can drift apart.
 */

export const SDK_VERSION = "0.5.1";
export const GAIT_API_URL = "https://api.gaitobservatory.com/api";

/** `pip install "gait-sdk[django]==0.5.1"`, or without an extra for anything else. */
export function installCommand(extra) {
    return `pip install "gait-sdk${extra ? `[${extra}]` : ""}==${SDK_VERSION}"`;
}

export const INSTALL = `${installCommand("django")}   # Django projects
${installCommand()}           # anything else`;

// Placeholder only. Never replace it with anything that looks like a real key.
export const CONNECTION_KEY_PLACEHOLDER = "<your connection key>";

export const ENV_VARS = `GAIT_AUTH_URL=${GAIT_API_URL}
GAIT_APPLICATION_CREDENTIAL=${CONNECTION_KEY_PLACEHOLDER}`;

export const REPORT = `import asyncio
from gait_sdk.security import APPLICATION_SELF_CHECK, send_security_signal

asyncio.run(send_security_signal(
    signal_type=APPLICATION_SELF_CHECK,
    result="FAIL",                                       # or "PASS"
    source_reference="self-check:2026-09-25T20:00Z:1",   # unique per run
    payload={"checks": {"debug_disabled": "FAIL", "hsts_enabled": "PASS"}},
))`;
