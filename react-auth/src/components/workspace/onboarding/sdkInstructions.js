/**
 * UI2 Founder Onboarding — SDK setup instructions.
 *
 * Every value here was verified read-only against the actual SDK4
 * documentation (auth_integration-sdk4 worktree, commit
 * 5025561e89dec1dcf79703575c230e8c0c6e8ab4, branch
 * sdk4-tenant-security-signals), not invented or guessed:
 *
 *   - auth_integration/docs/AuthIntegration_Application_Identity.md
 *       (GAIT_APPLICATION_CREDENTIAL, verify_application())
 *   - auth_integration/docs/AuthIntegration_TenantSecuritySignals.md
 *       (send_security_signal())
 *   - auth_integration/docs/settings.md (GAIT_AUTH_URL)
 *   - README.md (install command pattern, commit-hash pinning)
 *
 * The tagged release (v0.3.12) does NOT include Application identity or
 * tenant security signals yet -- those commits exist only on the SDK4
 * branch, not yet merged/tagged. The install command below pins to that
 * exact commit (the same "pin to an exact commit hash" pattern the
 * package's own README already documents and both real Lumen consumers
 * already use), so a founder gets what they'd actually install today,
 * not what will exist once a future release ships.
 *
 * `verify_application()`/`send_security_signal()` are plain async
 * functions with no Django/FastAPI framework wiring (no middleware, no
 * dependency injection) as of SDK4 -- the instructions below are
 * deliberately honest about that rather than inventing an integration
 * hook that doesn't exist yet.
 */

const SDK_COMMIT = "5025561e89dec1dcf79703575c230e8c0c6e8ab4";
const GAIT_AUTH_URL = "https://ant-django-auth-62cf01255868.herokuapp.com/api";

export const FRAMEWORKS = [
  {
    key: "django",
    label: "Django",
    installExtra: "django",
    installCommand: `pip install "auth_integration[django] @ git+https://github.com/anthonynarine/auth_integration.git@${SDK_COMMIT}"`,
  },
  {
    key: "fastapi",
    label: "FastAPI",
    installExtra: "fastapi",
    installCommand: `pip install "auth_integration[fastapi] @ git+https://github.com/anthonynarine/auth_integration.git@${SDK_COMMIT}"`,
  },
];

export function getFramework(key) {
  return FRAMEWORKS.find((framework) => framework.key === key) || null;
}

export const GAIT_APPLICATION_CREDENTIAL_VAR = "GAIT_APPLICATION_CREDENTIAL";
export const GAIT_AUTH_URL_VALUE = GAIT_AUTH_URL;

export function buildSetupSteps({ frameworkKey, connectionKey }) {
  const framework = getFramework(frameworkKey);
  const displayKey = connectionKey || "<your Connection Key>";

  return [
    {
      title: "1. Install the Gait SDK",
      body: `In your ${framework ? framework.label : "backend"} service's environment:`,
      code: framework?.installCommand,
      note: "This pins to the exact SDK commit that includes Application identity and tenant security signals — the tagged release doesn't have them yet.",
    },
    {
      title: "2. Set your Connection Key as a backend environment variable",
      body: "Never in frontend code, a browser, or source control — this is a backend secret, same as a database password.",
      code: `${GAIT_APPLICATION_CREDENTIAL_VAR}=${displayKey}\nGAIT_AUTH_URL=${GAIT_AUTH_URL_VALUE}`,
    },
    {
      title: "3. Confirm Gait recognizes your service",
      body: "Call this once, wherever your service starts up or wherever you want to confirm its identity to Gait:",
      code:
        "from auth_integration.application import verify_application\n\nprincipal = await verify_application()  # reads GAIT_APPLICATION_CREDENTIAL",
      note: "There's no automatic middleware for this yet — it's one explicit call, wherever you choose to make it.",
    },
    {
      title: "4. (Optional) Report a security signal",
      body: "Once connected, your service can tell Gait about something it checked on itself — for example, a scheduled self-check:",
      code:
        'from auth_integration.security import send_security_signal\n\nawait send_security_signal(\n    signal_type="APPLICATION_SELF_CHECK",\n    result="PASS",\n    source_reference="nightly-check-2026-09-13",\n)',
      note: "This is your app reporting on itself, not Gait independently verifying it — Gait records it as customer-reported evidence, a different category from evidence Gait produces itself.",
    },
    {
      title: "5. Restart or redeploy",
      body: "The new package and environment variables only take effect after your backend service restarts.",
    },
  ];
}
