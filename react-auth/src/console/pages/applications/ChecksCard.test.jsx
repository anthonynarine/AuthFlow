import "@testing-library/jest-dom";
import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ChecksCard, SETUP_SNIPPET, checksSummary, factLabel, formatFact, sortChecks } from "./ChecksCard";
import { consoleKeys } from "../../api/queryKeys";
import { FEATURE_STATUS } from "../../../docs/featureStatus";

function check(overrides) {
    return {
        id: "CHK.DJANGO.DEBUG_OFF",
        title: "Django DEBUG is off",
        pack: "django",
        severity: "HIGH",
        result: "PASS",
        outcome: "ok",
        facts: { debug: false },
        reported_at: "2026-09-28T10:00:00Z",
        valid_until: "2026-10-05T10:00:00Z",
        stale: false,
        source_reference: "",
        remediation: "Set DEBUG = False in every deployed environment.",
        finding: null,
        ...overrides,
    };
}

const CHECKS = [
    check({}),
    check({
        id: "CHK.DJANGO.ALLOWED_HOSTS",
        title: "Django ALLOWED_HOSTS is an explicit allow-list",
        severity: "MEDIUM",
        result: "FAIL",
        outcome: "fail",
        facts: { host_count: 0, wildcard: true },
        remediation: "List your real host names in ALLOWED_HOSTS; never use '*'.",
        finding: { id: "f-1", status: "OPEN" },
    }),
    check({
        id: "CHK.DJANGO.SIGNING_KEY_STRENGTH",
        title: "The Django signing key is strong",
        severity: "HIGH",
        result: "FAIL",
        outcome: "fail",
        facts: { length: 12, unique_chars: 9, insecure_prefix: true, placeholder: false },
        finding: { id: "f-2", status: "ACKNOWLEDGED" },
    }),
    check({
        id: "CHK.DJANGO.HSTS",
        title: "HSTS is on",
        severity: "MEDIUM",
        result: "WARNING",
        outcome: "weak",
        facts: { hsts_seconds: 3600, django_ids: ["security.W004", "security.W005"] },
        stale: true,
        valid_until: "2026-09-20T10:00:00Z",
    }),
    check({
        id: "CHK.DJANGO.SECURE_PROXY",
        title: "Proxy SSL header is set correctly",
        severity: "LOW",
        result: "INFORMATIONAL",
        outcome: "not_applicable",
        facts: {},
    }),
];

const DATA = { checks: CHECKS, last_run_at: "2026-09-28T10:00:00Z", reported_checks: 5, total_checks: 21 };

function renderCard(checks, { environment = "production" } = {}) {
    return render(
        <MemoryRouter>
            <ChecksCard checks={checks} orgSlug="app-one" environment={environment} />
        </MemoryRouter>
    );
}

const loaded = (data) => ({ isLoading: false, isError: false, data, refetch: jest.fn() });

