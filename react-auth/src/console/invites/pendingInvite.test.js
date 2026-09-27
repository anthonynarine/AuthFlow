// A stand-in for the cross-tab channel so "signed out in another tab" can be simulated.
let mockElsewhere = null;
jest.mock("../../interceptors/sessionEvents", () => ({
    SESSION_ENDED_EVENT: "gait:session-ended",
    onSignedOutElsewhere: (listener) => {
        mockElsewhere = listener;
        return () => {};
    },
}));

const store = require("./pendingInvite");

const TOKEN = "test-only-invite-token";
const inDays = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

function preview(expiresAt) {
    return { organization_name: "App One", organization_slug: "app-one", org_role: "ADMIN", invited_email: "b@example.test", expires_at: expiresAt };
}

beforeEach(() => {
    store.clearPendingInvite();
    window.localStorage.clear();
    window.sessionStorage.clear();
});

afterEach(() => {
    jest.useRealTimers();
});

test("holds the token in memory only", () => {
    store.setPendingToken(TOKEN);
    store.setPendingPreview(preview(inDays(3)));
    expect(store.getPendingInvite()).toMatchObject({ token: TOKEN, preview: { organization_slug: "app-one" } });
    expect(JSON.stringify({ ...window.localStorage, ...window.sessionStorage }) + document.cookie).not.toContain(TOKEN);
    expect(window.location.href).not.toContain(TOKEN);
});

test("forgets the invite when its own expiry passes", () => {
    jest.useFakeTimers();
    const reasons = [];
    const unsubscribe = store.subscribePendingInvite((invite, reason) => reasons.push(reason));
    store.setPendingToken(TOKEN);
    store.setPendingPreview(preview(new Date(Date.now() + 5000).toISOString()));
    jest.advanceTimersByTime(4000);
    expect(store.getPendingInvite()).not.toBeNull();
    jest.advanceTimersByTime(1500);
    expect(store.getPendingInvite()).toBeNull();
    expect(reasons).toContain("expired");
    unsubscribe();
});

test("an already-expired preview is dropped at once", () => {
    store.setPendingToken(TOKEN);
    store.setPendingPreview(preview(inDays(-1)));
    expect(store.getPendingInvite()).toBeNull();
});

test("any sign-out clears it: this tab, the session ending, or another tab", () => {
    store.setPendingToken(TOKEN);
    store.handleSignedOut();
    expect(store.getPendingInvite()).toBeNull();

    store.setPendingToken(TOKEN);
    window.dispatchEvent(new Event("gait:session-ended"));
    expect(store.getPendingInvite()).toBeNull();

    store.setPendingToken(TOKEN);
    mockElsewhere();
    expect(store.getPendingInvite()).toBeNull();
});

test("Switch account keeps it through exactly one sign-out", () => {
    store.setPendingToken(TOKEN);
    store.keepThroughNextSignOut();
    store.handleSignedOut();
    expect(store.getPendingInvite()).toMatchObject({ token: TOKEN });
    store.handleSignedOut();
    expect(store.getPendingInvite()).toBeNull();
});

test("a new link replaces the old token", () => {
    store.setPendingToken(TOKEN);
    store.setPendingToken(`${TOKEN}-2`);
    expect(store.getPendingInvite()).toEqual({ token: `${TOKEN}-2`, preview: null });
});
