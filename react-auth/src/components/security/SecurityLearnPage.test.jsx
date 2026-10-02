import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { SecurityLearnPage } from "./SecurityLearnPage";
import { __resetSecurityLearningCacheForTests } from "../../hooks/useSecurityLearning";
import { authAxios } from "../../interceptors/axios";

jest.mock("../../interceptors/axios", () => ({
  authAxios: {
    get: jest.fn(),
    defaults: { baseURL: "http://localhost:8000/api" },
  },
}));

jest.mock("../../context/auth/BasicAuthContext", () => ({
  useBasicAuthServices: () => ({
    user: { first_name: "Security", last_name: "Staff", email: "security@example.test", is_gait_operator: true },
  }),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <SecurityLearnPage />
    </MemoryRouter>
  );
}

describe("SecurityLearnPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __resetSecurityLearningCacheForTests();
  });

  test("groups catalog topics by their backend-provided category", async () => {
    authAxios.get.mockResolvedValueOnce({
      data: [
        { key: "access_token", title: "Access Token", category: "Authentication & Sessions", short_summary: "x" },
        { key: "refresh_token", title: "Refresh Token", category: "Authentication & Sessions", short_summary: "x" },
        { key: "security_posture", title: "Security Posture", category: "Security Truth", short_summary: "x" },
      ],
    });

    renderPage();

    expect(await screen.findByRole("heading", { name: "Authentication & Sessions" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Security Truth" })).toBeInTheDocument();
    expect(screen.getByText("Access Token")).toBeInTheDocument();
    expect(screen.getByText("Refresh Token")).toBeInTheDocument();
    expect(screen.getByText("Security Posture")).toBeInTheDocument();
  });

  test("opening a catalog topic loads and displays its full lesson", async () => {
    authAxios.get.mockImplementation((url) => {
      if (url === "/security/learning/") {
        return Promise.resolve({
          data: [{ key: "access_token", title: "Access Token", category: "Authentication & Sessions", short_summary: "x" }],
        });
      }
      if (url === "/security/learning/access_token/") {
        return Promise.resolve({
          data: {
            key: "access_token",
            title: "Access Token",
            category: "Authentication & Sessions",
            short_summary: "The short-lived JWT that proves who is currently authenticated.",
            why_it_exists: "x",
            how_it_works: "x",
            how_gait_uses_it: "x",
            example: "x",
            failure_scenario: "x",
            security_invariant: "x",
            key_takeaways: ["x"],
            related_topics: [],
            implementation_references: [],
            classification: "INTERNAL",
          },
        });
      }
      return Promise.reject({ response: { status: 404 } });
    });

    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: /Access Token/ }));

    expect(
      await screen.findByText("The short-lived JWT that proves who is currently authenticated.")
    ).toBeInTheDocument();
  });

  test("a catalog load failure does not crash the page and offers a retry", async () => {
    authAxios.get.mockRejectedValueOnce({ response: { status: 500 } });

    renderPage();

    expect(await screen.findByRole("button", { name: "Retry" })).toBeInTheDocument();
  });
});
