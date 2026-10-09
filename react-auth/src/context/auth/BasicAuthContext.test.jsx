import React from "react";
import { render, act } from "@testing-library/react";
import { BasicAuthProvider, useBasicAuthServices } from "./BasicAuthContext";
import { queryClient } from "../../app/queryClient";
import { getAccessToken, persistAuthTokens } from "../../interceptors/tokenStorage";
import { __listeners as mockSignedOutListeners, __unsubscribe as mockUnsubscribe } from "../../interceptors/sessionEvents";

// GAIT-SEC-040: a sign-out in another tab must end this tab's signed-in state.
// The factory runs when the module is first imported (before this file's own
// top-level code), so the listener registry lives inside the mock itself.
// Plain functions, not jest.fn: CRA's resetMocks would wipe their behaviour.
jest.mock("../../interceptors/sessionEvents", () => {
    const listeners = new Set();
    const unsubscribe = { calls: 0 };
    return {
        SESSION_ENDED_EVENT: "gait:session-ended",
        broadcastSignedOut: jest.fn(),
        onSignedOutElsewhere: (listener) => {
            listeners.add(listener);
            return () => {
                listeners.delete(listener);
                unsubscribe.calls += 1;
            };
        },
        __listeners: listeners,
        __unsubscribe: unsubscribe,
    };
});

jest.mock("../../interceptors/axios", () => ({
    SESSION_ENDED_EVENT: "gait:session-ended",
    publicAxios: { post: jest.fn() },
    logoutSession: jest.fn(),
    SESSION_TRANSPORT: { session_transport: "cookie" },
}));

jest.mock("react-router-dom", () => ({
    useNavigate: () => jest.fn(),
}));

jest.mock("../../app/queryClient", () => ({
    queryClient: { clear: jest.fn() },
}));

function signOutInAnotherTab() {
    mockSignedOutListeners.forEach((listener) => listener());
}

let services;
function Probe() {
    services = useBasicAuthServices();
    return null;
}

function renderSignedIn() {
    const view = render(
        <BasicAuthProvider>
            <Probe />
        </BasicAuthProvider>,
    );
    act(() => {
        services.setUser({ id: 1, first_name: "Ada" });
        services.setIsLoggedIn(true);
    });
    persistAuthTokens({ accessToken: "access-1" });
    return view;
}

describe("BasicAuthProvider and the signed-out broadcast", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockSignedOutListeners.clear();
        mockUnsubscribe.calls = 0;
    });

    test("a sign-out in another tab clears user, signed-in flag, access token and cached queries", () => {
        renderSignedIn();
        expect(services.isLoggedIn).toBe(true);
        expect(getAccessToken()).toBe("access-1");

        act(() => signOutInAnotherTab());

        expect(services.user).toBeNull();
        expect(services.isLoggedIn).toBe(false);
        expect(getAccessToken()).toBeNull();
        expect(queryClient.clear).toHaveBeenCalledTimes(1);
    });

    test("the session-ended event still clears state the same way", () => {
        renderSignedIn();

        act(() => {
            window.dispatchEvent(new Event("gait:session-ended"));
        });

        expect(services.user).toBeNull();
        expect(services.isLoggedIn).toBe(false);
        expect(queryClient.clear).toHaveBeenCalledTimes(1);
    });

    test("unmounting the provider unsubscribes from the broadcast", () => {
        const { unmount } = renderSignedIn();
        expect(mockSignedOutListeners.size).toBe(1);

        unmount();

        expect(mockSignedOutListeners.size).toBe(0);
        expect(mockUnsubscribe.calls).toBe(1);
    });
});
