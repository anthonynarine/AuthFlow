import React from "react";
import { Callout, DocLink, DocSection, StatusBadge } from "../components/DocPrimitives";

export default function ProductOrganizationsAndInvites() {
    return (
        <>
            <p className="doc-lede">
                When your product lets its users sign in with Gait, Gait tells your product <em>who</em> someone is.
                Which of your customers they belong to, and what they may do there, is yours to build. This guide
                describes a pattern that works, modelled on how Gait runs its own workspaces.
            </p>
            <p>
                Sign-in for your own product is <StatusBadge feature="productSignIn" />. Gait never stores or enforces
                anything on this page: it all lives in your product.
            </p>

            <DocSection id="two-umbrellas" title="Two umbrellas">
                <ul>
                    <li>
                        <strong>Your Gait workspace</strong> is for the people who look after your product's security.
                        They join through Gait's invites.
                    </li>
                    <li>
                        <strong>Organizations inside your product</strong> are your customers. Their staff join through
                        your product's invites.
                    </li>
                </ul>
                <p>
                    Joining one never puts anyone in the other, and a Gait account on its own belongs to neither. More:{" "}
                    <DocLink to="teams-roles-and-invites#two-umbrellas">Who can be under your umbrella</DocLink>.
                </p>
            </DocSection>

            <DocSection id="what-gait-gives-you" title="What Gait gives your product">
                <p>
                    On each request, gait-sdk hands your API a verified identity: a <strong>subject</strong> (a stable
                    id for the person: store it, don't parse it) and their <strong>email</strong>. See{" "}
                    <DocLink to="gait-sdk#verify-a-user">gait-sdk: Verify a user</DocLink>.
                </p>
                <p>It doesn't give you:</p>
                <ul>
                    <li>any organization or role: those are yours;</li>
                    <li>
                        <strong>whether the email is confirmed.</strong> Someone can sign in with a Gait account whose
                        email address they haven't confirmed yet. Design your invites with that in mind (below).
                    </li>
                </ul>
            </DocSection>

            <DocSection id="organizations-and-roles" title="Organizations and roles">
                <ul>
                    <li>
                        Store each organization, and a membership for each person in it: organization, the person's
                        Gait subject, and a role in your product (for example admin, editor, viewer).
                    </li>
                    <li>
                        On every request: verify the sign-in with gait-sdk, look up the membership for the organization
                        being asked about, check the role, and return that organization's data only. No membership
                        means nothing, exactly as if the organization didn't exist.
                    </li>
                    <li>
                        Keep at least one owner in every organization. Refuse the change that would remove the last one,
                        and take a lock on the organization while changing roles, so two changes at once can't both get
                        through.
                    </li>
                </ul>
            </DocSection>

            <DocSection id="invites" title="Invites">
                <p>What Gait does for its own workspace invites, and a good default for yours:</p>
                <ul>
                    <li>A long random token per invite. Store only a hash of it, never the token itself.</li>
                    <li>Each invite is for one organization, one email address and one role.</li>
                    <li>
                        Single use, and it expires (Gait's workspace invites last 7 days). Resending means revoking the
                        old invite and creating a new one.
                    </li>
                    <li>One pending invite per email address per organization.</li>
                    <li>
                        Put the token after <code>#</code> in the link, so it never reaches your server logs or other
                        sites.
                    </li>
                    <li>
                        Answer a used, expired, revoked or made-up token the same way, so nobody can probe which
                        invites exist.
                    </li>
                    <li>Only owners and admins invite; only owners can make someone an owner.</li>
                </ul>
            </DocSection>

            <DocSection id="joining" title="Joining: the link, and the email">
                <p>
                    <strong>Default: require the invite link, and a matching email.</strong> The person signs in with
                    Gait, opens the link, and your product checks the token and that the signed-in email is the one
                    invited. Show them which organization and role before they choose to join.
                </p>
                <Callout kind="warning" title="Treat the link like a password">
                    Your product can't tell whether the signed-in email is confirmed, so the token is what proves the
                    invite reached the right inbox. Anyone the link is forwarded to could use it with an account in that
                    name.
                </Callout>
                <p>
                    <strong>Joining without the link</strong> (listing someone's pending invites by email) is only safe
                    if your product confirms the email address itself. Gait offers it for workspaces because Gait
                    confirms every email before it can be used to join.
                </p>
            </DocSection>

            <DocSection id="sites" title="Sites inside an organization">
                <p>
                    If your customers have several locations, a site is a part of one organization, not a separate
                    customer. A layout that works: the owner is organization-wide and every other role belongs to one
                    site; an invite names its site; work in progress stays at its site and finished work is visible
                    across the organization. The full pattern, including the step before adding a second site:{" "}
                    <DocLink to="teams-roles-and-invites#sites-inside-an-org">Sites inside an org</DocLink>.
                </p>
            </DocSection>

            <DocSection id="keep-a-record" title="Keep a record">
                <p>
                    Log invites created, revoked and accepted, role changes and removals, in a log nothing can edit or
                    delete. Gait keeps one like it for every workspace.
                </p>
            </DocSection>

            <DocSection id="not-from-gait" title="What Gait doesn't do here">
                <ul>
                    <li>Store or enforce your organizations, roles, invites or sites.</li>
                    <li>
                        Tell you whether a user's email is confirmed (above).
                    </li>
                    <li>
                        Host the sign-in page for you, or issue tokens tied to your application: both are planned. See{" "}
                        <DocLink to="isolation#planned">Planned</DocLink>.
                    </li>
                </ul>
            </DocSection>
        </>
    );
}
