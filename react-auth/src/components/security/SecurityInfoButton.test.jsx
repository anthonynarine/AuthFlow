import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SecurityInfoButton } from "./SecurityInfoButton";

describe("SecurityInfoButton", () => {
  test("has a meaningful accessible label derived from the title, not a generic one", () => {
    render(<SecurityInfoButton title="Security Posture">content</SecurityInfoButton>);
    expect(screen.getByRole("button", { name: "Explain Security Posture" })).toBeInTheDocument();
  });

  test("an explicit label overrides the default", () => {
    render(
      <SecurityInfoButton title="Security Posture" label="Custom label">
        content
      </SecurityInfoButton>
    );
    expect(screen.getByRole("button", { name: "Custom label" })).toBeInTheDocument();
  });

  test("renders raw children when no structured content is given", () => {
    render(
      <SecurityInfoButton title="Legacy">
        <p>Legacy hardcoded copy.</p>
      </SecurityInfoButton>
    );
    fireEvent.click(screen.getByRole("button", { name: "Explain Legacy" }));
    expect(screen.getByText("Legacy hardcoded copy.")).toBeInTheDocument();
  });

  test("renders only the sections present on backend help content, in order", () => {
    const help = {
      key: "controls",
      title: "Controls",
      short_description: "The protections Gait expects the system to maintain.",
      why_it_matters: "Controls are the durable unit Gait uses.",
      related_view: "evidence",
      // what_it_is, how_it_is_determined, data_source intentionally absent.
    };

    render(<SecurityInfoButton content={help} />);
    fireEvent.click(screen.getByRole("button", { name: "Explain Controls" }));

    expect(screen.getByRole("dialog", { name: "Controls" })).toBeInTheDocument();
    expect(screen.getByText("The protections Gait expects the system to maintain.")).toBeInTheDocument();
    expect(screen.getByText("Why does it matter?")).toBeInTheDocument();
    expect(screen.getByText("Controls are the durable unit Gait uses.")).toBeInTheDocument();
    expect(screen.getByText("Related: Evidence")).toBeInTheDocument();

    // No fabricated headings for fields the backend didn't provide.
    expect(screen.queryByText("What is this?")).not.toBeInTheDocument();
    expect(screen.queryByText("How is it determined?")).not.toBeInTheDocument();
    expect(screen.queryByText("Data source")).not.toBeInTheDocument();
  });

  test("renders backend status_explanations verbatim under one Status meanings section", () => {
    const help = {
      key: "sessions",
      title: "Sessions",
      short_description: "Server-authoritative sessions.",
      status_explanations: {
        ACTIVE: "This session is currently active.",
        REVOKED: "This session has been revoked.",
      },
    };

    render(<SecurityInfoButton content={help} />);
    fireEvent.click(screen.getByRole("button", { name: "Explain Sessions" }));

    expect(screen.getByText("Status meanings")).toBeInTheDocument();
    expect(screen.getByText("ACTIVE")).toBeInTheDocument();
    expect(screen.getByText("This session is currently active.")).toBeInTheDocument();
    expect(screen.getByText("REVOKED")).toBeInTheDocument();
    expect(screen.getByText("This session has been revoked.")).toBeInTheDocument();
  });

  test("renders a control's singular status_explanation as its own section", () => {
    const controlHelp = {
      title: "Refresh Token Replay Protection",
      short_description: "Prevents reuse of a consumed refresh credential.",
      status_explanation: "Trusted evidence shows consumed refresh credentials are rejected.",
    };

    render(<SecurityInfoButton content={controlHelp} />);
    fireEvent.click(screen.getByRole("button", { name: "Explain Refresh Token Replay Protection" }));

    expect(screen.getByText("What does the current status mean?")).toBeInTheDocument();
    expect(
      screen.getByText("Trusted evidence shows consumed refresh credentials are rejected.")
    ).toBeInTheDocument();
  });

  test("closes on Escape and on backdrop click", async () => {
    render(<SecurityInfoButton content={{ title: "Findings", short_description: "x" }} />);
    fireEvent.click(screen.getByRole("button", { name: "Explain Findings" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});
