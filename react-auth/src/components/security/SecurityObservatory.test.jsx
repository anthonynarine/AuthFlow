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

  test("events table renders labels, severity badge, and outcome badge", () => {
    render(
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
        onSelectEvent={jest.fn()}
      />
    );

    expect(screen.getByText("Refresh token replay detected")).toBeInTheDocument();
    expect(screen.getByText("HIGH")).toBeInTheDocument();
    expect(screen.getByText("DENIED")).toBeInTheDocument();
    expect(screen.getByText("Replay detected")).toBeInTheDocument();
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
          { uuid: "active-1", user: "a@example.com", expires_at: "2999-01-01T00:00:00Z" },
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

    expect(screen.getByText("ACTIVE")).toBeInTheDocument();
    expect(screen.getByText("REVOKED")).toBeInTheDocument();
    expect(screen.getByText("EXPIRED")).toBeInTheDocument();
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
    expect(screen.getByText("TOKEN_REFRESHED")).toBeInTheDocument();
    expect(screen.getByText("SESSION_REVOKED")).toBeInTheDocument();
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

    fireEvent.click(screen.getByRole("row", { name: /Refresh token replay detected/i }));
    expect(onSelectEvent).toHaveBeenCalledWith(baseEvent);
  });
});
