import "@testing-library/jest-dom";
import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConsoleLayout } from "../../layout/ConsoleLayout";
import { MembersPage } from "./MembersPage";
import { SettingsPage } from "../settings/SettingsPage";
import {
    changeMemberRole,
    createInvite,
    fetchMemberActivity,
    fetchMembers,
    fetchMyOrganizations,
    fetchOrganization,
    removeMember,
    renameOrganization,
    revokeInvite,
} from "../../api/consoleApi";

jest.mock("../../../account/emailVerificationApi", () => ({ verifyEmailToken: jest.fn(), resendVerificationEmail: jest.fn() }));
jest.mock("../../../context/auth/BasicAuthContext", () => ({
    useBasicAuthServices: () => ({ user: { email: "ana@app-one.test", email_verified: true }, isLoggedIn: true, logout: () => Promise.resolve() }),
}));
jest.mock("../../../context/auth/UserSessionContext", () => ({
    useUserSessionServices: () => ({ validateSession: () => Promise.resolve() }),
}));
jest.mock("../../api/consoleApi", () => ({
    fetchMyOrganizations: jest.fn(),
    fetchMembers: jest.fn(),
    fetchMemberActivity: jest.fn(),
    changeMemberRole: jest.fn(),
    removeMember: jest.fn(),
    createInvite: jest.fn(),
    revokeInvite: jest.fn(),
    fetchOrganization: jest.fn(),
    renameOrganization: jest.fn(),
}));

const inDays = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000 - 60000).toISOString();

function member(id, role, overrides = {}) {
    return {
        membership_id: id,
        user_id: `u-${id}`,
        email: `${id}@app-one.test`,
        first_name: id[0].toUpperCase() + id.slice(1),
        last_name: "",
        org_role: role,
        joined_at: "2026-09-01T10:00:00Z",
        is_you: false,
        ...overrides,
    };
}

function roster(yourRole, { owners = 1 } = {}) {
    const you = member("ana", yourRole, { is_you: true });
    const others = [member("olga", "OWNER"), member("adam", "ADMIN"), member("mia", "MEMBER")];
    if (owners === 1 && yourRole === "OWNER") others.shift();
    return {
        your_role: yourRole,
        members: [you, ...others],
        invites: [
            { id: "i1", email: "new@app-one.test", org_role: "MEMBER", invited_by_email: "ana@app-one.test", created_at: "2026-09-25T10:00:00Z", expires_at: inDays(6) },
            { id: "i2", email: "boss@app-one.test", org_role: "OWNER", invited_by_email: null, created_at: "2026-09-25T10:00:00Z", expires_at: inDays(1) },
        ],
    };
}

function LocationProbe() {
    const location = useLocation();
    return <div data-testid="location">{location.pathname}</div>;
}

function renderAt(path, role = "OWNER", state) {
    fetchMyOrganizations.mockResolvedValue([{ id: "1", name: "App One", slug: "app-one", org_role: role, membership_status: "ACTIVE" }]);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
        <QueryClientProvider client={client}>
            <MemoryRouter initialEntries={[{ pathname: path, state }]}>
                <Routes>
                    <Route path="/console" element={<p>Console entry</p>} />
                    <Route path="/console/:orgSlug" element={<ConsoleLayout />}>
                        <Route path="overview" element={<p>Overview body</p>} />
                        <Route path="members" element={<MembersPage />} />
                        <Route path="settings" element={<SettingsPage />} />
                    </Route>
                </Routes>
                <LocationProbe />
            </MemoryRouter>
        </QueryClientProvider>
    );
    return client;
}

async function membersTable() {
    return screen.findByRole("table", { name: "Members of App One" });
}

function rowFor(table, email) {
    return within(table).getAllByRole("row").find((row) => row.textContent.includes(email));
}

beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    fetchMemberActivity.mockResolvedValue({ count: 0, page: 1, page_size: 20, results: [] });
});

