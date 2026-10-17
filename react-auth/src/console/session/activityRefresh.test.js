// Real authenticated Axios interceptors; only network adapter and cross-tab lock
// transport are replaced. An access-token expiry does not end its live session.
jest.mock("../../interceptors/refreshCoordinator", () => ({ refreshWithBrowserCoordination: (callback) => callback() }));
const jwt = (sid, exp) => `x.${btoa(JSON.stringify({ sid, sub: "u", aud: "console", exp }))}.x`;
const status = (sid, generation = 0) => ({ sid, aud: "console", policy_enabled: true, activity_generation: generation, server_time: "2026-10-17T00:00:00Z", idle_expires_at: "2026-10-17T01:00:00Z", overall_expires_at: "2026-10-18T00:00:00Z" });
test.each(["same", "different"])("expired 15-minute access token refreshes observationally with %s sid and never replays activity", async (kind) => {
    jest.resetModules();
    const axios = require("axios");
    const oldToken = jwt("one", 900), newToken = jwt(kind === "same" ? "one" : "two", 1800);
    let oldExpired = false, time = 0;
    const calls = [];
    axios.defaults.adapter = async (config) => {
        calls.push({ url: config.url, body: config.data, authorization: config.headers.Authorization });
        const response = { status: 200, data: {}, headers: {}, config };
        if (config.url === "/auth/refresh/") return { ...response, data: { access_token: newToken } };
        if (oldExpired && config.headers.Authorization === `Bearer ${oldToken}`) {
            throw Object.assign(new Error("access expired"), { config, response: { ...response, status: 401 } });
        }
        return { ...response, data: { ...status(kind === "different" && oldExpired ? "two" : "one", config.method === "post" ? 1 : 0), server_time: new Date(Date.parse("2026-10-17T00:00:00Z") + time).toISOString() } };
    };
    const { persistAuthTokens, getAccessToken } = require("../../interceptors/tokenStorage");
    const { createActivitySession } = require("./activitySession");
    persistAuthTokens({ accessToken: oldToken });
    const expire = jest.fn(), change = jest.fn();
    const client = createActivitySession({ token: getAccessToken, now: () => time, onExpire: expire, onChange: change });
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
    await client.start();
    time = 900000; oldExpired = true; change.mockClear();
    await client.activity({ isTrusted: true });
    expect(calls.filter((c) => c.url === "/auth/session/activity/")).toHaveLength(1);
    expect(calls.filter((c) => c.url === "/auth/refresh/")).toHaveLength(1);
    expect(expire).not.toHaveBeenCalled();
    expect(getAccessToken()).toBe(newToken);
    change.mockClear();
    time = 3599999;
    client.tick();
    expect(expire).not.toHaveBeenCalled();
    await client.activity({ isTrusted: true });
    const activities = calls.filter((c) => c.url === "/auth/session/activity/");
    expect(activities).toHaveLength(kind === "same" ? 2 : 1);
    expect(activities[activities.length - 1].authorization).toBe(`Bearer ${kind === "same" ? newToken : oldToken}`);
    expect(change.mock.calls.length > 0).toBe(kind === "same");
});
