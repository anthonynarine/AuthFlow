/**
 * Founder onboarding: SDK setup instructions.
 *
 * Every version, URL and snippet comes from docs/content/snippets.js, the
 * same source the public docs use, so onboarding and /docs can never drift
 * apart. Connection helpers checked against gait-sdk v0.5.4:
 *
 *   - extras: `gait-sdk[django]`, `gait-sdk[fastapi]`
 *   - gait_sdk.application.verify_application(): an explicit async call that
 *     reads GAIT_APPLICATION_CREDENTIAL (no middleware does this for you)
 *   - gait_sdk.security.send_security_signal()
 */
import {
    GAIT_API_URL,
    REPORT,
    ENV_VARS,
    DJANGO_APPLICATION_SETTINGS,
    VERIFY_APPLICATION,
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

export function buildVerification({ organizationSlug, application } = {}) {
    return VERIFY_APPLICATION
        .replace('"<your workspace slug>"', () => JSON.stringify(organizationSlug || "<your workspace slug>"))
        .replace('"<your application slug>"', () => JSON.stringify(application?.slug || "<your application slug>"))
        .replace('EXPECTED_ENVIRONMENT = "local"', () => `EXPECTED_ENVIRONMENT = ${JSON.stringify(application?.environment || "local")}`);
}

export function buildSetupSteps({ frameworkKey, organizationSlug, application }) {
    const framework = getFramework(frameworkKey);


    return [
        {
            title: "1. Install the Gait SDK",
            body: `In your ${framework ? framework.label : "backend"} service's environment:`,
            code: framework?.installCommand,
        },
        {
            title: "2. Set your Connection Key as a backend environment variable",
            body: "For development, put these values in your backend project root’s .env file and add .env to .gitignore. In production, use your host’s secret settings. Replace the placeholder with your saved key. Keep it out of Git, frontend code and frontend build variables.",
            code: ENV_VARS,
        },
        {
            title: `3. Configure ${framework?.label || "your backend"}`,
            body: frameworkKey === "django"
                ? "Expose these values in settings.py using python-decouple, or your existing environment loader. Restart your backend after changing configuration."
                : "The SDK reads environment variables, then searches for .env from the process working directory and its parents. Start from your backend project root. Configure variables before importing gait_sdk, then restart your backend after changes.",
            code: frameworkKey === "django" ? DJANGO_APPLICATION_SETTINGS : null,
        },
        {
            title: "4. Confirm Gait recognizes your service",
            body: `Save this as check_gait.py in your backend root, then run ${frameworkKey === "django" ? "python manage.py shell --interface python < check_gait.py" : "python check_gait.py"}. It checks the expected workspace, application and environment.`,
            code: buildVerification({ organizationSlug, application }),
            note: "There's no automatic middleware for this — it's one explicit call, wherever you choose to make it.",
        },
        {
            title: "5. (Optional) Report a security check",
            body: "Once connected, your service can tell Gait about something it checked on itself — for example, a scheduled self-check:",
            code: REPORT,
            note: "This is your app reporting on itself, not Gait independently verifying it — Gait labels it Self-reported.",
        },
        {
            title: "6. Restart or redeploy",
            body: "The new package and environment variables only take effect after your backend service restarts.",
        },
    ];
}