describe("F4 members list and role gating", () => {
    test("shows name, email, role, joined date and marks you", async () => {
        fetchMembers.mockResolvedValue(roster("OWNER", { owners: 2 }));
        renderAt("/console/app-one/members");
        const table = await membersTable();
        const you = rowFor(table, "ana@app-one.test");
        expect(you).toHaveTextContent("Ana");
        expect(you).toHaveTextContent("You");
        expect(you).toHaveTextContent("Owner");
        expect(you).toHaveTextContent("2026");
        expect(within(you).queryByRole("button", { name: /Remove/ })).not.toBeInTheDocument();
        expect(fetchMembers).toHaveBeenCalledWith("app-one");
    });

    test("Owner: can change and remove anyone else, including Owners, and manage every invite", async () => {
        fetchMembers.mockResolvedValue(roster("OWNER", { owners: 2 }));
        renderAt("/console/app-one/members");
        const table = await membersTable();
        for (const name of ["Olga", "Adam", "Mia"]) {
            expect(within(table).getByRole("button", { name: `Change role for ${name}` })).toBeInTheDocument();
            expect(within(table).getByRole("button", { name: `Remove ${name}` })).toBeInTheDocument();
        }
        const invites = screen.getByRole("table", { name: "Pending invites" });
        expect(within(invites).getByRole("button", { name: "Revoke invite for boss@app-one.test" })).toBeInTheDocument();
        expect(rowFor(invites, "new@app-one.test")).toHaveTextContent("in 6 days");
        expect(rowFor(invites, "boss@app-one.test")).toHaveTextContent("in 1 day");
        expect(rowFor(invites, "boss@app-one.test")).toHaveTextContent("a deleted account");
        expect(screen.getByRole("button", { name: "Invite someone" })).toBeInTheDocument();
    });

    test("Admin: can't touch Owners or Owner invites, and isn't offered Owner", async () => {
        fetchMembers.mockResolvedValue(roster("ADMIN"));
        renderAt("/console/app-one/members", "ADMIN");
        const table = await membersTable();
        expect(within(table).queryByRole("button", { name: "Change role for Olga" })).not.toBeInTheDocument();
        expect(within(table).queryByRole("button", { name: "Remove Olga" })).not.toBeInTheDocument();
        expect(within(table).getByRole("button", { name: "Remove Mia" })).toBeInTheDocument();

        const invites = screen.getByRole("table", { name: "Pending invites" });
        expect(rowFor(invites, "boss@app-one.test")).toHaveTextContent("Owners only");
        expect(within(invites).getByRole("button", { name: "Resend invite to new@app-one.test" })).toBeInTheDocument();

        fireEvent.click(within(table).getByRole("button", { name: "Change role for Mia" }));
        const dialog = screen.getByRole("dialog");
        expect(within(dialog).queryByRole("radio", { name: /^Owner/ })).not.toBeInTheDocument();
        expect(within(dialog).getAllByRole("radio")).toHaveLength(2);
        fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));

        fireEvent.click(screen.getByRole("button", { name: "Invite someone" }));
        expect(within(screen.getByRole("dialog")).queryByRole("radio", { name: /^Owner/ })).not.toBeInTheDocument();
    });

    test("Member: read-only list, no invites or activity, can still leave", async () => {
        fetchMembers.mockResolvedValue({ ...roster("MEMBER"), invites: [] });
        renderAt("/console/app-one/members", "MEMBER");
        const table = await membersTable();
        expect(within(table).queryByRole("button")).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Invite someone" })).not.toBeInTheDocument();
        expect(screen.queryByText("Pending invites")).not.toBeInTheDocument();
        expect(screen.queryByText("Activity")).not.toBeInTheDocument();
        expect(fetchMemberActivity).not.toHaveBeenCalled();
        expect(screen.getByRole("button", { name: "Leave company" })).toBeInTheDocument();
    });

    test("an Owner changes a role, and Gait's LAST_OWNER refusal explains how to hand over", async () => {
        fetchMembers.mockResolvedValue(roster("OWNER", { owners: 2 }));
        changeMemberRole.mockRejectedValue({ response: { status: 409, data: { code: "LAST_OWNER", detail: "x" } } });
        renderAt("/console/app-one/members");
        fireEvent.click(within(await membersTable()).getByRole("button", { name: "Change role for Olga" }));
        const dialog = screen.getByRole("dialog");
        fireEvent.click(within(dialog).getByRole("radio", { name: /^Admin/ }));
        fireEvent.click(within(dialog).getByRole("button", { name: "Save role" }));
        expect(await within(dialog).findByRole("alert")).toHaveTextContent("Make someone else an Owner first");
        expect(changeMemberRole).toHaveBeenCalledWith("app-one", "olga", "ADMIN");
    });

    test("demoting the only Owner is explained before it's attempted", async () => {
        fetchMembers.mockResolvedValue(roster("OWNER"));
        renderAt("/console/app-one/members");
        await membersTable();
        expect(screen.getByRole("button", { name: "Change role for Ana" })).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Change role for Ana" }));
        const dialog = screen.getByRole("dialog");
        fireEvent.click(within(dialog).getByRole("radio", { name: /^Member/ }));
        expect(within(dialog).getByRole("note")).toHaveTextContent("A company always keeps at least one Owner");
        expect(within(dialog).getByRole("button", { name: "Save role" })).toBeDisabled();
    });

    test("removing someone calls Gait with their membership", async () => {
        fetchMembers.mockResolvedValue(roster("OWNER"));
        removeMember.mockResolvedValue(undefined);
        renderAt("/console/app-one/members");
        fireEvent.click(within(await membersTable()).getByRole("button", { name: "Remove Mia" }));
        const dialog = screen.getByRole("dialog", { name: "Remove Mia from App One?" });
        fireEvent.click(within(dialog).getByRole("button", { name: "Remove" }));
        await waitFor(() => expect(removeMember).toHaveBeenCalledWith("app-one", "mia"));
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });
});

