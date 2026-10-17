import "@testing-library/jest-dom";
import React from "react";
import { act, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { ConsoleSessionPolicy } from "./ConsoleSessionPolicy";
import { createActivitySession } from "./activitySession";
import { clearAuthTokens, persistAuthTokens } from "../../interceptors/tokenStorage";
jest.mock("./activitySession", () => ({ ...jest.requireActual("./activitySession"), createActivitySession: jest.fn() }));
const jwt = (sid) => `x.${btoa(JSON.stringify({ sid, sub: "u", aud: "console" }))}.x`;
let controls;
function Login() { const location = useLocation(); return <p>Sign in {location.state?.from}</p>; }
function fixture(user = {}) { return render(<MemoryRouter initialEntries={["/console/org/overview?env=production"]}><Routes><Route path="/console/*" element={<ConsoleSessionPolicy user={user}><p>Private console</p></ConsoleSessionPolicy>} /><Route path="/login" element={<Login />} /></Routes></MemoryRouter>); }
beforeEach(() => { clearAuthTokens(); jest.clearAllMocks(); controls = { start: jest.fn(), stop: jest.fn(), tick: jest.fn(), observe: jest.fn(), activity: jest.fn() }; createActivitySession.mockReturnValue(controls); });
test("signed out does not instantiate or start a session policy client", () => { fixture(null); expect(createActivitySession).not.toHaveBeenCalled(); });
test("expiry removes private content, clears memory credential and preserves full sign-in return path", () => { persistAuthTokens({ accessToken: jwt("one") }); fixture(); expect(controls.start).toHaveBeenCalledTimes(1); act(() => createActivitySession.mock.calls[0][0].onExpire()); expect(screen.queryByText("Private console")).not.toBeInTheDocument(); expect(screen.getByText("Sign in /console/org/overview?env=production")).toBeInTheDocument(); expect(controls.stop).toHaveBeenCalled(); });
test("credential identity change stops old controller and starts new; logout stops without request", () => { persistAuthTokens({ accessToken: jwt("one") }); fixture(); act(() => persistAuthTokens({ accessToken: jwt("two") })); expect(controls.stop).toHaveBeenCalledTimes(1); expect(createActivitySession).toHaveBeenCalledTimes(2); act(() => clearAuthTokens()); expect(controls.stop).toHaveBeenCalledTimes(2); });
test("warnings are accessible and never promise overall deadline extension", () => { persistAuthTokens({ accessToken: jwt("one") }); fixture(); act(() => createActivitySession.mock.calls[0][0].onChange({ warning: true })); expect(screen.getByRole("alert")).toHaveTextContent("overall session ends"); });

test("same mounted wrapper clears expired/warning state for a fresh different session", () => {
    persistAuthTokens({ accessToken: jwt("one") });
    const view = render(<MemoryRouter><ConsoleSessionPolicy user={{}}><p>Private console</p></ConsoleSessionPolicy></MemoryRouter>);
    act(() => createActivitySession.mock.calls[0][0].onChange({ warning: true }));
    expect(screen.getByRole("alert")).toBeInTheDocument();
    act(() => createActivitySession.mock.calls[0][0].onExpire());
    expect(screen.queryByText("Private console")).not.toBeInTheDocument();
    act(() => persistAuthTokens({ accessToken: jwt("two") }));
    expect(screen.getByText("Private console")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    view.unmount();
});
