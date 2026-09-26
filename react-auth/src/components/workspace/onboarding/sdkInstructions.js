/**
 * Founder onboarding: SDK setup instructions.
 *
 * Every version, URL and snippet comes from docs/content/snippets.js, the
 * same source the public docs use, so onboarding and /docs can never drift
 * apart. Checked against gait-sdk v0.5.1 (PyPI):
 *
 *   - extras: `gait-sdk[django]`, `gait-sdk[fastapi]`
 *   - gait_sdk.application.verify_application(): an explicit async call that
 *     reads GAIT_APPLICATION_CREDENTIAL (no middleware does this for you)
 *   - gait_sdk.security.send_security_signal()
 */
import {
    CONNECTION_KEY_PLACEHOLDER,
    GAIT_API_URL,
    REPORT,
    installCommand,
} from "../../../docs/content/snippets";

export const FRAMEWORKS = [
    { key: "django", label: "Django", installExtra: "django", installCommand: installCommand("django") },
    { key: "fastapi", label: "FastAPI", installExtra: "fastapi", installCommand: installCommand("fastapi") },
];

export function getFramework(key) {
    return FRAMEWORKS.find((framework) => framework.key === key) || null;
}

export const GAIT_APPLICATION_CREDENTIAL_VAR = "GAIT_APPLICATION_CREDENTIAL";
export const GAIT_AUTH_URL_VALUE = GAIT_API_URL;

const VERIFY = `from gait_sdk.application import verify_application

principal = await verify_application()  # reads GAIT_APPLICATION_CREDENTIAL`;

export function buildSetupSteps({ frameworkKey, connectionKey }) {
    const framework = getFramework(frameworkKey);
    const displayKey = connectionKey || CONNECTION_KEY_PLACEHOLDER;

    return [
        {
            title: "1. Install the Gait SDK",
            body: `In your ${framework ? framework.label : "backend"} service's environment:`,
            code: framework?.installCommand,
        },
        {
            title: "2. Set your Connection Key as a backend environment variable",
            body: "Never in frontend code, a browser, or source control — this is a backend secret, same as a database password.",
            code: `${GAIT_APPLICATION_CREDENTIAL_VAR}=${displayKey}\nGAIT_AUTH_URL=${GAIT_AUTH_URL_VALUE}`,
        },
        {
            title: "3. Confirm Gait recognizes your service",
            body: "Call this once, wherever your service starts up or wherever you want to confirm its identity to Gait:",
            code: VERIFY,
            note: "There's no automatic middleware for this — it's one explicit call, wherever you choose to make it.",
        },
        {
            title: "4. (Optional) Report a security check",
            body: "Once connected, your service can tell Gait about something it checked on itself — for example, a scheduled self-check:",
            code: REPORT,
            note: "This is your app reporting on itself, not Gait independently verifying it — Gait labels it Self-reported.",
        },
        {
            title: "5. Restart or redeploy",
            body: "The new package and environment variables only take effect after your backend service restarts.",
        },
    ];
}
