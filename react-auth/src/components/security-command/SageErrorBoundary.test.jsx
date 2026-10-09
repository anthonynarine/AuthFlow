import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { SageErrorBoundary } from "./SageErrorBoundary";

function Boom() {
  throw new Error("malformed Sage response");
}

describe("SageErrorBoundary (B-UX3 section 24: failure isolation)", () => {
  test("renders children normally when nothing throws", () => {
    render(
      <SageErrorBoundary>
        <p>real content</p>
      </SageErrorBoundary>
    );
    expect(screen.getByText("real content")).toBeInTheDocument();
  });

  test("contains a render failure locally and falls back to the raw backend answer text", () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});

    render(
      <SageErrorBoundary fallbackAnswer="raw fallback answer">
        <Boom />
      </SageErrorBoundary>
    );

    expect(screen.getByText("raw fallback answer")).toBeInTheDocument();
    expect(screen.queryByText("real content")).not.toBeInTheDocument();

    consoleError.mockRestore();
  });

  test("falls back to a safe generic message when no fallbackAnswer is available", () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});

    render(
      <SageErrorBoundary>
        <Boom />
      </SageErrorBoundary>
    );

    expect(screen.getByText("Gait could not display this knowledge response.")).toBeInTheDocument();

    consoleError.mockRestore();
  });

  // GAIT-SEC-095: the boundary's own log line carries the error class only,
  // never the error object or its message (which can quote response content).
  test("logs only the error class name, never the error or its message", () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    function LeakyBoom() {
      throw new TypeError("response quoted secret-SAGE-content");
    }

    render(
      <SageErrorBoundary>
        <LeakyBoom />
      </SageErrorBoundary>
    );

    const ownCalls = consoleError.mock.calls.filter(
      (args) => typeof args[0] === "string" && args[0].startsWith("Sage response failed to render")
    );
    expect(ownCalls).toEqual([["Sage response failed to render: TypeError"]]);

    consoleError.mockRestore();
  });
});
