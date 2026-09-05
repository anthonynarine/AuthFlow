import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { SecurityOverview } from "./SecurityOverview";
import { SecurityEventsTable } from "./SecurityEventsTable";
import { SecurityEventDetailModal } from "./SecurityEventDetailModal";
import { SecuritySessionsTable } from "./SecuritySessionsTable";
import { SecuritySessionDetailModal } from "./SecuritySessionDetailModal";
import { SecurityErrorState } from "./SecurityErrorState";
import { SecurityObservatoryPage } from "./SecurityObservatoryPage";
import { CurrentSessionSummary } from "./CurrentSessionSummary";

const mockValidateSession = jest.fn();

jest.mock("../../context/auth/BasicAuthContext", () => ({
  useBasicAuthServices: () => ({
    user: {
      first_name: "Anthony",
      last_name: "Narine",
      email: "security@gaitobservatory.com",
    },
  }),
}));

jest.mock("../../context/auth/UserSessionContext", () => ({
  useUserSessionServices: () => ({
    validateSession: mockValidateSession,
  }),
}));

jest.mock("../../hooks/useSecuritySummary", () => ({
  useSecuritySummary: () => ({
    summary: {
      window_hours: 24,
      current_session: {
        uuid: "session-current",
        user: { email: "security@gaitobservatory.com" },
        authentication_method: "password_mfa",
        created_at: "2026-08-30T10:00:00Z",
        last_seen_at: "2026-08-30T10:30:00Z",
        expires_at: "2026-09-06T10:00:00Z",
      },
      active_sessions: 1,
      successful_logins: 2,
      failed_logins: 0,
      replay_events: 0,
      sessions_revoked: 0,
    },
    isLoading: false,
    error: null,
    lastUpdated: new Date("2026-08-31T00:00:00Z"),
    refetch: jest.fn(),
  }),
}));

jest.mock("./SecurityControlsSection", () => ({
  SecurityControlsSection: () => <div>Controls section</div>,
}));

jest.mock("./SecurityFindingsSection", () => ({
  SecurityFindingsSection: () => <div>Findings section</div>,
}));

jest.mock("./SecurityEvidenceSection", () => ({
  SecurityEvidenceSection: () => <div>Evidence section</div>,
}));

jest.mock("../../hooks/useSecurityPosture", () => ({
  useSecurityPosture: () => ({
    posture: {
      overall_status: "HEALTHY",
      overall_status_label: "Healthy",
      controls: { healthy: 5, needs_attention: 0, control_failure: 0, unknown: 0, not_applicable: 0 },
      open_findings: { critical: 0, high: 0, warning: 0, info: 0 },
      last_evaluated_at: "2026-08-31T00:00:00Z",
    },
    isLoading: false,
    error: null,
    lastUpdated: new Date("2026-08-31T00:00:00Z"),
    refetch: jest.fn(),
  }),
}));

jest.mock("../../hooks/useSecurityEvents", () => ({
  useSecurityEvents: () => ({
    events: [],
    count: 0,
    next: null,
    previous: null,
    page: 1,
    pageSize: 25,
    filters: {
      event_type: "",
      severity: "",
      outcome: "",
      user: "",
      start: "",
      end: "",
      session: "",
    },
    isLoading: false,
    error: null,
    lastUpdated: new Date("2026-08-31T00:00:00Z"),
    setPage: jest.fn(),
    updateFilter: jest.fn(),
    resetFilters: jest.fn(),
    refetch: jest.fn(),
  }),
}));

jest.mock("../../hooks/useSecurityEventDetail", () => ({
  useSecurityEventDetail: () => ({
    event: null,
    isLoading: false,
    error: null,
    fetchEvent: jest.fn(),
    clearEvent: jest.fn(),
  }),
}));

jest.mock("../../hooks/useSecuritySessions", () => ({
  useSecuritySessions: () => ({
    sessions: [],
    count: 0,
    next: null,
    previous: null,
    page: 1,
    pageSize: 25,
    isLoading: false,
    error: null,
    lastUpdated: new Date("2026-08-31T00:00:00Z"),
    setPage: jest.fn(),
    refetch: jest.fn(),
  }),
}));

jest.mock("../../hooks/useSecuritySessionDetail", () => ({
  useSecuritySessionDetail: () => ({
    session: null,
    timelineEvents: [],
    isLoading: false,
    error: null,
    fetchSession: jest.fn(),
    clearSession: jest.fn(),
  }),
}));