describe("CHK2a checks grid", () => {
    test("worst first: FAIL (by severity), then WARNING, informational, PASS", () => {
        expect(sortChecks(CHECKS).map((c) => c.id)).toEqual([
            "CHK.DJANGO.SIGNING_KEY_STRENGTH",
            "CHK.DJANGO.ALLOWED_HOSTS",
            "CHK.DJANGO.HSTS",
            "CHK.DJANGO.SECURE_PROXY",
            "CHK.DJANGO.DEBUG_OFF",
        ]);
        renderCard(loaded(DATA));
        const titles = within(screen.getByRole("list", { name: "Built-in checks" }))
            .getAllByRole("heading", { level: 3 })
            .map((heading) => heading.textContent);
        expect(titles[0]).toBe("The Django signing key is strong");
        expect(titles[titles.length - 1]).toBe("Django DEBUG is off");
    });

    test("colour is the result only: FAIL red, WARNING amber, PASS green, informational grey", () => {
        renderCard(loaded(DATA));
        expect(screen.getAllByText("Fail")[0]).toHaveClass("gc-badge--bad");
        expect(screen.getByText("Weak")).toHaveClass("gc-badge--warn");
        expect(screen.getByText("Pass")).toHaveClass("gc-badge--good");
        expect(screen.getByText("Not applicable")).toHaveClass("gc-badge--muted");
        // Severity is plain text, never a coloured pill.
        screen.getAllByText(/severity/).forEach((line) => expect(line).not.toHaveClass("gc-badge"));
    });

    test("labelled self-reported, with the last run and the count out of 21", () => {
        renderCard(loaded(DATA));
        expect(screen.getByText("Reported by your application")).toHaveClass("gc-badge");
        expect(screen.getByText(/Last run/)).toBeInTheDocument();
        expect(screen.getByText("5 of 21 checks reported · 2 failing")).toBeInTheDocument();
    });

    test("a stale check gets a muted Stale badge and a muted 'Out of date since' line", () => {
        renderCard(loaded(DATA));
        const stale = screen.getByText("Stale");
        expect(stale).toHaveClass("gc-badge--muted");
        const since = screen.getByText(/Out of date since/);
        expect(since).toHaveClass("gc-cell-sub");
        expect(screen.getAllByText("Stale")).toHaveLength(1);
    });

    test("a finding links to the console finding in the application's environment", () => {
        renderCard(loaded(DATA), { environment: "local" });
        expect(
            screen.getByRole("link", { name: "View the finding for Django ALLOWED_HOSTS is an explicit allow-list" })
        ).toHaveAttribute("href", "/console/app-one/security/findings/f-1?env=local");
        expect(screen.getAllByRole("link", { name: /View the finding for/ })).toHaveLength(2);
    });

    test("details: facts as a readable list (Yes/No, numbers, lists; no JSON) and how to fix", () => {
        renderCard(loaded(DATA));
        const row = (title) => screen.getByRole("listitem", { name: title });
        const hosts = row("Django ALLOWED_HOSTS is an explicit allow-list");
        fireEvent.click(within(hosts).getByText("Details and how to fix"));
        expect(within(hosts).getByText("Host count")).toBeInTheDocument();
        expect(within(hosts).getByText("0")).toBeInTheDocument();
        expect(within(hosts).getByText("Wildcard")).toBeInTheDocument();
        expect(within(hosts).getByText("Yes")).toBeInTheDocument();
        expect(within(hosts).getByText("List your real host names in ALLOWED_HOSTS; never use '*'.")).toBeInTheDocument();

        const hsts = row("HSTS is on");
        expect(within(hsts).getByText("Django check IDs")).toBeInTheDocument();
        expect(within(hsts).getByText("security.W004, security.W005")).toBeInTheDocument();

        const informational = row("Proxy SSL header is set correctly");
        expect(within(informational).getByText("No details were reported for this check.")).toBeInTheDocument();

        expect(screen.getByRole("list", { name: "Built-in checks" }).textContent).not.toMatch(/[{}]|"debug"|\[\s*"/);
    });

    test("fact names read as words, with acronyms kept", () => {
        expect(factLabel("host_count")).toBe("Host count");
        expect(factLabel("hsts_seconds")).toBe("HSTS seconds");
        expect(factLabel("csrf_secure")).toBe("CSRF secure");
        expect(factLabel("tls_required")).toBe("TLS required");
        expect(factLabel("django_ids")).toBe("Django check IDs");
    });

    test("formatFact never dumps JSON", () => {
        expect(formatFact(true)).toBe("Yes");
        expect(formatFact(false)).toBe("No");
        expect(formatFact(0)).toBe("0");
        expect(formatFact([])).toBe("None");
        expect(formatFact(["a", "b"])).toBe("a, b");
        expect(formatFact(null)).toBe("—");
        expect(formatFact({ nested: 1 })).toBe("—");
    });

    test("empty: 'No checks reported yet', the setup commands, and Early access from featureStatus", () => {
        renderCard(loaded({ checks: [], last_run_at: null, reported_checks: 0, total_checks: 21 }));
        expect(screen.getByText("No checks reported yet")).toBeInTheDocument();
        expect(screen.getByLabelText("Setup commands")).toHaveTextContent('pip install "gait-sdk[django]"');
        expect(screen.getByLabelText("Setup commands")).toHaveTextContent("python manage.py gait_check");
        expect(SETUP_SNIPPET).toBe('pip install "gait-sdk[django]"\npython manage.py gait_check');
        expect(FEATURE_STATUS.checkPacks).toBe("earlyAccess");
        expect(screen.getByText("Early access")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "gait-sdk docs" })).toHaveAttribute("href", "/docs/gait-sdk");
        expect(checksSummary({ checks: [], reported_checks: 0, total_checks: 21 })).toBeNull();
    });

    test("loading and error states", () => {
        const { rerender } = renderCard({ isLoading: true });
        expect(screen.getByText("Loading checks…")).toBeInTheDocument();
        rerender(
            <MemoryRouter>
                <ChecksCard
                    checks={{ isLoading: false, isError: true, error: { response: { status: 404 } }, refetch: jest.fn() }}
                    orgSlug="app-one"
                    environment="production"
                />
            </MemoryRouter>
        );
        expect(screen.getByRole("alert")).toHaveTextContent("This doesn't exist, or you don't have access to it.");
    });

    test("the query key is scoped to the workspace slug and the application id", () => {
        expect(consoleKeys.applicationChecks("app-one", "a1")).toEqual(["console", "app-one", "all", "applications", "a1", "checks"]);
        expect(consoleKeys.applicationChecks("app-two", "a1")).not.toEqual(consoleKeys.applicationChecks("app-one", "a1"));
    });
});
