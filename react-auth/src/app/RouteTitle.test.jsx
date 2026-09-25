import React from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DEFAULT_TITLE, RouteTitle, titleForPath } from "./RouteTitle";

describe("RouteTitle", () => {
  test.each([
    ["/", DEFAULT_TITLE],
    ["/developers", "gait-sdk for developers · Gait"],
    ["/architecture", "Architecture · Gait"],
    ["/security", "Security Observatory · Gait"],
    ["/security-observatory", "Security Observatory · Gait"],
    ["/security-command", "Security Command · Gait"],
    ["/workspace/issues/42", "Issue · Gait"],
    ["/workspace/issues", "Issues · Gait"],
    ["/reset-password/abc/def", "Reset password · Gait"],
    ["/no-such-page", DEFAULT_TITLE],
  ])("%s -> %s", (path, title) => {
    expect(titleForPath(path)).toBe(title);
  });

  test("sets document.title for the current route", () => {
    render(
      <MemoryRouter initialEntries={["/developers"]}>
        <RouteTitle />
      </MemoryRouter>
    );
    expect(document.title).toBe("gait-sdk for developers · Gait");
  });
});
