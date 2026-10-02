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

// Add Gait sign-in to your product: your server, not the browser, talks to Gait.
export const SERVER_SIGN_IN = `# Your server, not the browser, talks to Gait.
import requests

GAIT = "${GAIT_API_URL}"

def sign_in(email, password):
    r = requests.post(f"{GAIT}/login/", json={"email": email, "password": password}, timeout=5)
    if r.status_code == 401 and r.json().get("2fa_required"):
        # Keep this with the pending sign-in, on your server: 10 minutes, one use.
        return {"needs_code": True, "temp_token": r.cookies.get("temp_token")}
    r.raise_for_status()
    return r.json()  # {"access_token": ..., "refresh_token": ...}

def send_code(temp_token, code):
    r = requests.post(
        f"{GAIT}/two-factor-login/",
        json={"otp": code},  # or {"recovery_code": ...}
        cookies={"temp_token": temp_token},
        timeout=5,
    )
    r.raise_for_status()
    return r.json()  # the same two tokens`;

export const SERVER_REFRESH_SIGN_OUT = `def refresh(refresh_token):
    r = requests.post(f"{GAIT}/token-refresh/", json={"refresh_token": refresh_token}, timeout=5)
    r.raise_for_status()
    return r.json()  # save BOTH tokens: the refresh token changes every time

def sign_out(refresh_token):
    requests.post(f"{GAIT}/logout/", json={"refresh_token": refresh_token}, timeout=5)`;

export const LIVE_SESSION_VIEW = `from gait_sdk.django.authentication import require_live_session

def post(self, request, project_id):
    ...                            # 1. your own rules first
    require_live_session(request)  # 2. always asks Gait: 401 if signed out, 503 if unreachable
    ...                            # 3. make the change`;

export const LINK_ON_FIRST_REQUEST = `# Create your user the first time someone signs in.
account, _ = Account.objects.get_or_create(
    gait_subject=request.user.id,
    defaults={"email": request.user.email},
)`;

export const LINK_BY_INVITE = `# Only people you've invited get in.
member = Member.objects.filter(team=team, gait_subject=request.user.id).first()
if member is None:
    raise NotFound()`;
