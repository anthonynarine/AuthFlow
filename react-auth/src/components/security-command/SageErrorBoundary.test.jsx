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
});
