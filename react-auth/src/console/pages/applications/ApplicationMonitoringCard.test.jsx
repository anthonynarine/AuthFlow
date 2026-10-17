import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApplicationMonitoringCard } from "./ApplicationMonitoringCard";
import { fetchApplicationMonitoring } from "../../api/consoleApi";
import { consoleKeys } from "../../api/queryKeys";
jest.mock("../../api/consoleApi");
const application = { id: "app1", name: "Moneta", environment: "production", status: "ACTIVE" };
const base = { schema_version: 1, scope: { application_id: "app1", environment: "production" }, application_status: "ACTIVE",
 reporting: { state: "not_observed", first_seen_at: null, last_seen_at: null, live_connection: "unknown" },
 checks: { reported_checks: 0, total_checks: 21, last_run_at: null, counts_by_result: { PASS: 0, FAIL: 0, WARNING: 0, INFORMATIONAL: 0, UNKNOWN: 0 }, stale_count: 0, unknown_freshness_count: 0 },
 findings: { total: 0, counts_by_status: { OPEN: 0, ACKNOWLEDGED: 0, RESOLVED: 0, ACCEPTED_RISK: 0, FALSE_POSITIVE: 0, UNKNOWN: 0 }, counts_by_severity: { CRITICAL: 0, HIGH: 0, WARNING: 0, INFO: 0, UNKNOWN: 0 }, items: [], truncated: false },
 automation: { state: "not_enabled_for_tenant", reason: "tenant_policy_not_enabled" } };
let client;
function view(org = "moneta", app = application) { return <QueryClientProvider client={client}><MemoryRouter><ApplicationMonitoringCard organizationSlug={org} application={app} /></MemoryRouter></QueryClientProvider>; }
beforeEach(() => { jest.resetAllMocks(); client = new QueryClient({ defaultOptions: { queries: { retry: false } } }); fetchApplicationMonitoring.mockResolvedValue(base); });

test("no accepted reports means waiting, not connected or healthy; automation is explicitly unavailable", async () => {
 render(view());
 expect(await screen.findByText("Waiting for the first report")).toBeInTheDocument();
 expect(fetchApplicationMonitoring).toHaveBeenCalledWith("moneta", "app1", "production");
 expect(screen.getByText(/A connection key or identity check does not count/)).toBeInTheDocument();
 expect(screen.getByText(/Live connection health is unknown/)).toBeInTheDocument();
 expect(screen.getByRole("complementary", { name: "Automatic investigation" })).toHaveTextContent("not enabled");
 expect(screen.queryByText(/healthy|agent is running/i)).not.toBeInTheDocument();
});

test("accepted report and check progress use tenant finding links with honest case snapshots", async () => {
 fetchApplicationMonitoring.mockResolvedValue({ ...base, reporting: { ...base.reporting, state: "report_received", last_seen_at: "2026-10-16T12:00:00Z" }, checks: { ...base.checks, reported_checks: 2, stale_count: 1, unknown_freshness_count: 1 }, findings: { ...base.findings, total: 3, truncated: true, items: [
  { id: "finding/1", control_key: "HTTPS", status: "OPEN", severity: "HIGH", case: null },
  { id: "finding2", control_key: "MFA", status: "ACKNOWLEDGED", severity: "WARNING", case: { id: "case2", status: "INVESTIGATION_BLOCKED", updated_at: null } },
  { id: "finding3", control_key: "HEADERS", status: "OPEN", severity: "INFO", case: { id: "case3", status: "INVESTIGATING", updated_at: null } },
 ] } });
 render(view());
 await screen.findByText("Report received");
 expect(screen.getByText("2 / 21")).toBeInTheDocument();
 expect(screen.getByRole("link", { name: "HTTPS" })).toHaveAttribute("href", "/console/moneta/security/findings/finding%2F1?env=production");
 expect(screen.getByText("No investigation case recorded")).toBeInTheDocument();
 expect(screen.getByText("Case: Investigation blocked")).toBeInTheDocument();
 expect(screen.getByText("Case: Investigation recorded")).toBeInTheDocument();
 expect(screen.getByText(/does not confirm an agent is currently running/)).toBeInTheDocument();
 expect(screen.getByRole("link", { name: "View workspace findings" })).toHaveAttribute("href", "/console/moneta/security?env=production");
});

test.each([403, 404, 503])("HTTP %s is unavailable with retry, never zero or healthy", async (status) => {
 fetchApplicationMonitoring.mockRejectedValue({ response: { status, data: { detail: "private-error" } } });
 render(view());
 await screen.findByText(/Application monitoring is unavailable/);
 expect(screen.queryByText("Waiting for the first report")).not.toBeInTheDocument();
 expect(screen.queryByText("0 / 21")).not.toBeInTheDocument();
 expect(screen.queryByText("private-error")).not.toBeInTheDocument();
 fetchApplicationMonitoring.mockResolvedValue(base);
 fireEvent.click(screen.getByRole("button", { name: "Retry application monitoring" }));
 await screen.findByText("Waiting for the first report");
});

test.each([
 { ...base, schema_version: 2 },
 { ...base, findings: { ...base.findings, items: [null] } },
 { ...base, scope: { application_id: "other", environment: "production" } },
 { ...base, scope: { application_id: "app1", environment: "local" } },
 { ...base, checks: { ...base.checks, reported_checks: -1 } },
 { ...base, automation: { state: "running", reason: "secret-operator" } },
])("unsupported or mismatched response fails closed", async (response) => {
 fetchApplicationMonitoring.mockResolvedValue(response);
 render(view());
 await screen.findByText(/No reporting, check or investigation status is confirmed/);
 expect(screen.queryByText("Waiting for the first report")).not.toBeInTheDocument();
});

test("query keys isolate organization, app and environment; a new scope never reuses old facts", async () => {
 const { rerender } = render(view()); await screen.findByText("Waiting for the first report");
 const next = { ...application, id: "app2", environment: "local" };
 fetchApplicationMonitoring.mockResolvedValue({ ...base, scope: { application_id: "app2", environment: "local" } });
 rerender(view("other", next));
 await waitFor(() => expect(fetchApplicationMonitoring).toHaveBeenCalledWith("other", "app2", "local"));
 expect(consoleKeys.applicationMonitoring("moneta", "app1", "production")).not.toEqual(consoleKeys.applicationMonitoring("other", "app2", "local"));
 expect(fetchApplicationMonitoring.mock.calls).toEqual([["moneta", "app1", "production"], ["other", "app2", "local"]]);
});


test("loading never renders assumed report or zero-check success", () => {
 fetchApplicationMonitoring.mockImplementation(() => new Promise(() => {}));
 render(view());
 expect(screen.getByText("Loading application monitoring…")).toBeInTheDocument();
 expect(screen.queryByText("Waiting for the first report")).not.toBeInTheDocument();
 expect(screen.queryByText("0 / 21")).not.toBeInTheDocument();
});

test("unknown case and finding enum values render safe labels rather than raw data or operator links", async () => {
 fetchApplicationMonitoring.mockResolvedValue({ ...base, findings: { ...base.findings, total: 1, items: [
  { id: "finding1", control_key: "HTTPS", status: "private-status", severity: "private-severity", case: { id: "operator-case", status: "constructor", updated_at: null } },
 ] } });
 render(view()); await screen.findByRole("link", { name: "HTTPS" });
 expect(screen.getByText("Case: Status unavailable")).toBeInTheDocument();
 expect(screen.queryByText(/private-status|private-severity|operator-case|constructor/)).not.toBeInTheDocument();
 expect(screen.getAllByRole("link")).toHaveLength(1);
});
