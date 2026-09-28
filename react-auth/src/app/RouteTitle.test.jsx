import React from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DEFAULT_TITLE, RouteTitle, titleForPath } from "./RouteTitle";

describe("RouteTitle", () => {
  test.each([
    ["/", DEFAULT_TITLE],
    ["/docs/gait-sdk", "gait-sdk · Gait Docs"],
    ["/security", "Security Observatory · Gait"],
    ["/security-observatory", "Security Observatory · Gait"],
    ["/security-command", "Security Command · Gait"],
    ["/workspace/issues/42", "Issue · Gait"],
    ["/workspace/issues", "Issues · Gait"],
    ["/reset-password", "Reset password · Gait"],
    ["/reset-password/abc/def", DEFAULT_TITLE],
    ["/no-such-page", DEFAULT_TITLE],
  ])("%s -> %s", (path, title) => {
    expect(titleForPath(path)).toBe(title);
  });

  test("sets document.title for the current route", () => {
    render(
      <MemoryRouter initialEntries={["/docs/gait-sdk"]}>
        <RouteTitle />
      </MemoryRouter>
    );
    expect(document.title).toBe("gait-sdk · Gait Docs");
  });
});
