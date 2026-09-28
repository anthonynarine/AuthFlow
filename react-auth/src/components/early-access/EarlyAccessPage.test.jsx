import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { EarlyAccessPage } from "./EarlyAccessPage";
import { publicAxios } from "../../interceptors/axios";

jest.mock("../../interceptors/axios", () => ({
  publicAxios: { post: jest.fn() },
}));

function fillRequiredFields() {
  fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Jamie Rivera" } });
  fireEvent.change(screen.getByLabelText("Work email"), { target: { value: "jamie@example.com" } });
  fireEvent.change(screen.getByLabelText("Company or product name"), { target: { value: "Runway" } });
  fireEvent.change(screen.getByLabelText("What are you building?"), {
    target: { value: "A billing API for indie SaaS founders" },
  });
  fireEvent.change(screen.getByLabelText("What's your biggest security worry right now?"), {
    target: { value: "We have no idea if our auth is actually solid." },
  });
}

function renderPage() {
  return render(
    <MemoryRouter>
      <EarlyAccessPage />
    </MemoryRouter>
  );
}

describe("EarlyAccessPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders the triage form with all fields", () => {
    renderPage();

    expect(screen.getByRole("heading", { name: "Tell us about your app." })).toBeInTheDocument();
    expect(screen.getByLabelText("Your name")).toBeInTheDocument();
    expect(screen.getByLabelText("Work email")).toBeInTheDocument();
    expect(screen.getByLabelText("Company or product name")).toBeInTheDocument();
    expect(screen.getByLabelText("Team size")).toBeInTheDocument();
    expect(screen.getByLabelText("Stage")).toBeInTheDocument();
    expect(screen.getByLabelText("What are you building?")).toBeInTheDocument();
    expect(screen.getByLabelText("What's your biggest security worry right now?")).toBeInTheDocument();
    expect(screen.getByLabelText("GitHub repo (optional)")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Mark as urgent (for example, a recent security incident or an active concern)")
    ).toBeInTheDocument();
  });

  test("submits a composed, triage-friendly message to the existing contact-form endpoint", async () => {
    publicAxios.post.mockResolvedValueOnce({ data: { message: "Email sent successfully" } });
    renderPage();

    fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: "Request Early Access" }));

    await waitFor(() => expect(publicAxios.post).toHaveBeenCalledTimes(1));

    const [url, payload] = publicAxios.post.mock.calls[0];
    expect(url).toBe("/mail/send-email/");
    expect(payload.reply_to).toBe("jamie@example.com");
    expect(payload.subject).toBe("Early Access Request — Runway");
    expect(payload.content).toContain("Name: Jamie Rivera");
    expect(payload.content).toContain("Company / product: Runway");
    expect(payload.content).toContain("A billing API for indie SaaS founders");
    expect(payload.content).toContain("We have no idea if our auth is actually solid.");
    expect(payload.content).toContain("GitHub repo: Not provided");
    expect(payload.content).toContain("Urgent: No");

    const heading = await screen.findByRole("heading", { name: "Thanks — we'll be in touch." });
    // The form is gone, so focus moves to the confirmation.
    await waitFor(() => expect(heading).toHaveFocus());
    expect(screen.getByText(/will reply to/)).toHaveTextContent("will reply to jamie@example.com.");
    expect(screen.queryByText(/within a few days/)).not.toBeInTheDocument();
  });

  test("says only product sign-in is early access, and what happens to the answers", () => {
    renderPage();

    expect(screen.getByText("Early access", { selector: ".doc-status" })).toBeInTheDocument();
    expect(screen.queryByText(/multi-tenant/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Quickstart" })).toHaveAttribute("href", "/docs/quickstart");
    expect(screen.getByText("We email your answers to the Gait team. They aren't stored in Gait.")).toBeInTheDocument();
  });

  test("shows an inline error instead of losing the filled-out form on failure", async () => {
    publicAxios.post.mockRejectedValueOnce({ response: { data: { error: "Mail server unavailable" } } });
    renderPage();

    fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: "Request Early Access" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Mail server unavailable");
    // The form is still there with the founder's answers intact, nothing was lost.
    expect(screen.getByLabelText("Your name")).toHaveValue("Jamie Rivera");
  });
});
