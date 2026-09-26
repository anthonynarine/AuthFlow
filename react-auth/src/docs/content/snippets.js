/*
 * Code shown on more than one docs page (Connecting your software, Quickstart).
 * Import these; never copy them, so the pages can't drift apart.
 */

export const INSTALL = `pip install "gait-sdk[django]==0.5.1"   # Django projects
pip install "gait-sdk==0.5.1"           # anything else`;

// Placeholder only. Never replace it with anything that looks like a real key.
export const ENV_VARS = `GAIT_AUTH_URL=https://api.gaitobservatory.com/api
GAIT_APPLICATION_CREDENTIAL=<your connection key>`;

export const REPORT = `import asyncio
from gait_sdk.security import APPLICATION_SELF_CHECK, send_security_signal

asyncio.run(send_security_signal(
    signal_type=APPLICATION_SELF_CHECK,
    result="FAIL",                                       # or "PASS"
    source_reference="self-check:2026-09-25T20:00Z:1",   # unique per run
    payload={"checks": {"debug_disabled": "FAIL", "hsts_enabled": "PASS"}},
))`;