describe("F4 leaving", () => {
    test("the last Owner is told why they can't leave, and nothing is sent", async () => {
        fetchMembers.mockResolvedValue(roster("OWNER"));
        renderAt("/console/app-one/members");
        await membersTable();
        fireEvent.click(screen.getByRole("button", { name: "Leave company" }));
        const dialog = screen.getByRole("dialog", { name: "You can't leave App One yet" });
        expect(dialog).toHaveTextContent("You're its only Owner");
        expect(within(dialog).queryByRole("button", { name: /Leave/ })).not.toBeInTheDocument();
        expect(removeMember).not.toHaveBeenCalled();
    });

    test("anyone else confirms by the company's name and lands on the console entry", async () => {
        fetchMembers.mockResolvedValue(roster("ADMIN"));
        removeMember.mockResolvedValue(undefined);
        renderAt("/console/app-one/members", "ADMIN");
        await membersTable();
        fireEvent.click(screen.getByRole("button", { name: "Leave company" }));
        fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Leave App One" }));
        await waitFor(() => expect(removeMember).toHaveBeenCalledWith("app-one", "ana"));
        await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent(/^\/console$/));
    });
});

describe("F4 invites", () => {
    test("inviting validates the email, offers role descriptions and says the email went out, never the link", async () => {
        fetchMembers.mockResolvedValue(roster("OWNER"));
        createInvite.mockResolvedValue({ id: "i3", email: "sam@app-one.test", org_role: "ADMIN", email_sent: true, expires_at: inDays(7) });
        renderAt("/console/app-one/members");
        await membersTable();
        fireEvent.click(screen.getByRole("button", { name: "Invite someone" }));
        const dialog = screen.getByRole("dialog", { name: "Invite someone" });
        expect(within(dialog).getAllByRole("radio")).toHaveLength(3);
        expect(dialog).toHaveTextContent("Manages applications, keys, findings and people, except Owners.");

        fireEvent.change(within(dialog).getByLabelText("Email address"), { target: { value: "not-an-email" } });
        fireEvent.click(within(dialog).getByRole("button", { name: "Send invite" }));
        expect(await within(dialog).findByText("That doesn't look like an email address.")).toBeInTheDocument();
        expect(createInvite).not.toHaveBeenCalled();

        fireEvent.change(within(dialog).getByLabelText("Email address"), { target: { value: "sam@app-one.test" } });
        fireEvent.click(within(dialog).getByRole("radio", { name: /^Admin/ }));
        fireEvent.click(within(dialog).getByRole("button", { name: "Send invite" }));
        const done = await screen.findByRole("dialog", { name: "Invite sent" });
        expect(done).toHaveTextContent("sam@app-one.test");
        expect(done).not.toHaveTextContent(/token|#/);
        expect(createInvite).toHaveBeenCalledWith("app-one", { email: "sam@app-one.test", orgRole: "ADMIN" });
    });

    test("when Gait couldn't send the email, the dialog says so", async () => {
        fetchMembers.mockResolvedValue(roster("OWNER"));
        createInvite.mockResolvedValue({ id: "i3", email: "sam@app-one.test", org_role: "MEMBER", email_sent: false });
        renderAt("/console/app-one/members");
        await membersTable();
        fireEvent.click(screen.getByRole("button", { name: "Invite someone" }));
        fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "sam@app-one.test" } });
        fireEvent.click(screen.getByRole("button", { name: "Send invite" }));
        expect(await screen.findByRole("dialog", { name: "Invite created, but the email didn't go out" })).toBeInTheDocument();
    });

    test("Gait refusing an Owner invite from an Admin is shown in plain words", async () => {
        fetchMembers.mockResolvedValue(roster("ADMIN"));
        createInvite.mockRejectedValue({ response: { status: 403, data: { code: "OWNER_REQUIRED", detail: "Only Owners can invite Owners." } } });
        renderAt("/console/app-one/members", "ADMIN");
        await membersTable();
        fireEvent.click(screen.getByRole("button", { name: "Invite someone" }));
        fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "sam@app-one.test" } });
        fireEvent.click(screen.getByRole("button", { name: "Send invite" }));
        expect(await screen.findByRole("alert")).toHaveTextContent("Only Owners can give someone the Owner role");
    });

    test("Resend revokes then recreates, and says the old link stops working", async () => {
        fetchMembers.mockResolvedValue(roster("OWNER"));
        revokeInvite.mockResolvedValue(undefined);
        createInvite.mockResolvedValue({ id: "i9", email: "new@app-one.test", org_role: "MEMBER", email_sent: true });
        renderAt("/console/app-one/members");
        await membersTable();
        fireEvent.click(screen.getByRole("button", { name: "Resend invite to new@app-one.test" }));
        const dialog = screen.getByRole("dialog");
        expect(dialog).toHaveTextContent("the link they already have stops working");
        fireEvent.click(within(dialog).getByRole("button", { name: "Send a new link" }));
        const done = await screen.findByRole("dialog", { name: "New invite sent" });
        expect(done).toHaveTextContent("The old one no longer works.");
        expect(revokeInvite).toHaveBeenCalledWith("app-one", "i1");
        expect(createInvite).toHaveBeenCalledWith("app-one", { email: "new@app-one.test", orgRole: "MEMBER" });
        expect(revokeInvite.mock.invocationCallOrder[0]).toBeLessThan(createInvite.mock.invocationCallOrder[0]);
    });

    test("Revoke confirms, then calls Gait", async () => {
        fetchMembers.mockResolvedValue(roster("OWNER"));
        revokeInvite.mockResolvedValue(undefined);
        renderAt("/console/app-one/members");
        await membersTable();
        fireEvent.click(screen.getByRole("button", { name: "Revoke invite for new@app-one.test" }));
        fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Revoke invite" }));
        await waitFor(() => expect(revokeInvite).toHaveBeenCalledWith("app-one", "i1"));
    });
});

