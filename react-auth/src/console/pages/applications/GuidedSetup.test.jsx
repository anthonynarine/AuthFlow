import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { GuidedSetup } from "./GuidedSetup";
import { useApplications, useCreateApplication } from "./useApplications";
import { fetchSetupHelp } from "../../api/consoleApi";
jest.mock("./useApplications");
jest.mock("../../api/consoleApi", () => ({ fetchSetupHelp: jest.fn() }));
const application = { id: "local-id", name: "Moneta", slug: "moneta", environment: "local", status: "ACTIVE" };
const mutate = jest.fn();
const props = { organizationSlug: "moneta-org", application, canManage: true, activity: { data: { has_activity: false } }, credentials: { data: [] } };
const view = (values = props) => <MemoryRouter><GuidedSetup {...values} /></MemoryRouter>;
function open() { fireEvent.click(screen.getByRole("button", { name: "Guide security reporting" })); }
beforeEach(() => { jest.clearAllMocks(); useApplications.mockReturnValue({ data: [] }); useCreateApplication.mockReturnValue({ mutate }); });
test("existing key setup keeps progress in memory and never claims verification", () => {
 const storage = jest.spyOn(Storage.prototype, "setItem"); render(view()); open();
 expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole("checkbox", { name: "Install the SDK" }));
 expect(screen.getByText(/not verified connection status/)).toBeInTheDocument();
 expect(screen.getByText(/No connection evidence/)).toBeInTheDocument();
 fireEvent.click(screen.getByRole("button", { name: "FastAPI" }));
 expect(screen.getByRole("checkbox", { name: "Install the SDK" })).not.toBeChecked();
 fireEvent.click(screen.getByRole("button", { name: "Close setup guide" })); open();
 expect(screen.getByRole("checkbox", { name: "Install the SDK" })).not.toBeChecked();
 expect(storage).not.toHaveBeenCalled(); storage.mockRestore();
});
test("scope change resets progress", () => {
 const { rerender } = render(view()); open(); fireEvent.click(screen.getByRole("checkbox", { name: "Install the SDK" }));
 rerender(view({ ...props, organizationSlug: "other" }));
 expect(screen.getByRole("checkbox", { name: "Install the SDK" })).not.toBeChecked();
});
test("production creation is explicit and rejects unrelated slug or environment", () => {
 useApplications.mockReturnValue({ data: [{ id: "bad", slug: "other", environment: "production" }, { id: "stage", slug: "moneta", environment: "staging" }] });
 render(view()); open(); fireEvent.click(screen.getByRole("button", { name: "5. Prepare the production connection" })); expect(mutate).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole("button", { name: "Create production application" }));
 expect(mutate).toHaveBeenCalledWith({ name: "Moneta", slug: "moneta", environment: "production" });
});
test("production lookup links only current workspace production app", () => {
 useApplications.mockReturnValue({ data: [{ id: "prod", slug: "moneta", environment: "production" }] });
 render(view()); open(); fireEvent.click(screen.getByRole("button", { name: "5. Prepare the production connection" }));
 expect(screen.getByRole("link", { name: "Open production application" })).toHaveAttribute("href", "/console/moneta-org/applications/prod?env=production");
});
test("creation errors retain retry and readonly users cannot mutate", () => {
 useCreateApplication.mockReturnValue({ mutate, isError: true }); render(view({ ...props, canManage: false })); open(); fireEvent.click(screen.getByRole("button", { name: "5. Prepare the production connection" }));
 expect(screen.getByRole("button", { name: "Create production application" })).toBeDisabled();
 expect(screen.getByRole("button", { name: "Get setup help" })).toBeDisabled();
 expect(screen.getByRole("alert")).toHaveTextContent("Production creation failed");
});
test("help submits categories only and displays AI output as text", async () => {
 fetchSetupHelp.mockResolvedValue({ source: "ai", explanation: "<script>text only</script>" });
 render(view()); open(); expect(fetchSetupHelp).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole("button", { name: "Get setup help" })); await screen.findByText("AI explanation");
 expect(fetchSetupHelp).toHaveBeenCalledWith("moneta-org", "local-id", { framework: "django", step: "install", issue: "explain" });
 expect(screen.getByText("<script>text only</script>")).toBeInTheDocument();
});
test("helper failure gives safe guide fallback", async () => {
 fetchSetupHelp.mockRejectedValue(new Error("offline")); render(view()); open();
 fireEvent.click(screen.getByRole("button", { name: "Get setup help" })); await screen.findByText(/Help is unavailable/);
 expect(screen.queryByText("AI explanation")).not.toBeInTheDocument();
});
test("historical evidence is not described as current server verification", () => {
 render(view({ ...props, credentials: { data: [{ last_used_at: "2026-10-11" }] } })); open();
 expect(screen.getByText(/does not confirm the configuration of your current server/)).toBeInTheDocument();
});

test("wizard presents one instruction at a time and back and next select matching help", async () => {
 fetchSetupHelp.mockResolvedValue({ source: "guide", explanation: "Storage help" });
 render(view()); open();
 expect(screen.getByRole("heading", { name: "Step 1 of 5: Install the SDK" })).toBeInTheDocument();
 expect(screen.queryByText(/GAIT_APPLICATION_CREDENTIAL=/)).not.toBeInTheDocument();
 expect(screen.getByRole("button", { name: "Back" })).toBeDisabled();
 expect(screen.queryByRole("button", { name: "Create production application" })).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole("button", { name: "Next" }));
 expect(screen.getByRole("heading", { name: "Step 2 of 5: Save the key in backend secrets" })).toBeInTheDocument();
 expect(screen.getByText(/GAIT_APPLICATION_CREDENTIAL=/)).toBeInTheDocument();
 expect(screen.queryByText(/pip install/)).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole("button", { name: "Get setup help" }));
 await screen.findByText("Storage help");
 expect(fetchSetupHelp).toHaveBeenCalledWith("moneta-org", "local-id", { framework: "django", step: "storage", issue: "explain" });
 fireEvent.click(screen.getByRole("button", { name: "Back" }));
 expect(screen.getByRole("heading", { name: "Step 1 of 5: Install the SDK" })).toBeInTheDocument();
 expect(screen.queryByText("Storage help")).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole("button", { name: "5. Prepare the production connection" }));
 expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
 fireEvent.click(screen.getByRole("button", { name: "FastAPI" }));
 expect(screen.getByRole("heading", { name: "Step 1 of 5: Install the SDK" })).toBeInTheDocument();
});
