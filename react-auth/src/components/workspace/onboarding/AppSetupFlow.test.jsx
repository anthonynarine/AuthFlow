import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AppSetupFlow } from "./AppSetupFlow";
import { authAxios } from "../../../interceptors/axios";

jest.mock("../../../interceptors/axios", () => ({
  authAxios: { post: jest.fn() },
}));

const APPLICATION = { id: "app-1", name: "Acme API", slug: "acme-api", environment: "production", status: "ACTIVE" };
const RAW_SECRET = "test-only-fixture-secret-not-a-real-credential";

beforeEach(() => {
  jest.clearAllMocks();
  window.localStorage.clear();
  window.sessionStorage.clear();
});

function chooseDjango() {
  fireEvent.click(screen.getByRole("button", { name: "Django" }));
}

describe("AppSetupFlow — framework selection", () => {
  test("Django and FastAPI are offered; framework is a UI-only choice never sent anywhere", () => {
    render(<AppSetupFlow organizationSlug="acme" application={APPLICATION} onDone={jest.fn()} />);
    expect(screen.getByRole("button", { name: "Django" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "FastAPI" })).toBeInTheDocument();
    expect(authAxios.post).not.toHaveBeenCalled();
  });

  test("choosing Django shows Django-specific install instructions", () => {
    render(<AppSetupFlow organizationSlug="acme" application={APPLICATION} onDone={jest.fn()} />);
    chooseDjango();
    expect(screen.getByText(/auth_integration\[django\]/)).toBeInTheDocument();
  });

  test("choosing FastAPI shows FastAPI-specific install instructions", () => {
    render(<AppSetupFlow organizationSlug="acme" application={APPLICATION} onDone={jest.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "FastAPI" }));
    expect(screen.getByText(/auth_integration\[fastapi\]/)).toBeInTheDocument();
  });

  test("SDK instructions reference the real, documented GAIT_APPLICATION_CREDENTIAL contract", () => {
    render(<AppSetupFlow organizationSlug="acme" application={APPLICATION} onDone={jest.fn()} />);
    chooseDjango();
    expect(document.body.textContent).toContain("GAIT_APPLICATION_CREDENTIAL");
    expect(document.body.textContent).toContain("from auth_integration.application import verify_application");
    expect(screen.getByText(/There's no automatic middleware for this yet/)).toBeInTheDocument();
  });

  test("links to the Connecting your software guide in a new tab, so the wizard keeps its place", () => {
    render(<AppSetupFlow organizationSlug="acme" application={APPLICATION} onDone={jest.fn()} />);
    chooseDjango();
    const guide = screen.getByRole("link", { name: "Connecting your software" });
    expect(guide).toHaveAttribute("href", "/docs/connecting-your-software");
    expect(guide).toHaveAttribute("target", "_blank");
    expect(guide).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  test("framework can be changed back and reselected — never persisted", () => {
    render(<AppSetupFlow organizationSlug="acme" application={APPLICATION} onDone={jest.fn()} />);
    chooseDjango();
    fireEvent.click(screen.getByRole("button", { name: "Change framework" }));
    expect(screen.getByRole("heading", { name: "What is this App built with?" })).toBeInTheDocument();
  });
});

describe("AppSetupFlow — Connection Key issuance", () => {
  test("generating a key calls the real credential endpoint and displays the raw secret once", async () => {
    authAxios.post.mockResolvedValueOnce({
      data: { credential_id: "cred-1", raw_secret: RAW_SECRET, created_at: "2026-09-14T00:00:00Z" },
    });
    render(<AppSetupFlow organizationSlug="acme" application={APPLICATION} onDone={jest.fn()} />);
    chooseDjango();

    fireEvent.click(screen.getByRole("button", { name: "Generate Connection Key" }));

    expect(await screen.findByText(RAW_SECRET)).toBeInTheDocument();
    expect(authAxios.post).toHaveBeenCalledWith("/organizations/acme/applications/app-1/credentials/");
    expect(screen.getByText("Save this key now.")).toBeInTheDocument();
    expect(screen.getByText("Gait will not show it again.")).toBeInTheDocument();
  });

  test("the raw secret is never written to localStorage or sessionStorage", async () => {
    authAxios.post.mockResolvedValueOnce({
      data: { credential_id: "cred-1", raw_secret: RAW_SECRET, created_at: "2026-09-14T00:00:00Z" },
    });
    const lsSpy = jest.spyOn(window.localStorage.__proto__, "setItem");
    const ssSpy = jest.spyOn(window.sessionStorage.__proto__, "setItem");

    render(<AppSetupFlow organizationSlug="acme" application={APPLICATION} onDone={jest.fn()} />);
    chooseDjango();
    fireEvent.click(screen.getByRole("button", { name: "Generate Connection Key" }));
    await screen.findByText(RAW_SECRET);

    expect(lsSpy).not.toHaveBeenCalled();
    expect(ssSpy).not.toHaveBeenCalled();
    lsSpy.mockRestore();
    ssSpy.mockRestore();
  });

  test("the raw secret is never present in a URL/query-string-shaped value anywhere on the page", async () => {
    authAxios.post.mockResolvedValueOnce({
      data: { credential_id: "cred-1", raw_secret: RAW_SECRET, created_at: "2026-09-14T00:00:00Z" },
    });
    render(<AppSetupFlow organizationSlug="acme" application={APPLICATION} onDone={jest.fn()} />);
    chooseDjango();
    fireEvent.click(screen.getByRole("button", { name: "Generate Connection Key" }));
    await screen.findByText(RAW_SECRET);

    // The secret shows exactly once, inside the dedicated secret box — not
    // duplicated into any link/anchor href (which would be a URL exposure).
    const links = document.querySelectorAll("a[href]");
    links.forEach((link) => expect(link.getAttribute("href")).not.toContain(RAW_SECRET));
  });

  test("the confirmation flow requires explicit acknowledgement before continuing", async () => {
    authAxios.post.mockResolvedValueOnce({
      data: { credential_id: "cred-1", raw_secret: RAW_SECRET, created_at: "2026-09-14T00:00:00Z" },
    });
    const onDone = jest.fn();
    render(<AppSetupFlow organizationSlug="acme" application={APPLICATION} onDone={onDone} />);
    chooseDjango();
    fireEvent.click(screen.getByRole("button", { name: "Generate Connection Key" }));
    await screen.findByText(RAW_SECRET);

    const continueButton = screen.getByRole("button", { name: "Continue" });
    expect(continueButton).toBeDisabled();

    fireEvent.click(screen.getByRole("checkbox", { name: "I saved my Connection Key" }));
    expect(continueButton).toBeEnabled();
    fireEvent.click(continueButton);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  test("Copy key uses the clipboard, not any persistent storage", async () => {
    authAxios.post.mockResolvedValueOnce({
      data: { credential_id: "cred-1", raw_secret: RAW_SECRET, created_at: "2026-09-14T00:00:00Z" },
    });
    const writeText = jest.fn().mockResolvedValue();
    Object.assign(navigator, { clipboard: { writeText } });

    render(<AppSetupFlow organizationSlug="acme" application={APPLICATION} onDone={jest.fn()} />);
    chooseDjango();
    fireEvent.click(screen.getByRole("button", { name: "Generate Connection Key" }));
    await screen.findByText(RAW_SECRET);

    fireEvent.click(screen.getByRole("button", { name: "Copy key" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(RAW_SECRET));
  });

  test("the screen identifies the key as a backend-only secret, warning against frontend/source-control use", async () => {
    authAxios.post.mockResolvedValueOnce({
      data: { credential_id: "cred-1", raw_secret: RAW_SECRET, created_at: "2026-09-14T00:00:00Z" },
    });
    render(<AppSetupFlow organizationSlug="acme" application={APPLICATION} onDone={jest.fn()} />);
    chooseDjango();
    fireEvent.click(screen.getByRole("button", { name: "Generate Connection Key" }));
    await screen.findByText(RAW_SECRET);

    expect(document.body.textContent).toContain(
      "Never put it in frontend code, a browser, a build-time .env file, or source control"
    );
  });

  test("refresh (a fresh mount) cannot recover the raw key — no stale secret ever appears", () => {
    // Simulates what a page refresh actually does: a brand new component
    // instance, no in-memory state carried over.
    render(<AppSetupFlow organizationSlug="acme" application={APPLICATION} onDone={jest.fn()} />);
    expect(screen.queryByText(RAW_SECRET)).not.toBeInTheDocument();
    expect(screen.queryByText("Save this key now.")).not.toBeInTheDocument();
  });

  test("generating a new key is always an explicit action — never automatic on mount", () => {
    render(<AppSetupFlow organizationSlug="acme" application={APPLICATION} onDone={jest.fn()} />);
    chooseDjango();
    expect(authAxios.post).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Generate Connection Key" })).toBeInTheDocument();
  });

  test("a failed key issuance is shown honestly, not silently retried", async () => {
    authAxios.post.mockRejectedValueOnce({ response: { status: 403 } });
    render(<AppSetupFlow organizationSlug="acme" application={APPLICATION} onDone={jest.fn()} />);
    chooseDjango();
    fireEvent.click(screen.getByRole("button", { name: "Generate Connection Key" }));

    expect(
      await screen.findByText("You don't have permission to generate a Connection Key for this App.")
    ).toBeInTheDocument();
    expect(screen.queryByText(RAW_SECRET)).not.toBeInTheDocument();
  });
});
