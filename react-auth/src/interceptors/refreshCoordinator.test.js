/**
 * Refreshes must never overlap: Gait treats reuse of a rotated refresh
 * cookie as replay and revokes the session.
 */
function loadCoordinator(locks) {
    jest.resetModules();
    Object.defineProperty(global, "navigator", {
        value: locks ? { locks } : {},
        configurable: true,
        writable: true,
    });
    return require("./refreshCoordinator");
}

const createLockManager = () => {
    let queue = Promise.resolve();
    return {
        request: jest.fn((name, options, callback) => {
            const run = queue.then(() => callback());
            queue = run.then(() => undefined, () => undefined);
            return run;
        }),
    };
};

describe("refreshCoordinator", () => {
    test("concurrent callers in one tab share a single refresh under the browser lock", async () => {
        const locks = createLockManager();
        const { refreshWithBrowserCoordination } = loadCoordinator(locks);
        const action = jest.fn().mockResolvedValue("token-1");

        const results = await Promise.all([
            refreshWithBrowserCoordination(action),
            refreshWithBrowserCoordination(action),
            refreshWithBrowserCoordination(action),
        ]);

        expect(action).toHaveBeenCalledTimes(1);
        expect(locks.request).toHaveBeenCalledWith("gait-auth-refresh", { mode: "exclusive" }, expect.any(Function));
        expect(results).toEqual(["token-1", "token-1", "token-1"]);
    });

    test("a later refresh runs again once the previous one settled", async () => {
        const { refreshWithBrowserCoordination } = loadCoordinator(createLockManager());
        const action = jest.fn().mockResolvedValueOnce("token-1").mockResolvedValueOnce("token-2");

        expect(await refreshWithBrowserCoordination(action)).toBe("token-1");
        expect(await refreshWithBrowserCoordination(action)).toBe("token-2");
        expect(action).toHaveBeenCalledTimes(2);
    });

    test("a failed refresh does not wedge later attempts", async () => {
        const { refreshWithBrowserCoordination } = loadCoordinator(createLockManager());
        const action = jest.fn().mockRejectedValueOnce(new Error("no session")).mockResolvedValueOnce("token-2");

        await expect(refreshWithBrowserCoordination(action)).rejects.toThrow("no session");
        expect(await refreshWithBrowserCoordination(action)).toBe("token-2");
    });

    test("without navigator.locks the in-tab guarantee still holds", async () => {
        const { refreshWithBrowserCoordination } = loadCoordinator(null);
        const action = jest.fn().mockResolvedValue("token-1");

        await Promise.all([refreshWithBrowserCoordination(action), refreshWithBrowserCoordination(action)]);

        expect(action).toHaveBeenCalledTimes(1);
    });
});
