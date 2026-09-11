import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SecurityLearningDrawer } from "./SecurityLearningDrawer";
import { __resetSecurityLearningCacheForTests } from "../../hooks/useSecurityLearning";
import { authAxios } from "../../interceptors/axios";

jest.mock("../../interceptors/axios", () => ({
  authAxios: {
    get: jest.fn(),
  },
}));

const REFRESH_REPLAY = {
  key: "refresh_replay_detection",
  title: "Refresh Replay Detection",
  category: "Authentication & Sessions",
  short_summary: "Reusing an already-consumed refresh credential is rejected.",
  why_it_exists: "x",
  how_it_works: "x",
  how_gait_uses_it: "x",
  example: "x",
  failure_scenario: "x",
  security_invariant: "x",
  key_takeaways: ["x"],
  related_topics: ["token_family", "broken_link"],
  implementation_references: [],
  classification: "INTERNAL",
};

const TOKEN_FAMILY = {
  key: "token_family",
  title: "Refresh Token Family",
  category: "Authentication & Sessions",
  short_summary: "A traceable lineage linking every refresh token descended from one login.",
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
};

function mockRoute(routes) {
  authAxios.get.mockImplementation((url) => {
    const entry = routes[url];
    if (!entry) {
      return Promise.reject({ response: { status: 404 } });
    }
    return entry.error ? Promise.reject(entry.error) : Promise.resolve({ data: entry.data });
  });
}

describe("SecurityLearningDrawer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __resetSecurityLearningCacheForTests();
  });

  test("loads and displays the requested topic", async () => {
    mockRoute({ "/security/learning/refresh_replay_detection/": { data: REFRESH_REPLAY } });

    render(<SecurityLearningDrawer topicKey="refresh_replay_detection" onClose={jest.fn()} />);

    expect(await screen.findByRole("heading", { name: "Refresh Replay Detection" })).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  test("shows a restrained unavailable message on load failure, never fabricated lesson text", async () => {
    mockRoute({});

    render(<SecurityLearningDrawer topicKey="nonexistent" onClose={jest.fn()} />);

    expect(await screen.findByText("Learning content unavailable.")).toBeInTheDocument();
  });

  test("clicking a related concept navigates the same drawer to that topic", async () => {
    mockRoute({
      "/security/learning/refresh_replay_detection/": { data: REFRESH_REPLAY },
      "/security/learning/token_family/": { data: TOKEN_FAMILY },
    });

    render(<SecurityLearningDrawer topicKey="refresh_replay_detection" onClose={jest.fn()} />);
    await screen.findByRole("heading", { name: "Refresh Replay Detection" });

    fireEvent.click(screen.getByRole("button", { name: "Token Family" }));

    expect(await screen.findByRole("heading", { name: "Refresh Token Family" })).toBeInTheDocument();
  });

  test("a broken related topic fails gracefully and keeps the current lesson visible", async () => {
    mockRoute({
      "/security/learning/refresh_replay_detection/": { data: REFRESH_REPLAY },
    });

    render(<SecurityLearningDrawer topicKey="refresh_replay_detection" onClose={jest.fn()} />);
    await screen.findByRole("heading", { name: "Refresh Replay Detection" });

    fireEvent.click(screen.getByRole("button", { name: "Broken Link" }));

    expect(await screen.findByText("Learning content unavailable.")).toBeInTheDocument();
    // Current lesson stays on screen -- navigation failure did not replace it.
    expect(screen.getByRole("heading", { name: "Refresh Replay Detection" })).toBeInTheDocument();
  });

  test("Back returns to the previous topic after a successful related-topic navigation", async () => {
    mockRoute({
      "/security/learning/refresh_replay_detection/": { data: REFRESH_REPLAY },
      "/security/learning/token_family/": { data: TOKEN_FAMILY },
    });

    render(<SecurityLearningDrawer topicKey="refresh_replay_detection" onClose={jest.fn()} />);
    await screen.findByRole("heading", { name: "Refresh Replay Detection" });

    fireEvent.click(screen.getByRole("button", { name: "Token Family" }));
    await screen.findByRole("heading", { name: "Refresh Token Family" });

    expect(screen.getByRole("button", { name: "← Back" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "← Back" }));

    expect(await screen.findByRole("heading", { name: "Refresh Replay Detection" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "← Back" })).not.toBeInTheDocument();
  });

  test("revisiting an already-loaded topic does not refetch it", async () => {
    mockRoute({
      "/security/learning/refresh_replay_detection/": { data: REFRESH_REPLAY },
      "/security/learning/token_family/": { data: TOKEN_FAMILY },
    });

    render(<SecurityLearningDrawer topicKey="refresh_replay_detection" onClose={jest.fn()} />);
    await screen.findByRole("heading", { name: "Refresh Replay Detection" });

    fireEvent.click(screen.getByRole("button", { name: "Token Family" }));
    await screen.findByRole("heading", { name: "Refresh Token Family" });

    fireEvent.click(screen.getByRole("button", { name: "← Back" }));
    await screen.findByRole("heading", { name: "Refresh Replay Detection" });

    expect(authAxios.get).toHaveBeenCalledTimes(2); // initial topic + token_family, no refetch on Back
  });

  test("has an accessible close control and returns via Escape", async () => {
    mockRoute({ "/security/learning/refresh_replay_detection/": { data: REFRESH_REPLAY } });
    const onClose = jest.fn();

    render(<SecurityLearningDrawer topicKey="refresh_replay_detection" onClose={onClose} />);
    await screen.findByRole("heading", { name: "Refresh Replay Detection" });

    expect(screen.getByRole("button", { name: "Close learning view" })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  test("closes on backdrop click", async () => {
    mockRoute({ "/security/learning/refresh_replay_detection/": { data: REFRESH_REPLAY } });
    const onClose = jest.fn();

    render(<SecurityLearningDrawer topicKey="refresh_replay_detection" onClose={onClose} />);
    await screen.findByRole("heading", { name: "Refresh Replay Detection" });

    fireEvent.mouseDown(screen.getByRole("presentation"));
    expect(onClose).toHaveBeenCalled();
  });

  test("related-topic buttons are real, keyboard-focusable buttons", async () => {
    mockRoute({ "/security/learning/refresh_replay_detection/": { data: REFRESH_REPLAY } });

    render(<SecurityLearningDrawer topicKey="refresh_replay_detection" onClose={jest.fn()} />);
    await screen.findByRole("heading", { name: "Refresh Replay Detection" });

    const relatedButton = screen.getByRole("button", { name: "Token Family" });
    expect(relatedButton.tagName).toBe("BUTTON");
  });
});
