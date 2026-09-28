import "@testing-library/jest-dom";
import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConsoleLayout } from "../../layout/ConsoleLayout";
import { consoleTitle, isCompanyConsolePath } from "../../layout/consoleTitle";
import { FindingsPage } from "./FindingsPage";
import { FindingDetailPage } from "./FindingDetailPage";
import { noteProblem } from "./FindingActionDialog";
import {
    actOnFinding,
    fetchApplications,
    fetchEvidence,
    fetchFinding,
    fetchFindings,
    fetchMyOrganizations,
    fetchPostureOverview,
} from "../../api/consoleApi";

jest.mock("../../../account/emailVerificationApi", () => ({ verifyEmailToken: jest.fn(), resendVerificationEmail: jest.fn() }));
jest.mock("../../../context/auth/BasicAuthContext", () => ({
    useBasicAuthServices: () => ({ user: { email: "me@app-one.test" }, isLoggedIn: true, logout: jest.fn() }),
}));
jest.mock("../../../context/auth/UserSessionContext", () => ({
    useUserSessionServices: () => ({ validateSession: () => Promise.resolve() }),
}));
jest.mock("../../api/consoleApi", () => ({
    fetchMyOrganizations: jest.fn(),
    fetchPostureOverview: jest.fn(),
    fetchApplications: jest.fn(),
    fetchFindings: jest.fn(),
    fetchFinding: jest.fn(),
    fetchEvidence: jest.fn(),
    actOnFinding: jest.fn(),
}));

const APP = { id: "app-1", name: "App One API", slug: "app-one-api", environment: "production", status: "ACTIVE" };

function finding(overrides = {}) {
    return {
        id: "f1",
        title: "Application self-reported security check failed",
        description: "The application's latest self-check reported FAIL.",
        environment: "production",
        severity: "WARNING",
        severity_label: "Warning",
        status: "OPEN",
        status_label: "Open",
        affected_system: "app-one-api",
        metadata: { application_id: "app-1", signal_type: "APPLICATION_SELF_CHECK" },
        first_seen_at: "2026-09-25T10:00:00Z",
        last_seen_at: "2026-09-26T15:00:00Z",
        resolved_at: null,
        resolution_summary: "",
        evidence_ids: ["e1", "e2"],
        actions: [],
        ...overrides,
    };
}

const EVIDENCE = {
    e1: { id: "e1", result: "FAIL", result_label: "Fail", trust: "SELF_REPORTED", observed_at: "2026-09-25T10:00:00Z", source_name: "app-one-api", source_reference: "run:1", metadata: { checks: { debug_disabled: "FAIL", hsts_enabled: "PASS" } } },
    e2: { id: "e2", result: "FAIL", result_label: "Fail", trust: "SELF_REPORTED", observed_at: "2026-09-26T15:00:00Z", source_name: "app-one-api", source_reference: "run:2", metadata: { checks: { debug_disabled: "FAIL" } } },
};

function page(results, overrides = {}) {
    return { count: results.length, page: 1, page_size: 50, results, ...overrides };
}

function LocationProbe() {
    const location = useLocation();
    return <div data-testid="location">{location.pathname + location.search}</div>;
}

function asRole(role) {
    fetchMyOrganizations.mockResolvedValue([{ id: "1", name: "App One", slug: "app-one", org_role: role, membership_status: "ACTIVE" }]);
}

let client;
function renderAt(path) {
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
        <QueryClientProvider client={client}>
            <MemoryRouter initialEntries={[path]}>
                <Routes>
                    <Route path="/console/:orgSlug" element={<ConsoleLayout />}>
                        <Route path="security" element={<FindingsPage />} />
                        <Route path="security/findings/:findingId" element={<FindingDetailPage />} />
                    </Route>
                </Routes>
                <LocationProbe />
            </MemoryRouter>
        </QueryClientProvider>
    );
}

beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    asRole("OWNER");
    fetchPostureOverview.mockResolvedValue({ organization_slug: "app-one", environments: [] });
    fetchApplications.mockResolvedValue([APP]);
    fetchFindings.mockResolvedValue(page([finding()]));
    fetchFinding.mockResolvedValue(finding());
    fetchEvidence.mockImplementation((slug, id) => Promise.resolve(EVIDENCE[id]));
});