const baseEvent = {
  id: "event-1",
  event_type: "REFRESH_REPLAY_DETECTED",
  timestamp: "2026-08-30T10:46:00Z",
  severity: "HIGH",
  outcome: "DENIED",
  reason_code: "REFRESH_REPLAY",
  session_id: "session-1",
  ip_address: "127.0.0.1",
  user: { email: "staff@example.com" },
  metadata: { detector: "refresh-rotation" },
};

describe("Security Observatory components", () => {
  beforeEach(() => {
    mockValidateSession.mockResolvedValue({});
  });

  test("page header renders the signed-in operator", () => {
    render(
      <MemoryRouter>
        <SecurityObservatoryPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Signed in as")).toBeInTheDocument();
    expect(screen.getByText("Anthony Narine")).toBeInTheDocument();
    expect(mockValidateSession).toHaveBeenCalled();
  });

  test("current session summary renders email, status, auth method, and timing", () => {
    render(
      <CurrentSessionSummary
        user={{ email: "security@gaitobservatory.com" }}
        sessions={[]}
        summary={{
          current_session: {
            user: { email: "security@gaitobservatory.com" },
            authentication_method: "password_mfa",
            created_at: "2026-08-30T10:00:00Z",
            last_seen_at: "2026-08-30T10:30:00Z",
            expires_at: "2999-09-06T10:00:00Z",
          },
        }}
      />
    );

    expect(screen.getByText("security@gaitobservatory.com")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("password_mfa")).toBeInTheDocument();
    expect(screen.getByText("Created")).toBeInTheDocument();
    expect(screen.getByText("Last seen")).toBeInTheDocument();
    expect(screen.getByText("Expires")).toBeInTheDocument();
  });

  test("summary renders values and server window", () => {
    render(
      <SecurityOverview
        summary={{
          window_hours: 24,
          active_sessions: 103,
          successful_logins: 35,
          failed_logins: 1,
          replay_events: 7,
          sessions_revoked: 49,
        }}
        isLoading={false}
        error={null}
      />
    );

    expect(screen.getByText("Last 24 hours")).toBeInTheDocument();
    expect(screen.getByText("Active Sessions")).toBeInTheDocument();
    expect(screen.getByText("103")).toBeInTheDocument();
  });

  test("step-up events render human-readable labels", () => {
    render(
      <SecurityEventsTable
        events={[{ ...baseEvent, event_type: "STEP_UP_REQUIRED", user: 7, user_email: "staff@example.com" }]}
        count={1}
        page={1}
        pageSize={25}
        next={null}
        previous={null}
        isLoading={false}
        error={null}
        onPageChange={jest.fn()}
        onSelectEvent={jest.fn()}
      />
    );

    expect(screen.getByText("Additional verification required")).toBeInTheDocument();
    expect(screen.getByText("STEP_UP_REQUIRED")).toBeInTheDocument();
  });
  test("events table renders labels, severity badge, and outcome badge", () => {
    render(
      <SecurityEventsTable
        events={[{ ...baseEvent, user: 7, user_email: "staff@example.com" }]}
        count={1}
        page={1}
        pageSize={25}
        next={null}
        previous={null}
        isLoading={false}
        error={null}
        onPageChange={jest.fn()}
        onSelectEvent={jest.fn()}
      />
    );

    expect(screen.getByText("Replay detected")).toBeInTheDocument();
    expect(screen.getByText("REFRESH_REPLAY_DETECTED")).toBeInTheDocument();
    expect(screen.getByText("HIGH")).toBeInTheDocument();
    expect(screen.getByText("Denied")).toBeInTheDocument();
    expect(screen.getByText("staff@example.com")).toBeInTheDocument();
  });

  test("event detail renders safe details and metadata", async () => {
    const onLoad = jest.fn().mockResolvedValue(baseEvent);
    render(
      <SecurityEventDetailModal
        eventId="event-1"
        event={baseEvent}
        isLoading={false}
        error={null}
        onLoad={onLoad}
        onClose={jest.fn()}
      />
    );

    await waitFor(() => expect(onLoad).toHaveBeenCalledWith("event-1"));
    expect(screen.getByText("Raw event type")).toBeInTheDocument();
    expect(screen.getAllByText("REFRESH_REPLAY_DETECTED")[0]).toBeInTheDocument();
    expect(screen.getByText(/refresh-rotation/)).toBeInTheDocument();
    expect(screen.queryByText(/token hash/i)).not.toBeInTheDocument();
  });

  test("sessions table derives active, revoked, and expired status", () => {
    render(
      <SecuritySessionsTable
        sessions={[
          { uuid: "active-1", user: 1, user_email: "a@example.com", expires_at: "2999-01-01T00:00:00Z" },
          { uuid: "revoked-1", user: "b@example.com", revoked_at: "2026-08-30T11:00:00Z" },
          { uuid: "expired-1", user: "c@example.com", expires_at: "2000-01-01T00:00:00Z" },
        ]}
        count={3}
        page={1}
        pageSize={25}
        next={null}
        previous={null}
        isLoading={false}
        error={null}
        onPageChange={jest.fn()}
        onSelectSession={jest.fn()}
      />
    );

    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Revoked")).toBeInTheDocument();
    expect(screen.getByText("Expired")).toBeInTheDocument();
    expect(screen.getByText("a@example.com")).toBeInTheDocument();
  });

  test("session detail renders safe fields and replay timeline", async () => {
    const onLoad = jest.fn().mockResolvedValue({});
    render(
      <SecuritySessionDetailModal
        sessionId="session-1"
        session={{
          uuid: "session-1",
          user: { email: "staff@example.com" },
          authentication_method: "password_mfa",
          authentication_strength: "MFA",
          created_ip: "127.0.0.1",
          user_agent: "Browser",
        }}
        timelineEvents={[
          { id: 1, event_type: "TOKEN_REFRESHED", timestamp: "2026-08-30T10:18:00Z" },
          { id: 2, event_type: "REFRESH_REPLAY_DETECTED", timestamp: "2026-08-30T10:46:00Z" },
          { id: 3, event_type: "SESSION_REVOKED", timestamp: "2026-08-30T10:46:00Z" },
        ]}
        isLoading={false}
        error={null}
        onLoad={onLoad}
        onClose={jest.fn()}
      />
    );

    await waitFor(() => expect(onLoad).toHaveBeenCalledWith("session-1"));
    expect(screen.getByText("Session UUID")).toBeInTheDocument();
    expect(screen.getByText("Credentials refreshed")).toBeInTheDocument();
    expect(screen.getAllByText("SESSION_REVOKED")[0]).toBeInTheDocument();
    expect(screen.queryByText(/token hash/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^jti$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^secret$/i)).not.toBeInTheDocument();
  });

  test("403 displays permission denied and hides audit rows", () => {
    render(<SecurityErrorState error={{ response: { status: 403 } }} />);

    expect(screen.getByText("Permission denied")).toBeInTheDocument();
    expect(screen.getByText(/do not have permission/i)).toBeInTheDocument();
    expect(screen.queryByText("Login successful")).not.toBeInTheDocument();
  });

  test("clicking an event is keyboard and mouse accessible", () => {
    const onSelectEvent = jest.fn();
    render(
      <MemoryRouter>
        <SecurityEventsTable
          events={[baseEvent]}
          count={1}
          page={1}
          pageSize={25}
          next={null}
          previous={null}
          isLoading={false}
          error={null}
          onPageChange={jest.fn()}
          onSelectEvent={onSelectEvent}
        />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("row", { name: /Replay detected/i }));
    expect(onSelectEvent).toHaveBeenCalledWith(baseEvent);
  });

  test("Observatory navigation still exposes events and sessions alongside new sections", () => {
    render(
      <MemoryRouter>
        <SecurityObservatoryPage />
      </MemoryRouter>
    );

    expect(screen.getByRole("button", { name: "Overview" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Controls" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Findings" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Evidence" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Events" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sessions" })).toBeInTheDocument();
  });

  test("switching to the Events tab still renders the events table", () => {
    render(
      <MemoryRouter>
        <SecurityObservatoryPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: "Events" }));
    expect(screen.getByRole("heading", { name: "Events" })).toBeInTheDocument();
    expect(screen.getByText("No security events match these filters.")).toBeInTheDocument();
  });

  test("switching to the Sessions tab still renders the sessions table", () => {
    render(
      <MemoryRouter>
        <SecurityObservatoryPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: "Sessions" }));
    expect(screen.getByRole("heading", { name: "Authentication Sessions" })).toBeInTheDocument();
    expect(screen.getByText("No sessions found.")).toBeInTheDocument();
  });

  test("ordinary 403 permission denial does not open the step-up dialog", () => {
    render(<SecurityErrorState error={{ response: { status: 403 } }} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

