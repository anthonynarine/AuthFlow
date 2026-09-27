import React from "react";
import "@testing-library/jest-dom";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { RunExerciseModal } from "./RunExerciseModal";
import { authAxios } from "../../interceptors/axios";

jest.mock("../../interceptors/axios", () => ({
  authAxios: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

const PLAYBOOK = {
  key: "auth.refresh_token_replay",
  version: 1,
  title: "Refresh Token Replay",
  category: "AUTHENTICATION",
  allowed_environments: ["test"],
  target_controls: [{ control_key: "GAIT.AUTH.REFRESH_REPLAY_PROTECTION", title: "Refresh Replay Protection" }],
  implementation_status: "IMPLEMENTED",
  executable: true,
};

function runResponse(status, overrides = {}) {
  return {
    data: {
      id: "run-1",
      playbook_key: "auth.refresh_token_replay",
      playbook_version: 1,
      environment: "test",
      status,
      requested_at: new Date().toISOString(),
      ...overrides,
    },
  };
}

describe("RunExerciseModal", () => {
  beforeEach(() => {
    authAxios.get.mockReset();
    authAxios.post.mockReset();
    // window.crypto is not implemented at all in this project's jsdom test
    // environment; every path that submits needs its own UUID source.
    let counter = 0;
    window.crypto = { randomUUID: jest.fn(() => `uuid-${++counter}`) };
  });

  afterEach(() => {
    delete window.crypto;
  });

  test("renders nothing when no playbook is selected", () => {
    const { container } = render(<RunExerciseModal playbook={null} onClose={jest.fn()} onRunSettled={jest.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  test("confirmation POSTs only the permitted fields with an Idempotency-Key header, and a rapid second click does not duplicate it", async () => {
    authAxios.post.mockResolvedValue(runResponse("PASSED"));
    render(<RunExerciseModal playbook={PLAYBOOK} onClose={jest.fn()} onRunSettled={jest.fn()} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    const confirmButton = screen.getByRole("button", { name: "Confirm and Run" });

    // eslint-disable-next-line testing-library/no-unnecessary-act -- both clicks must land before React re-renders (same-tick double submit)
    await act(async () => {
      fireEvent.click(confirmButton);
      fireEvent.click(confirmButton);
    });

    await waitFor(() => expect(authAxios.post).toHaveBeenCalledTimes(1));
    const [url, body, config] = authAxios.post.mock.calls[0];
    expect(url).toBe("/security-exercises/runs/");
    expect(body).toEqual({
      playbook_key: "auth.refresh_token_replay",
      playbook_version: 1,
      environment: "test",
      target_control_key: "GAIT.AUTH.REFRESH_REPLAY_PROTECTION",
    });
    expect(config).toEqual({ headers: { "Idempotency-Key": "uuid-1" } });
    // A double-click must not mint a second key either.
    expect(window.crypto.randomUUID).toHaveBeenCalledTimes(1);
  });

  test("a same-logical-request retry via Try again reuses the exact same Idempotency-Key", async () => {
    authAxios.post.mockRejectedValueOnce(new Error("Network Error"));
    render(<RunExerciseModal playbook={PLAYBOOK} onClose={jest.fn()} onRunSettled={jest.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Confirm and Run" }));
    await screen.findByRole("button", { name: "Try again" });

    authAxios.post.mockResolvedValueOnce(runResponse("PASSED"));
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    await waitFor(() => expect(authAxios.post).toHaveBeenCalledTimes(2));
    const firstKey = authAxios.post.mock.calls[0][2].headers["Idempotency-Key"];
    const secondKey = authAxios.post.mock.calls[1][2].headers["Idempotency-Key"];
    expect(secondKey).toBe(firstKey);
    expect(window.crypto.randomUUID).toHaveBeenCalledTimes(1);
  });

  test("a 409 IDEMPOTENCY_KEY_CONFLICT is surfaced with a clear, safe message instead of a silent resubmission", async () => {
    authAxios.post.mockRejectedValueOnce({
      response: {
        status: 409,
        data: { error: "IDEMPOTENCY_KEY_CONFLICT", detail: "conflict" },
      },
    });
    render(<RunExerciseModal playbook={PLAYBOOK} onClose={jest.fn()} onRunSettled={jest.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Confirm and Run" }));

    expect(
      await screen.findByText(/already used for a different exercise request/i)
    ).toBeInTheDocument();
    expect(authAxios.post).toHaveBeenCalledTimes(1);
  });

  test("never offers a production environment, even if the backend advertises one", () => {
    const unsafePlaybook = { ...PLAYBOOK, allowed_environments: ["test", "staging", "production"] };
    render(<RunExerciseModal playbook={unsafePlaybook} onClose={jest.fn()} onRunSettled={jest.fn()} />);

    const select = screen.getByRole("combobox");
    expect(within(select).getByRole("option", { name: "Test" })).toBeInTheDocument();
    expect(within(select).getByRole("option", { name: "Staging" })).toBeInTheDocument();
    expect(within(select).queryByRole("option", { name: "Production" })).not.toBeInTheDocument();
  });

  test("does not close on Escape while a submission is in flight", async () => {
    let resolvePost;
    authAxios.post.mockReturnValue(
      new Promise((resolve) => {
        resolvePost = () => resolve(runResponse("PASSED"));
      })
    );
    const onClose = jest.fn();
    render(<RunExerciseModal playbook={PLAYBOOK} onClose={onClose} onRunSettled={jest.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Confirm and Run" }));
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();

    await act(async () => {
      resolvePost();
      await Promise.resolve();
    });
  });

  test.each([
    ["PASSED", /demonstrated the expected secure behavior/i],
    ["FAILED", /security protection was not satisfied/i],
    ["DENIED", /Gait governance prevented execution/i],
    ["ERROR", /could not establish a result/i],
  ])("renders a distinct explanation for a %s result", async (status, expectedText) => {
    authAxios.post.mockResolvedValue(runResponse(status));
    render(<RunExerciseModal playbook={PLAYBOOK} onClose={jest.fn()} onRunSettled={jest.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Confirm and Run" }));

    expect(await screen.findByText(expectedText)).toBeInTheDocument();
    expect(screen.getByText(/not Security Truth/i)).toBeInTheDocument();
  });

  test("a 400 validation rejection is shown safely with the backend's own detail, not a generic banner", async () => {
    authAxios.post.mockRejectedValue({
      response: { status: 400, data: { error: "PRODUCTION_NOT_ALLOWED", detail: "Security Exercises cannot run in production." } },
    });
    render(<RunExerciseModal playbook={PLAYBOOK} onClose={jest.fn()} onRunSettled={jest.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Confirm and Run" }));

    expect(await screen.findByText("Security Exercises cannot run in production.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
    // No fabricated PASS/FAIL/DENIED result is shown for a request that was never accepted.
    expect(screen.queryByText(/not Security Truth/i)).not.toBeInTheDocument();
  });

  test("shows no result badge while the submission is still in flight (no optimistic PASS/FAIL)", async () => {
    let resolvePost;
    authAxios.post.mockReturnValue(
      new Promise((resolve) => {
        resolvePost = () => resolve(runResponse("PASSED"));
      })
    );
    render(<RunExerciseModal playbook={PLAYBOOK} onClose={jest.fn()} onRunSettled={jest.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Confirm and Run" }));

    expect(screen.getByText("Submitting exercise…")).toBeInTheDocument();
    expect(screen.queryByText("Passed")).not.toBeInTheDocument();
    expect(screen.queryByText(/not Security Truth/i)).not.toBeInTheDocument();

    await act(async () => {
      resolvePost();
      await Promise.resolve();
    });
  });

  test("confirmation copy uses canonical Incident Commander / Gateway terminology", () => {
    render(<RunExerciseModal playbook={PLAYBOOK} onClose={jest.fn()} onRunSettled={jest.fn()} />);
    expect(screen.getByText(/Incident Commander/)).toBeInTheDocument();
  });
});