describe("F3 findings list", () => {
    test("lists the environment's findings with application, severity, status and last seen", async () => {
        renderAt("/console/app-one/security?env=production");
        const table = await screen.findByRole("table", { name: "Findings in Production" });
        const row = within(table).getAllByRole("row")[1];
        await waitFor(() => expect(row).toHaveTextContent("App One API"));
        expect(row).toHaveTextContent("Warning");
        expect(row).toHaveTextContent("Open");
        expect(within(row).getByRole("link")).toHaveAttribute("href", "/console/app-one/security/findings/f1?env=production");
        expect(fetchFindings).toHaveBeenCalledWith("app-one", { environment: "production", status: "", severity: "", page: 1, pageSize: 50 });
    });

    test("status and severity filters go to Gait and into the URL; clearing resets them", async () => {
        renderAt("/console/app-one/security?env=production");
        await screen.findByRole("table");
        fireEvent.change(screen.getByLabelText("Status"), { target: { value: "ACCEPTED_RISK" } });
        await waitFor(() =>
            expect(fetchFindings).toHaveBeenLastCalledWith("app-one", expect.objectContaining({ status: "ACCEPTED_RISK", page: 1 }))
        );
        expect(screen.getByTestId("location")).toHaveTextContent("status=ACCEPTED_RISK");
        fireEvent.change(screen.getByLabelText("Severity"), { target: { value: "CRITICAL" } });
        await waitFor(() =>
            expect(fetchFindings).toHaveBeenLastCalledWith("app-one", expect.objectContaining({ status: "ACCEPTED_RISK", severity: "CRITICAL" }))
        );
        fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
        await waitFor(() => expect(screen.getByTestId("location")).not.toHaveTextContent("status="));
    });

    test("pages through results with Gait's count/page/page_size", async () => {
        fetchFindings.mockResolvedValue(page([finding()], { count: 120, page: 1, page_size: 50 }));
        renderAt("/console/app-one/security?env=production");
        const pager = await screen.findByRole("navigation", { name: "Findings pages" });
        expect(pager).toHaveTextContent("1–50 of 120");
        expect(within(pager).getByRole("button", { name: "Previous" })).toBeDisabled();
        fireEvent.click(within(pager).getByRole("button", { name: "Next" }));
        await waitFor(() => expect(fetchFindings).toHaveBeenLastCalledWith("app-one", expect.objectContaining({ page: 2 })));
    });

    test("an invalid filter (400 INVALID_QUERY) is explained, with a way out", async () => {
        fetchFindings.mockRejectedValue({
            response: { status: 400, data: { code: "INVALID_QUERY", field: "status", detail: "'status' must be one of [...]." } },
        });
        renderAt("/console/app-one/security?env=production&status=BOGUS");
        expect(await screen.findByText("That filter isn't valid")).toBeInTheDocument();
        expect(screen.getByText("'status' must be one of [...].")).toBeInTheDocument();
        fireEvent.click(screen.getAllByRole("button", { name: "Clear filters" })[0]);
        await waitFor(() => expect(screen.getByTestId("location")).not.toHaveTextContent("status="));
    });

    test("empty: none in the environment, or none matching the filters", async () => {
        fetchFindings.mockResolvedValue(page([]));
        renderAt("/console/app-one/security?env=staging");
        expect(await screen.findByText("No findings in Staging")).toBeInTheDocument();
    });
});

