import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import HomePage from "./HomePage";
import { FEATURE_STATUS, STATUS_LABELS } from "../../docs/featureStatus";

const mockValidateSession = jest.fn();
const mockSetError = jest.fn();
const mockAuthServices = {
  logout: jest.fn(),
  guestLogin: jest.fn(),
  isLoggedIn: true,
  isLoading: false,
  message: "",
  user: null,
  setError: mockSetError,
};

jest.mock("../../context/auth/BasicAuthContext", () => ({
  useBasicAuthServices: () => mockAuthServices,
}));

jest.mock("../../context/auth/UserSessionContext", () => ({
  useUserSessionServices: () => ({
    validateSession: mockValidateSession,
  }),
}));

// Mermaid is covered by the Diagram tests; here only the description matters.
jest.mock("../../docs/components/Diagram", () => ({
  Diagram: ({ description }) => <figure data-testid="diagram">{description}</figure>,
}));

function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function renderHome(authOverrides = {}) {
  Object.assign(mockAuthServices, {
    logout: jest.fn(),
    guestLogin: jest.fn(),
    isLoggedIn: true,
    isLoading: false,
    message: "",
    user: null,
    setError: mockSetError,
  }, authOverrides);

  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<><HomePage /><LocationDisplay /></>} />
        <Route path="/security-command" element={<><div>Security route</div><LocationDisplay /></>} />
      </Routes>
    </MemoryRouter>
  );
}

function statusRow(feature) {
  return screen.getByRole("heading", { level: 3, name: feature }).closest("li");
}

