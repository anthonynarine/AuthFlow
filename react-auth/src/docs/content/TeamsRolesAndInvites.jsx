import React from "react";
import { Callout, DocLink, DocSection, DocTable } from "../components/DocPrimitives";
import { Diagram } from "../components/Diagram";

const INVITE_FLOW = `sequenceDiagram
    autonumber
    actor A as Owner or Admin
    participant G as Gait
    actor T as Teammate

    A->>G: Invite teammate@acme.example as Admin
    G-->>T: Email with a one-time link (expires in 7 days)
    T->>G: Open the link
    G-->>T: "Acme invited you as Admin"
    T->>G: Sign in with the invited email
    T->>G: Choose Join
    G-->>T: You're an Admin of Acme`;

const CHECK = "✓";

function Yes() {
    return <span aria-label="Yes">{CHECK}</span>;
}

function No() {
    return <span aria-label="No" className="doc-muted">–</span>;
}

export default function TeamsRolesAndInvites() {
    return (
        <>
            <p className="doc-lede">
                Who can do what in your company, and how someone joins it. Every person has one role per company:
                Owner, Admin or Member.
            </p>

            <DocSection id="roles" title="Roles">
                <DocTable caption="What each role can do">
                    <thead>
                        <tr>
                            <th scope="col">Action</th>
                            <th scope="col">Owner</th>
                            <th scope="col">Admin</th>
                            <th scope="col">Member</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <th scope="row">See the company's applications, security and members</th>
                            <td><Yes /></td><td><Yes /></td><td><Yes /></td>
                        </tr>
                        <tr>
                            <th scope="row">Add, rename, suspend applications</th>
                            <td><Yes /></td><td><Yes /></td><td><No /></td>
                        </tr>
                        <tr>
                            <th scope="row">Issue, list and revoke connection keys</th>
                            <td><Yes /></td><td><Yes /></td><td><No /></td>
                        </tr>
                        <tr>
                            <th scope="row">Acknowledge or accept the risk of a finding</th>
                            <td><Yes /></td><td><Yes /></td><td><No /></td>
                        </tr>
                        <tr>
                            <th scope="row">Invite people as Member or Admin</th>
                            <td><Yes /></td><td><Yes /></td><td><No /></td>
                        </tr>
                        <tr>
                            <th scope="row">See and revoke pending invites</th>
                            <td><Yes /></td><td>Yes, but can't revoke Owner invites</td><td><No /></td>
                        </tr>
                        <tr>
                            <th scope="row">Change roles, remove members</th>
                            <td><Yes /></td><td>Yes, except Owners</td><td><No /></td>
                        </tr>
                        <tr>
                            <th scope="row">Invite or make someone an Owner; change or remove an Owner</th>
                            <td><Yes /></td><td><No /></td><td><No /></td>
                        </tr>
                        <tr>
                            <th scope="row">Retire an application (permanent)</th>
                            <td><Yes /></td><td><No /></td><td><No /></td>
                        </tr>
                        <tr>
                            <th scope="row">Leave the company</th>
                            <td>Yes, unless the last Owner</td><td><Yes /></td><td><Yes /></td>
                        </tr>
                    </tbody>
                </DocTable>
                <p>
                    A company always keeps at least one Owner. The last Owner can't leave or step down until someone
                    else has been made an Owner.
                </p>
            </DocSection>

            <DocSection id="inviting-your-team" title="Inviting your team">
                <Diagram
                    source={INVITE_FLOW}
                    description="An Owner or Admin invites a teammate by email and picks a role. Gait emails the teammate a one-time link that expires in 7 days. The teammate opens it, sees which company invited them and as what role, signs in with the invited email address, and chooses Join."
                />
                <ol>
                    <li>An Owner or Admin invites a teammate by email and picks their role.</li>
                    <li>
                        The teammate gets an email with a link. It works <strong>once</strong> and expires after{" "}
                        <strong>7 days</strong>.
                    </li>
                    <li>
                        They sign in, or create a Gait account, <strong>with the invited email address</strong>, then
                        choose <strong>Join</strong>.
                    </li>
                </ol>
                <p>
                    There's one pending invite per company and email address. To resend, revoke the invite and send a
                    new one; the old link stops working.
                </p>
            </DocSection>

            <DocSection id="joining-needs-proof" title="Joining needs proof">
                <p>Joining a company needs three things together:</p>
                <ol>
                    <li>the invite link,</li>
                    <li>being signed in, and</li>
                    <li>a confirmed email address that matches the invite.</li>
                </ol>
                <p>
                    Any one alone is useless. A forwarded link gets nothing, and neither does an account someone else
                    created with your email address.
                </p>
                <ul>
                    <li><strong>Joining is always your choice.</strong> Opening a link never joins you on its own.</li>
                    <li>
                        <strong>The secret stays out of logs.</strong> The secret part of an invite link comes after the{" "}
                        <code>#</code>, so browsers never send it to any server, and Gait stores only a fingerprint of
                        it.
                    </li>
                    <li>
                        <strong>Every membership change is recorded</strong>: invited, revoked, joined, role changed,
                        removed and left.
                    </li>
                </ul>
            </DocSection>

            <DocSection id="what-the-invite-page-shows" title="What the invite page shows">
                <DocTable caption="Invite page messages">
                    <thead>
                        <tr>
                            <th scope="col">You see</th>
                            <th scope="col">What it means</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <th scope="row">"This invite can't be used"</th>
                            <td>
                                The link was already used, revoked or expired, or is wrong. Ask whoever invited you for
                                a new one. Gait deliberately doesn't say which.
                            </td>
                        </tr>
                        <tr>
                            <th scope="row">"Acme invited you as Admin", with Sign in / Create account</th>
                            <td>You're not signed in. You come back to the same invite afterwards.</td>
                        </tr>
                        <tr>
                            <th scope="row">"You're signed in as … This invite is for …"</th>
                            <td>You're signed in with a different email. Switch account.</td>
                        </tr>
                        <tr>
                            <th scope="row">"Confirm your email first"</th>
                            <td>Your account's email isn't confirmed yet. Use the link Gait sent, or resend it.</td>
                        </tr>
                        <tr>
                            <th scope="row">"Go to Acme"</th>
                            <td>You're already a member.</td>
                        </tr>
                        <tr>
                            <th scope="row">"Join Acme" with the role and who invited you</th>
                            <td>Everything checks out. Choose Join to become a member.</td>
                        </tr>
                    </tbody>
                </DocTable>
            </DocSection>

            <DocSection id="your-data-stays-yours" title="Your data stays yours">
                <ul>
                    <li>
                        Everything in your company (applications, keys, findings, evidence, members) is visible only to
                        your company's members.
                    </li>
                    <li>
                        Links to another company's pages don't work for you, even if you guess the address. You'll see
                        "This doesn't exist, or you don't have access to it".
                    </li>
                    <li>The console always shows which company you're in and your role there.</li>
                </ul>
            </DocSection>

            <DocSection id="availability" title="What works today">
                <Callout kind="availability">
                    <p>
                        The console's <strong>Members</strong> screen and the <strong>invite page</strong> are being
                        built, and email confirmation is rolling out. Until they ship, there's no console screen for
                        sending an invite, and an invite link can't be accepted in the console yet.
                    </p>
                    <p>
                        Roles, last-Owner protection and the membership history already apply today. See also{" "}
                        <DocLink to="troubleshooting#joining-and-access">Troubleshooting</DocLink>.
                    </p>
                </Callout>
            </DocSection>
        </>
    );
}
