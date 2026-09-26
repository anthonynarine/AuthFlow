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

// The four ways in are nodes, not edge labels: as labels, two parallel edges
// into the same box drew their labels on top of each other.
const TWO_UMBRELLAS = `flowchart LR
    classDef acct fill:#123029,stroke:#1abc9c,color:#e8eaed,stroke-width:2px
    classDef gait fill:#1b2129,stroke:#38bdf8,color:#e8eaed,stroke-width:2px
    classDef prod fill:#3a2016,stroke:#fb8a5c,color:#e8eaed,stroke-width:2px
    classDef way fill:#232a34,stroke:#5b6572,color:#e8eaed,stroke-width:1px
    classDef no fill:#3a1f24,stroke:#ff6b6b,color:#ffd6d6,stroke-width:2px,stroke-dasharray:6 4

    A["Gait account<br/>(anyone can register)<br/>= member of nothing"]:::acct
    A --> W1["creates a company<br/>→ its Owner"]:::way --> G["① Gait company<br/>e.g. app-one<br/>the security team"]:::gait
    A --> W2["Gait invite from an Owner/Admin<br/>+ verified email"]:::way --> G
    A --> W3["creates an org in the product<br/>→ its Owner"]:::way --> P["② Inside the product<br/>e.g. App One's customer org<br/>its end users"]:::prod
    A --> W4["the product's own invite<br/>from that org's Owner/Admin"]:::way --> P
    K["Connection key"]:::no -. "can't invite,<br/>never makes a member" .-> G`;

const SITES = `flowchart TB
    classDef org fill:#3a2016,stroke:#fb8a5c,color:#e8eaed,stroke-width:2px
    classDef site fill:#232a34,stroke:#1abc9c,color:#e8eaed,stroke-width:2px
    classDef shared fill:#1b2129,stroke:#38bdf8,color:#e8eaed,stroke-width:2px

    O["Example Clinic (one organization)<br/>Owner · organization-wide, sees every site<br/>only the Owner creates sites"]:::org
    subgraph M["Site: Main campus"]
        MA["Admin · other roles<br/>work in progress stays here"]:::site
    end
    subgraph S["Site: Northside satellite"]
        SA["Admin · other roles<br/>work in progress stays here"]:::site
    end
    F["Finished work<br/>visible across the whole organization"]:::shared
    O --> M
    O --> S
    M --> F
    S --> F`;

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

            <DocSection id="two-umbrellas" title="Who can be under your umbrella">
                <p>
                    There are two separate umbrellas, each with its own invites. In both, the only ways in are{" "}
                    <strong>creating the organization yourself</strong> or <strong>being invited by someone already
                    in it</strong>. The invite always comes from a <strong>person</strong> (an Owner or Admin), never
                    from an application or its connection key.
                </p>
                <Diagram
                    source={TWO_UMBRELLAS}
                    description="A Gait account, which anyone can register, is a member of nothing. It gets under umbrella one, a Gait company such as app-one (the security team), by creating the company and becoming its Owner, or through a Gait invite from an Owner or Admin plus a verified email. It gets under umbrella two, an organization inside the product such as App One's customer org (its end users), by creating that org in the product and becoming its Owner, or through the product's own invite from that org's Owner or Admin. A connection key can't invite and never makes anyone a member."
                />
                <p>
                    <strong>① The Gait company (the security team).</strong> The person who creates it becomes Owner,
                    no invite needed. Everyone else needs an invite from an Owner or Admin, and accepting takes the
                    emailed link, being signed in, and a verified email that matches (see{" "}
                    <a href="#joining-needs-proof">Joining needs proof</a>). Registering a Gait account puts you in no
                    company; an account sees nothing until an invite is accepted.
                </p>
                <p>
                    <strong>② Inside the product (its end users).</strong> Gait isn't involved; the product sets its
                    own rules. A product can work the same way as Gait: a customer's admin creates their organization
                    in the product and becomes its Owner, and everyone else only gets in through that organization's
                    invite link. Signing up on the product's page gives someone a Gait login but no organization; the
                    product shows them nothing until they're invited or create their own.
                </p>
                <p><strong>Two things that don't happen:</strong></p>
                <ul>
                    <li>
                        <strong>A connection key brings no one in.</strong> It can't invite and never makes anyone a
                        member; it only lets software report security checks.
                    </li>
                    <li>
                        <strong>Joining one umbrella doesn't put you in the other.</strong> A product invite doesn't add
                        someone to the Gait company, and a Gait company teammate gets no access to the product's
                        customer data.
                    </li>
                </ul>
                <p>
                    <strong>In short:</strong> an account says who you are; only an invite, or creating the
                    organization yourself, puts you under an umbrella.
                </p>
            </DocSection>

            <DocSection id="sites-inside-an-org" title="Sites inside an org">
                <p>
                    A product can split an organization further, for example into <strong>sites</strong> (some
                    products call them facilities): a customer's main campus and its satellite location are two sites
                    inside <strong>one</strong> organization. A site is not a second tenant; the organization is still
                    the only wall between customers. Gait knows nothing about sites; the product enforces all of it.
                </p>
                <Diagram
                    source={SITES}
                    description="Example Clinic is one organization. Its Owner is organization-wide, sees every site, and is the only one who creates sites. It has two sites, Main campus and Northside satellite; each has its own Admin and other roles, and work in progress stays at its site. Finished work from both sites is visible across the whole organization."
                />
                <p>One way a product can run sites:</p>
                <ul>
                    <li>
                        <strong>Owner is the only organization-wide role.</strong> Every other role is assigned to{" "}
                        <strong>exactly one</strong> site.
                    </li>
                    <li>
                        <strong>Joining a satellite:</strong> the invite names the site. The Owner can invite into any
                        site; a site's Admin can only invite into their own site and can't grant anything broader than
                        their own scope.
                    </li>
                    <li>
                        <strong>One site per person per organization.</strong> Someone who works at both sites has one
                        membership; the Owner moves them between sites rather than adding a second one.
                    </li>
                    <li>
                        <strong>What stays at the site:</strong> work in progress. <strong>What's shared:</strong>{" "}
                        finished work becomes visible across the organization.
                    </li>
                    <li>
                        <strong>Adding a second site to an existing organization:</strong> first pin existing members to
                        the original site, so people who joined before sites existed don't become organization-wide.
                    </li>
                </ul>
            </DocSection>

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