describe("HomePage product positioning", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("leads with Gait as my internal security system, with none of the old overclaims", () => {
    const { container } = renderHome({ isLoggedIn: false, user: null });

    expect(screen.getByRole("heading", { level: 1, name: "The security system behind my apps." })).toBeInTheDocument();
    expect(
      screen.getByText(/Gait is the internal security system I built to protect my own applications\./)
    ).toBeInTheDocument();

    const text = container.textContent;
    expect(text).not.toMatch(/473/);
    expect(text).not.toMatch(/Your AI security team/i);
    expect(text).not.toMatch(/watches your application/i);
    expect(text).not.toMatch(/still being built/i);
    expect(text).not.toMatch(/clinicians/i);
    expect(text).not.toMatch(/Battle-tested/i);
    expect(screen.queryByRole("button", { name: /Explore the live demo/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Approve" })).not.toBeInTheDocument();
  });

  test("the status section renders from FEATURE_STATUS", () => {
    renderHome({ isLoggedIn: false, user: null });

    expect(within(statusRow("Findings")).getByText(STATUS_LABELS[FEATURE_STATUS.core])).toBeInTheDocument();
    expect(
      within(statusRow("Acting on findings in the console")).getByText(STATUS_LABELS[FEATURE_STATUS.findingsScreen])
    ).toBeInTheDocument();
    expect(
      within(statusRow("Sign-in for an app's own users")).getByText(STATUS_LABELS[FEATURE_STATUS.productSignIn])
    ).toBeInTheDocument();
    // Lumen is in development: never shown as Live.
    expect(within(statusRow("Lumen signs in through Gait")).getByText("In development")).toBeInTheDocument();
    expect(within(statusRow("Lumen reports its security checks")).getByText("In progress")).toBeInTheDocument();
    expect(screen.getByText("AI investigation and fixes for Lumen: planned.")).toBeInTheDocument();
  });

  test("flipping a FEATURE_STATUS key changes the page (nothing is hard-coded)", () => {
    const original = FEATURE_STATUS.findingsScreen;
    FEATURE_STATUS.findingsScreen = "live";
    try {
      renderHome({ isLoggedIn: false, user: null });
      const row = statusRow("Acting on findings in the console");
      expect(within(row).getByText(STATUS_LABELS.live)).toBeInTheDocument();
      expect(within(row).queryByText(STATUS_LABELS.pending)).not.toBeInTheDocument();
    } finally {
      FEATURE_STATUS.findingsScreen = original;
    }
  });

  test("links to the how-it-works, isolation and automated-security-response docs", () => {
    renderHome({ isLoggedIn: false, user: null });

    const howItWorks = screen.getAllByRole("link", { name: /^How it works$/ });
    expect(howItWorks.filter((link) => link.getAttribute("href") === "/docs/how-it-works").length).toBe(2);
    expect(screen.getByRole("link", { name: /Isolation and setup/ })).toHaveAttribute("href", "/docs/isolation");
    expect(screen.getByRole("link", { name: /Automated security response/ })).toHaveAttribute(
      "href",
      "/docs/automated-security-response"
    );
    expect(screen.getByRole("link", { name: /Connecting an app/ })).toHaveAttribute(
      "href",
      "/docs/connecting-your-software"
    );
    expect(screen.getByRole("link", { name: /gait-sdk docs/ })).toHaveAttribute("href", "/docs/gait-sdk");
  });

  test("no buyer calls to action: no Quickstart hero button and no link to early access", () => {
    renderHome({ isLoggedIn: false, user: null });

    expect(screen.queryByRole("link", { name: /Read the Quickstart/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /early access/i })).not.toBeInTheDocument();
    screen.queryAllByRole("link").forEach((link) => expect(link).not.toHaveAttribute("href", "/early-access"));
  });

  test("the agents section is scoped to Gait itself: never on Lumen", () => {
    renderHome({ isLoggedIn: false, user: null });

    const section = screen.getByRole("region", { name: /Six AI agents and a person look after Gait's own platform/ });
    expect(section).toHaveTextContent("never on Lumen");
    expect(section).toHaveTextContent("I approve every production change.");
    expect(section).toHaveTextContent("Automated deployment is off by default.");
    ["Incident Commander", "Blue Team", "Red Team", "Green Team", "Security Validator", "Release Engineer", "Human Approver"].forEach(
      (name) => expect(within(section).getAllByText(name).length).toBeGreaterThan(0)
    );
    expect(section).toHaveTextContent("A person approves every deployment.");
    expect(section).toHaveTextContent("Everything is recorded. Each step leaves an audit trail.");
    const guarantees = within(section).getByRole("list", { name: "Guarantees" });
    expect(within(guarantees).getAllByRole("listitem")).toHaveLength(5);
    expect(section).toHaveTextContent("Security Copilot");
  });

  test("the agent track uses toggle buttons, not a partial tabs pattern", () => {
    renderHome({ isLoggedIn: false, user: null });

    expect(screen.queryAllByRole("tab")).toHaveLength(0);
    const track = screen.getByRole("group", { name: "Agent topology stations" });
    const station = within(track).getByRole("button", { name: /Human Approver/ });
    expect(station).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(station);
    expect(station).toHaveAttribute("aria-pressed", "true");
  });

  test("the origin names only Lumen and Gait itself, with no usage claims", () => {
    renderHome({ isLoggedIn: false, user: null });

    expect(
      screen.getByText(/Built first to secure Lumen, my clinical app, which is in development\./)
    ).toHaveTextContent("In production today, Gait protects itself.");
  });

  test("the header brand uses the single-ink gate mark", () => {
    renderHome({ isLoggedIn: false, user: null });

    const brand = screen.getByRole("link", { name: "Gait home" });
    const mark = within(brand).getByTestId("gate-mark");
    expect(mark).toHaveAttribute("stroke", "currentColor");
    expect(mark).toHaveAttribute("viewBox", "0 0 16 16");
    ["M4.5 13.2V4.6", "M11.5 13.2V4.6", "M4.5 4.6h7"].forEach((d) =>
      expect(mark).toContainHTML(`<path d="${d}"></path>`)
    );
  });

  test("Docs is in the header (no separate Developers page), behind a menu button on phones", () => {
    renderHome({ isLoggedIn: false, user: null });

    const nav = screen.getByRole("navigation", { name: "Product navigation" });
    expect(within(nav).getByRole("link", { name: "Docs" })).toHaveAttribute("href", "/docs");
    expect(within(nav).queryByRole("link", { name: "Developers" })).not.toBeInTheDocument();

    const toggle = screen.getByRole("button", { name: "Menu" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(nav).toHaveClass("is-open");
  });
});

describe("HomePage Console link", () => {
  test("appears in the header and hero when signed in", () => {
    renderHome({ user: { email: "user@example.com" } });

    const nav = screen.getByRole("navigation", { name: "Product navigation" });
    expect(within(nav).getByRole("link", { name: "Console" })).toHaveAttribute("href", "/console");
    expect(screen.getByRole("link", { name: "Open console" })).toHaveAttribute("href", "/console");
  });

  test("is absent when signed out", () => {
    renderHome({ isLoggedIn: false, user: null });

    expect(screen.queryByRole("link", { name: /console/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Login" })).toHaveAttribute("href", "/login");
  });
});

describe("HomePage security navigation (OPS1: is_gait_operator only)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("an operator sees the Security Command link and can navigate", () => {
    renderHome({
      user: {
        first_name: "Anthony",
        last_name: "Narine",
        email: "staff@example.com",
        is_gait_operator: true,
      },
    });

    const link = screen.getAllByRole("link", { name: /Security Command/i })[0];
    expect(link).toHaveAttribute("href", "/security-command");
    expect(screen.getByRole("button", { name: /^Your account/ })).toHaveTextContent("staff@example.com");

    fireEvent.click(link);

    expect(screen.getByTestId("location")).toHaveTextContent("/security-command");
  });

  test("signed in: the account menu reaches Account and flags 2FA off; signing out stays on the home page", async () => {
    const logout = jest.fn(() => Promise.resolve());
    renderHome({
      logout,
      user: { first_name: "Anthony", last_name: "Narine", email: "staff@example.com", is_gait_operator: true, is_2fa_enabled: false },
    });

    const menuButton = screen.getByRole("button", { name: "Your account, two-step verification is off" });
    expect(screen.queryByRole("button", { name: "Logout" })).not.toBeInTheDocument();
    fireEvent.click(menuButton);
    const account = screen.getByRole("menuitem", { name: /Account/ });
    expect(account).toHaveAttribute("href", "/account");
    expect(account).toHaveTextContent("2FA off");

    fireEvent.click(screen.getByRole("menuitem", { name: "Sign out" }));
    await waitFor(() => expect(logout).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId("location")).toHaveTextContent(/^\/$/);
  });

  test("signed out: a Login link, no account menu", () => {
    renderHome({ isLoggedIn: false, user: null });
    expect(screen.getByRole("link", { name: "Login" })).toHaveAttribute("href", "/login");
    expect(screen.queryByRole("button", { name: /^Your account/ })).not.toBeInTheDocument();
  });

  test.each([
    ["the flag is false", { is_gait_operator: false }],
    ["the flag is missing", {}],
    ["the flag is missing, even for staff and superusers", { is_staff: true, is_superuser: true }],
    ["the flag is false, even with the old capability field", { is_gait_operator: false, can_view_security_dashboard: true }],
    ["the flag is truthy but not true", { is_gait_operator: "true" }],
  ])("no Security Command entry when %s", (_label, fields) => {
    renderHome({ user: { email: "user@example.com", ...fields } });

    expect(screen.queryByRole("link", { name: /Security Command/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/Staff only/i)).not.toBeInTheDocument();
    // Signed in still gets the Console link.
    expect(within(screen.getByRole("navigation", { name: "Product navigation" })).getByRole("link", { name: "Console" }))
      .toBeInTheDocument();
  });

  test("unauthenticated users do not see the operational control", () => {
    renderHome({
      isLoggedIn: false,
      user: null,
    });

    expect(screen.queryByRole("link", { name: /Security Command/i })).not.toBeInTheDocument();
  });
});
