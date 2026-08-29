const createLockManager = () => {
    let queue = Promise.resolve();

    return {
        request: jest.fn((name, options, callback) => {
            const run = queue.then(() => callback());
            queue = run.then(
                () => undefined,
                () => undefined
            );
            return run;
        }),
    };
};

function loadCoordinator({
    accessToken = "access-1",
    refreshToken = "refresh-1",
    supported = true,
} = {}) {
    jest.resetModules();

    let currentAccessToken = accessToken;
    let currentRefreshToken = refreshToken;

    jest.doMock("./tokenStorage", () => ({
        getAccessToken: jest.fn(() => currentAccessToken),
        getRefreshToken: jest.fn(() => currentRefreshToken),
        clearAuthTokens: jest.fn(),
        persistAuthTokens: jest.fn(),
        isProduction: false,
    }));

    if (supported) {
        Object.defineProperty(global, "navigator", {
            value: { locks: createLockManager() },
            configurable: true,
            writable: true,
        });
    } else {
        Object.defineProperty(global, "navigator", {
            value: {},
            configurable: true,
            writable: true,
        });
    }

    const coordinator = require("./refreshCoordinator");

    return {
        ...coordinator,
        setAccessToken(value) {
            currentAccessToken = value;
        },
        setRefreshToken(value) {
            currentRefreshToken = value;
        },
    };
}

describe("refreshCoordinator", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("skips refresh when another tab already rotated the access token", async () => {
        const coordinator = loadCoordinator();
        const refreshAction = jest.fn(async () => ({
            accessToken: "access-2",
            refreshToken: "refresh-2",
        }));

        const first = coordinator.refreshWithBrowserCoordination({
            failedAccessToken: "access-1",
            refreshAction: async (context) => {
                coordinator.setAccessToken("access-2");
                coordinator.setRefreshToken("refresh-2");
                return refreshAction(context);
            },
        });
        const second = coordinator.refreshWithBrowserCoordination({
            failedAccessToken: "access-1",
            refreshAction,
        });

        const [firstResult, secondResult] = await Promise.all([first, second]);

        expect(refreshAction).toHaveBeenCalledTimes(1);
        expect(firstResult).toEqual({
            accessToken: "access-2",
            refreshToken: "refresh-2",
            rotated: true,
        });
        expect(secondResult).toEqual({
            accessToken: "access-2",
            refreshToken: "refresh-2",
            rotated: false,
        });
    });

    test("fails closed when browser-wide coordination is unavailable", async () => {
        const coordinator = loadCoordinator({ supported: false });

        await expect(
            coordinator.refreshWithBrowserCoordination({
                failedAccessToken: "access-1",
                refreshAction: jest.fn(),
            })
        ).rejects.toThrow("Browser refresh coordination is unavailable.");
    });
});
