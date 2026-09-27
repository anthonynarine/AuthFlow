import { activitySentence } from "./activitySentence";

const row = (overrides) => ({
    actor_email: "ana@acme.test",
    target_email: "sam@acme.test",
    from_role: "",
    to_role: "",
    from_name: "",
    to_name: "",
    ...overrides,
});

test.each([
    [row({ action: "INVITE_CREATED", to_role: "ADMIN" }), "ana@acme.test invited sam@acme.test as Admin"],
    [row({ action: "INVITE_REVOKED" }), "ana@acme.test revoked the invite for sam@acme.test"],
    [row({ action: "INVITE_ACCEPTED", to_role: "MEMBER" }), "sam@acme.test joined as Member"],
    [row({ action: "ROLE_CHANGED", from_role: "MEMBER", to_role: "OWNER" }), "ana@acme.test changed sam@acme.test from Member to Owner"],
    [row({ action: "MEMBER_REMOVED" }), "ana@acme.test removed sam@acme.test"],
    [row({ action: "MEMBER_REMOVED", actor_email: "sam@acme.test" }), "sam@acme.test left the company"],
    [row({ action: "ORGANIZATION_RENAMED", target_email: "", from_name: "Acme", to_name: "Acme Inc" }), 'ana@acme.test renamed the company from "Acme" to "Acme Inc"'],
    [row({ action: "INVITE_CREATED", actor_email: null, to_role: "MEMBER" }), "a deleted account invited sam@acme.test as Member"],
    [row({ action: "MEMBER_REMOVED", actor_email: null }), "a deleted account removed sam@acme.test"],
])("%#: %s", (input, expected) => {
    expect(activitySentence(input)).toBe(expected);
});