describe("F3 finding detail", () => {
    test("shows what happened, its source, decisions and the reports behind it (newest first)", async () => {
        renderAt("/console/app-one/security/findings/f1?env=production");
        expect(await screen.findByRole("heading", { level: 1, name: "Application self-reported security check failed" })).toBeInTheDocument();
        expect(screen.getByText("Nobody has acknowledged this finding or accepted its risk yet.")).toBeInTheDocument();
        await waitFor(() => expect(screen.getAllByText("Self-reported").length).toBeGreaterThan(0));
        const reports = screen.getAllByRole("list", { name: "Checks in this report" });
        expect(reports).toHaveLength(2);
        expect(reports[0]).toHaveTextContent("debug_disabled");
        expect(reports[0]).not.toHaveTextContent("hsts_enabled"); // newest (run:2) first
        expect(fetchEvidence).toHaveBeenCalledWith("app-one", "e1");
    });

    test("Owners and Admins see Acknowledge and Accept risk on an open finding", async () => {
        asRole("ADMIN");
        renderAt("/console/app-one/security/findings/f1?env=production");
        expect(await screen.findByRole("button", { name: "Acknowledge" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Accept risk" })).toBeInTheDocument();
    });

    test("an acknowledged finding can still have its risk accepted, but not be acknowledged again", async () => {
        fetchFinding.mockResolvedValue(finding({ status: "ACKNOWLEDGED", status_label: "Acknowledged" }));
        renderAt("/console/app-one/security/findings/f1?env=production");
        expect(await screen.findByRole("button", { name: "Accept risk" })).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Acknowledge" })).toBeNull();
    });

    test("Members only see the finding", async () => {
        asRole("MEMBER");
        renderAt("/console/app-one/security/findings/f1?env=production");
        await screen.findByRole("heading", { level: 1 });
        expect(screen.queryByRole("button", { name: "Acknowledge" })).toBeNull();
        expect(screen.queryByRole("button", { name: "Accept risk" })).toBeNull();
        expect(screen.getByText("Only Owners and Admins can acknowledge a finding or accept its risk.")).toBeInTheDocument();
    });

    test("accepted risk is shown clearly, including that it stays accepted if the check fails again", async () => {
        fetchFinding.mockResolvedValue(
            finding({
                status: "ACCEPTED_RISK",
                status_label: "Accepted risk",
                resolution_summary: "Staging-only debug flag; fixed in next release.",
                actions: [
                    { action: "ACCEPT_RISK", note: "Staging-only debug flag; fixed in next release.", actor_email: "owner@app-one.test", from_status: "OPEN", to_status: "ACCEPTED_RISK", created_at: "2026-09-26T16:00:00Z" },
                ],
            })
        );
        renderAt("/console/app-one/security/findings/f1?env=production");
        const accepted = await screen.findByRole("region", { name: "Risk accepted" });
        expect(accepted).toHaveTextContent("owner@app-one.test accepted this risk");
        expect(accepted).toHaveTextContent("It stays accepted even if the check fails again");
        expect(accepted).toHaveTextContent("Staging-only debug flag; fixed in next release.");
        expect(screen.queryByRole("button", { name: "Accept risk" })).toBeNull();
        expect(screen.getByText("Accepted the risk")).toBeInTheDocument();
    });

    test("a finding from another company (or a guessed id) is 'doesn't exist or no access'", async () => {
        fetchFinding.mockRejectedValue({ response: { status: 404, data: { detail: "Not found." } } });
        renderAt("/console/app-one/security/findings/nope?env=production");
        expect(await screen.findByText("This doesn't exist, or you don't have access to it.")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
    });
});

describe("F3 actions", () => {
    test("the note is validated live (10-2000 characters, trimmed) before anything is sent", async () => {
        renderAt("/console/app-one/security/findings/f1?env=production");
        fireEvent.click(await screen.findByRole("button", { name: "Accept risk" }));
        const dialog = screen.getByRole("dialog", { name: "Accept the risk" });
        expect(dialog).toHaveTextContent("It stays accepted even if the check fails again");
        const note = within(dialog).getByLabelText("Why is this risk acceptable?");
        const submit = within(dialog).getByRole("button", { name: "Accept risk" });
        expect(submit).toBeDisabled();

        fireEvent.change(note, { target: { value: "   short   " } });
        expect(within(dialog).getByText("Write at least 10 characters (5 so far).")).toBeInTheDocument();
        expect(submit).toBeDisabled();

        fireEvent.change(note, { target: { value: "x".repeat(2001) } });
        expect(within(dialog).getByText("Keep it to 2000 characters (2001 now).")).toBeInTheDocument();
        expect(submit).toBeDisabled();
        expect(actOnFinding).not.toHaveBeenCalled();
    });

    test("accepting risk sends the trimmed note and shows the result", async () => {
        const updated = finding({
            status: "ACCEPTED_RISK",
            status_label: "Accepted risk",
            actions: [{ action: "ACCEPT_RISK", note: "Known issue, fix scheduled.", actor_email: "me@app-one.test", from_status: "OPEN", to_status: "ACCEPTED_RISK", created_at: "2026-09-26T16:00:00Z" }],
        });
        actOnFinding.mockImplementation(() => {
            fetchFinding.mockResolvedValue(updated); // Gait now returns the accepted finding
            return Promise.resolve(updated);
        });
        renderAt("/console/app-one/security/findings/f1?env=production");
        fireEvent.click(await screen.findByRole("button", { name: "Accept risk" }));
        const dialog = screen.getByRole("dialog");
        fireEvent.change(within(dialog).getByLabelText("Why is this risk acceptable?"), { target: { value: "  Known issue, fix scheduled.  " } });
        fireEvent.click(within(dialog).getByRole("button", { name: "Accept risk" }));
        await waitFor(() => expect(actOnFinding).toHaveBeenCalledWith("app-one", "f1", "accept-risk", "Known issue, fix scheduled."));
        expect(await screen.findByRole("region", { name: "Risk accepted" })).toBeInTheDocument();
        await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    });

    test("acknowledge; a refused transition shows Gait's detail", async () => {
        actOnFinding.mockRejectedValue({
            response: { status: 400, data: { code: "INVALID_TRANSITION", detail: "This finding is resolved; that action is not available." } },
        });
        renderAt("/console/app-one/security/findings/f1?env=production");
        fireEvent.click(await screen.findByRole("button", { name: "Acknowledge" }));
        const dialog = screen.getByRole("dialog", { name: "Acknowledge this finding" });
        fireEvent.change(within(dialog).getByLabelText("What are you doing about it?"), { target: { value: "Rolling out the fix today." } });
        fireEvent.click(within(dialog).getByRole("button", { name: "Acknowledge" }));
        await waitFor(() => expect(actOnFinding).toHaveBeenCalledWith("app-one", "f1", "acknowledge", "Rolling out the fix today."));
        expect(await within(dialog).findByText("This finding is resolved; that action is not available.")).toBeInTheDocument();
    });

    test("a 403 says the role can't do it", async () => {
        actOnFinding.mockRejectedValue({ response: { status: 403, data: { detail: "Forbidden." } } });
        renderAt("/console/app-one/security/findings/f1?env=production");
        fireEvent.click(await screen.findByRole("button", { name: "Acknowledge" }));
        const dialog = screen.getByRole("dialog");
        fireEvent.change(within(dialog).getByLabelText("What are you doing about it?"), { target: { value: "Rolling out the fix today." } });
        fireEvent.click(within(dialog).getByRole("button", { name: "Acknowledge" }));
        expect(await within(dialog).findByText("Your role in this workspace can't do that.")).toBeInTheDocument();
    });

    test("noteProblem counts trimmed characters", () => {
        expect(noteProblem("   ")).toBe("Write at least 10 characters (0 so far).");
        expect(noteProblem(" 1234567890 ")).toBeNull();
        expect(noteProblem("x".repeat(2000))).toBeNull();
    });
});

describe("console tab titles", () => {
    test("each section says where you are and in which company", () => {
        expect(consoleTitle("/console/acme/security", "Acme")).toBe("Findings · Acme · Gait");
        expect(consoleTitle("/console/acme/security/findings/f1", "Acme")).toBe("Finding · Acme · Gait");
        expect(consoleTitle("/console/acme/overview", "Acme")).toBe("Overview · Acme · Gait");
        expect(consoleTitle("/console/acme/applications", "Acme")).toBe("Applications · Acme · Gait");
        expect(consoleTitle("/console/acme/applications/a1", "Acme")).toBe("Application · Acme · Gait");
        expect(consoleTitle("/console/acme/overview", undefined)).toBe("Overview · Gait");
        expect(isCompanyConsolePath("/console")).toBe(false);
        expect(isCompanyConsolePath("/console/acme/overview")).toBe(true);
    });

    test("the layout sets it once the company is known", async () => {
        renderAt("/console/app-one/security?env=production");
        await screen.findByRole("table");
        await waitFor(() => expect(document.title).toBe("Findings · App One · Gait"));
    });
});
