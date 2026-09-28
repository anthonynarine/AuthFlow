import React from "react";
import "@testing-library/jest-dom";
import { act, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { RequireOperator } from "./RequireOperator";
import { isGaitOperator } from "./operator";

let mockUser = null;
let mockSessionUser = null;
let resolveSession;
const mockValidateSession = jest.fn();
// Like the real validateSession: the user object is replaced when the check answers.
const pendingSessionCheck = () =>
    new Promise((resolve) => {
        resolveSession = () => {
            mockUser = mockSessionUser;
            resolve();
        };
    });

jest.mock("../context/auth/BasicAuthContext", () => ({
    useBasicAuthServices: () => ({ user: mockUser }),
}));
jest.mock("../context/auth/UserSessionContext", () => ({
    useUserSessionServices: () => ({ validateSession: mockValidateSession }),
}));

// Stands in for an operator page; mounting it is what would fire operator API calls.
const mockPageMounted = jest.fn();
function OperatorPage() {
    mockPageMounted();
    return <div>Observatory data</div>;
}

const tree = () => (
    <MemoryRouter initialEntries={["/security"]}>
        <Routes>
            <Route path="/security" element={<RequireOperator><OperatorPage /></RequireOperator>} />
            <Route path="/login" element={<div>Sign in page</div>} />
        </Routes>
    </MemoryRouter>
);

function renderGuard() {
    return render(tree());
}

async function finishSessionCheck(rerender) {
    await act(async () => {
        resolveSession();
    });
    // The mocked context isn't reactive; re-render so the guard reads the new user.
    rerender(tree());
}

beforeEach(() => {
    jest.clearAllMocks();
    // CRA's resetMocks wipes implementations before every test; set it here.
    mockValidateSession.mockImplementation(pendingSessionCheck);
    mockUser = null;
    mockSessionUser = null;
});

describe("isGaitOperator", () => {
    test("true only for is_gait_operator === true", () => {
        expect(isGaitOperator({ is_gait_operator: true })).toBe(true);
        expect(isGaitOperator({ is_gait_operator: false })).toBe(false);
        expect(isGaitOperator({ is_gait_operator: "true" })).toBe(false);
        expect(isGaitOperator({ is_gait_operator: 1 })).toBe(false);
        expect(isGaitOperator({})).toBe(false);
        expect(isGaitOperator(null)).toBe(false);
        expect(isGaitOperator(undefined)).toBe(false);
    });

    test("no fallback to is_staff, is_superuser or the old capability field", () => {
        expect(isGaitOperator({ is_staff: true, is_superuser: true, can_view_security_dashboard: true })).toBe(false);
    });
});

describe("RequireOperator", () => {
    test("checks the session first and mounts nothing until it answers", () => {
        mockUser = { is_gait_operator: true }; // stale in-memory user isn't trusted on its own
        renderGuard();

        expect(mockValidateSession).toHaveBeenCalledTimes(1);
        expect(screen.getByRole("status")).toHaveTextContent("Checking access");
        expect(mockPageMounted).not.toHaveBeenCalled();
    });

    test("an operator gets the page", async () => {
        mockSessionUser = { email: "op@gait.test", is_gait_operator: true };
        const { rerender } = renderGuard();
        await finishSessionCheck(rerender);

        expect(screen.getByText("Observatory data")).toBeInTheDocument();
        expect(mockPageMounted).toHaveBeenCalled();
    });

    test.each([
        ["the flag is false", { is_gait_operator: false }],
        ["the flag is missing", {}],
        ["staff and superuser without the flag", { is_staff: true, is_superuser: true }],
    ])("not an operator (%s): Not available, and the page never mounts", async (_label, fields) => {
        mockSessionUser = { email: "someone@acme.test", ...fields };
        const { rerender } = renderGuard();
        await finishSessionCheck(rerender);

        expect(screen.getByRole("heading", { name: "Not available" })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute("href", "/");
        expect(screen.queryByText("Observatory data")).not.toBeInTheDocument();
        expect(mockPageMounted).not.toHaveBeenCalled();
    });

    test("signed out: sent to sign in, and the page never mounts", async () => {
        mockSessionUser = null;
        const { rerender } = renderGuard();
        await finishSessionCheck(rerender);

        expect(screen.getByText("Sign in page")).toBeInTheDocument();
        expect(mockPageMounted).not.toHaveBeenCalled();
    });

    test("the session now says not an operator: a stale operator user in memory doesn't get through", async () => {
        mockUser = { is_gait_operator: true };
        mockSessionUser = { email: "demoted@gait.test", is_gait_operator: false };
        const { rerender } = renderGuard();
        await finishSessionCheck(rerender);

        expect(screen.getByRole("heading", { name: "Not available" })).toBeInTheDocument();
        expect(mockPageMounted).not.toHaveBeenCalled();
    });
});
