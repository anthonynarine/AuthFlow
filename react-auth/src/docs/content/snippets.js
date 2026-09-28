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

// Verify your product's users (Early access): Django REST Framework, in the
// SDK's default "introspection" mode, which needs only GAIT_AUTH_URL. The SDK's
// "jwks" mode waits until Gait publishes signing keys (its JWKS is empty today).
export const VERIFY_USER_SETTINGS = `# settings.py
# "gait_sdk" checks the configuration at startup.
INSTALLED_APPS = [..., "gait_sdk"]

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ["gait_sdk.authentication.ExternalJWTAuthentication"],
}

GAIT_AUTH_URL = "${GAIT_API_URL}"`;

export const VERIFY_USER_VIEW = `# views.py
class ProjectList(APIView):
    def get(self, request):
        # Who Gait says this is: identity.subject, identity.email
        identity = request.verified_identity
        # Your product decides what they may see.
        ...`;
