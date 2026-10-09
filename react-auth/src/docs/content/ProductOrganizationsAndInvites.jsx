import React from "react";
import { Callout, DocLink, DocSection, StatusBadge } from "../components/DocPrimitives";

export default function ProductOrganizationsAndInvites() {
    return (
        <>
            <p className="doc-lede">
                When an app of mine lets its users sign in with Gait, as Lumen does, Gait tells the app{" "}
                <em>who</em> someone is. Which of the app's organizations they belong to, and what they may do there,
                is the app's to build. This guide describes a pattern that works, modelled on how Gait runs its own
                workspaces.
            </p>
            <p>
                Sign-in for an app's own users is <StatusBadge feature="productSignIn" />. Gait never stores or
                enforces anything on this page: it all lives in the app.
            </p>

            <DocSection id="two-umbrellas" title="Two umbrellas">
                <ul>
                    <li>
                        <strong>The app's Gait workspace</strong> is for the people who look after the app's security.
                        They join through Gait's invites.
                    </li>
                    <li>
                        <strong>Organizations inside the app</strong> are the groups that use it. Their staff join
                        through the app's own invites.
                    </li>
                </ul>
                <p>
                    Joining one never puts anyone in the other, and a Gait account on its own belongs to neither. More:{" "}
                    <DocLink to="teams-roles-and-invites#two-umbrellas">Who can be under an umbrella</DocLink>.
                </p>
            </DocSection>

            <DocSection id="what-gait-gives-you" title="What Gait gives the app">
                <p>
                    On each request, gait-sdk hands the app's API a verified identity: a <strong>subject</strong> (a stable
                    id for the person: store it, don't parse it) and their <strong>email</strong>. See{" "}
                    <DocLink to="add-gait-sign-in">Add Gait sign-in to an app</DocLink>.
                </p>
                <p>It doesn't give the app:</p>
                <ul>
                    <li>any organization or role: those are the app's;</li>
                    <li>
                        <strong>whether the email is confirmed.</strong> Someone can sign in with a Gait account whose
                        email address they haven't confirmed yet. Design the app's invites with that in mind (below).
                    </li>
                </ul>
            </DocSection>

            <DocSection id="organizations-and-roles" title="Organizations and roles">
                <ul>
                    <li>
                        Store each organization, and a membership for each person in it: organization, the person's
                        Gait subject, and a role in the app.
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
                <p>What Gait does for its own workspace invites, and a good default for an app's:</p>
                <ul>
                    <li>A long random token per invite. Store only a hash of it, never the token itself.</li>
                    <li>Each invite is for one organization, one email address and one role.</li>
                    <li>
                        Single use, and it expires (Gait's workspace invites last 7 days). Resending means revoking the
                        old invite and creating a new one.
                    </li>
                    <li>One pending invite per email address per organization.</li>
                    <li>
                        Put the token after <code>#</code> in the link, so it never reaches server logs or other
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
                    Gait, opens the link, and the app checks the token and that the signed-in email is the one
                    invited. Show them which organization and role before they choose to join.
                </p>
                <Callout kind="warning" title="Treat the link like a password">
                    The app can't tell whether the signed-in email is confirmed, so the token is what proves the
                    invite reached the right inbox. Anyone the link is forwarded to could use it with an account in that
                    name.
                </Callout>
                <p>
                    <strong>Joining without the link</strong> (listing someone's pending invites by email) is only safe
                    if the app confirms the email address itself. Gait offers it for workspaces because Gait
                    confirms every email before it can be used to join.
                </p>
            </DocSection>

            <DocSection id="sites" title="Sites inside an organization">
                <p>
                    If an organization has several locations, a site is a part of that organization, not a separate
                    one. A layout that works: the owner is organization-wide and every other role belongs to one
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
                    <li>Store or enforce an app's organizations, roles, invites or sites.</li>
                    <li>
                        Tell the app whether a user's email is confirmed (above).
                    </li>
                    <li>
                        Host the sign-in page for the app, or issue tokens tied to one application: both are planned. See{" "}
                        <DocLink to="isolation#planned">Planned</DocLink>.
                    </li>
                </ul>
            </DocSection>
        </>
    );
}