describe("F4 activity", () => {
    test("plain sentences, paginated", async () => {
        fetchMembers.mockResolvedValue(roster("OWNER"));
        fetchMemberActivity.mockImplementation((slug, { page }) =>
            Promise.resolve({
                count: 25,
                page,
                page_size: 20,
                results:
                    page === 1
                        ? [
                              { id: "a1", action: "MEMBER_REMOVED", actor_email: "mia@app-one.test", target_email: "mia@app-one.test", created_at: "2026-09-26T10:00:00Z" },
                              { id: "a2", action: "INVITE_CREATED", actor_email: null, target_email: "new@app-one.test", to_role: "MEMBER", created_at: "2026-09-25T10:00:00Z" },
                          ]
                        : [{ id: "a3", action: "ROLE_CHANGED", actor_email: "ana@app-one.test", target_email: "adam@app-one.test", from_role: "MEMBER", to_role: "ADMIN", created_at: "2026-09-20T10:00:00Z" }],
            })
        );
        renderAt("/console/app-one/members");
        const list = await screen.findByRole("list", { name: "Membership activity" });
        expect(list).toHaveTextContent("mia@app-one.test left the company");
        expect(list).toHaveTextContent("a deleted account invited new@app-one.test as Member");
        expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Older" }));
        expect(await screen.findByText("ana@app-one.test changed adam@app-one.test from Member to Admin")).toBeInTheDocument();
        expect(fetchMemberActivity).toHaveBeenLastCalledWith("app-one", { page: 2, pageSize: 20 });
    });
});

describe("F4 settings", () => {
    const ORG = { id: "1", name: "App One", slug: "app-one", status: "ACTIVE", created_at: "2026-09-01T10:00:00Z" };

    test("Owners rename the company; the slug can't be changed", async () => {
        fetchOrganization.mockResolvedValue({ ...ORG, your_role: "OWNER" });
        renderOrganizationRename();
        renderAt("/console/app-one/settings");
        const input = await screen.findByLabelText("Company name");
        expect(screen.getByRole("button", { name: "Save name" })).toBeDisabled();
        expect(screen.getByText("app-one")).toBeInTheDocument();
        expect(screen.getByText(/The slug can't be changed/)).toBeInTheDocument();
        fireEvent.change(input, { target: { value: "   " } });
        expect(screen.getByText("Give the company a name.")).toBeInTheDocument();
        fireEvent.change(input, { target: { value: "  App One Health  " } });
        fireEvent.click(screen.getByRole("button", { name: "Save name" }));
        await waitFor(() => expect(renameOrganization).toHaveBeenCalledWith("app-one", "App One Health"));
        expect(await screen.findByText("Saved.")).toBeInTheDocument();
    });

    test.each(["ADMIN", "MEMBER"])("%s sees the settings read-only", async (role) => {
        fetchOrganization.mockResolvedValue({ ...ORG, your_role: role });
        renderAt("/console/app-one/settings", role);
        expect(await screen.findByText("Only Owners can rename the company.", { exact: false })).toBeInTheDocument();
        expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Save name" })).not.toBeInTheDocument();
    });

    function renderOrganizationRename() {
        renameOrganization.mockImplementation((slug, name) => Promise.resolve({ ...ORG, name, your_role: "OWNER" }));
    }
});

describe("F4 welcome note", () => {
    test("after joining, a one-time welcome names the company and role", async () => {
        renderAt("/console/app-one/overview", "ADMIN", { welcome: { company: "App One", role: "ADMIN" } });
        const welcome = "Welcome to App One. You're an Admin here.";
        expect(await screen.findByText((_, element) => element.textContent === welcome)).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: /Dismiss/ }));
        expect(screen.queryByText("Welcome to App One.")).not.toBeInTheDocument();
    });
});
