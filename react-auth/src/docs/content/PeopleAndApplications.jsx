import React from "react";
import { Callout, DocLink, DocSection, DocTable } from "../components/DocPrimitives";
import { AppGetsKeyLesson } from "../components/AppGetsKeyLesson";
import { Diagram } from "../components/Diagram";
import { PersonJoinsLesson } from "../components/PersonJoinsLesson";
import { statusOf } from "../featureStatus";
import { DIAGRAM } from "../palette";

const BIG_PICTURE = `flowchart TB
    classDef person fill:${DIAGRAM.fillTeal},stroke:${DIAGRAM.teal},color:${DIAGRAM.text},stroke-width:2px
    classDef company fill:${DIAGRAM.surface},stroke:${DIAGRAM.cyan},color:${DIAGRAM.text},stroke-width:2px
    classDef app fill:${DIAGRAM.fillPurple},stroke:${DIAGRAM.purple},color:${DIAGRAM.text},stroke-width:2px
    classDef key fill:${DIAGRAM.fillAmber},stroke:${DIAGRAM.amber},color:${DIAGRAM.text},stroke-width:2px

    subgraph PEOPLE["People: sign in with a Gait account"]
        direction LR
        P1["me@lumen.example"]:::person
        P2["security@lumen.example"]:::person
    end

    subgraph COMPANY["Workspace: lumen"]
        direction LR
        R1["Owner"]:::company
        R2["Admin"]:::company
        A1["lumen-api (local)"]:::app
        A2["lumen-api (production)"]:::app
    end

    subgraph SOFTWARE["Lumen's backend"]
        direction LR
        E1["Connection key (local)"]:::key
        E2["Connection key (production)"]:::key
    end

    P1 -- "member as" --> R1
    P2 -- "member as" --> R2
    A1 -- "connection key" --> E1
    A2 -- "connection key" --> E2
    E1 -. "reports security checks" .-> A1`;

const PRODUCT_USERS = `flowchart LR
    classDef gait fill:${DIAGRAM.surface},stroke:${DIAGRAM.cyan},color:${DIAGRAM.text},stroke-width:2px
    classDef product fill:${DIAGRAM.surfaceAlt},stroke:${DIAGRAM.teal},color:${DIAGRAM.text},stroke-width:2px

    subgraph G["Gait: who you are"]
        ACC["Gait account<br/>jordan@example.org<br/>email confirmed"]:::gait
    end
    subgraph P["Lumen: what you may do"]
        CUST["Organization: Example Clinic"]:::product
        ROLE["Role in Lumen, set by Lumen"]:::product
    end
    ACC -- "signs in to" --> P
    CUST --> ROLE`;

const BOUNDARIES = `flowchart LR
    classDef ok fill:${DIAGRAM.fillGreen},stroke:${DIAGRAM.green},color:${DIAGRAM.text}
    classDef no fill:${DIAGRAM.fillRed},stroke:${DIAGRAM.red},color:${DIAGRAM.text}

    K["Connection key"] --> Y1["Report checks for its own application"]:::ok
    K --x N1["Sign in"]:::no
    K --x N2["Invite anyone"]:::no
    K --x N3["See other applications or workspaces"]:::no

    M["Member"] --> Y2["See their own workspace"]:::ok
    M --x N4["See another workspace"]:::no
    M --x N5["Manage applications, keys or people"]:::no`;

export default function PeopleAndApplications() {
    return (
        <>
            <p className="doc-lede">
                Gait has two completely different kinds of identity, <strong>people</strong> and{" "}
                <strong>applications</strong>, and they never stand in for each other. A third layer appears when
                an app has its own users, as Lumen does.
            </p>

            <DocSection id="the-big-picture" title="The big picture">
                <Diagram
                    source={BIG_PICTURE}
                    description="Two people sign in to Gait and belong to the workspace lumen, one as Owner and one as Admin. The workspace has two applications, lumen-api in local and lumen-api in production. Each application has its own connection key, stored in that copy of Lumen's backend, which it uses to report security checks."
                />
                <ul>
                    <li>
                        <strong>People</strong> sign in, belong to workspaces, and have a <strong>role</strong> in each
                        workspace.
                    </li>
                    <li>
                        <strong>Applications</strong> are pieces of software inside a workspace, one per environment.
                        Each has <strong>connection keys</strong> that live in the software's backend configuration.
                    </li>
                    <li>
                        <strong>An app's own users</strong> (Lumen's, for example) sign in with Gait accounts too, but
                        their roles belong to the app, not to Gait. See{" "}
                        <a href="#your-products-own-users">below</a>.
                    </li>
                </ul>
            </DocSection>

            <DocSection id="people-vs-applications" title="People vs applications">
                <DocTable caption="How people and applications differ">
                    <thead>
                        <tr>
                            <th scope="col"><span className="doc-visually-hidden">Property</span></th>
                            <th scope="col">Person</th>
                            <th scope="col">Application</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <th scope="row">What it is</th>
                            <td>A human with a Gait account</td>
                            <td>A piece of an app, in one environment</td>
                        </tr>
                        <tr>
                            <th scope="row">How it gets in</th>
                            <td>Creates an account and confirms their email; creates a workspace or joins one by invite</td>
                            <td>An Owner or Admin adds it to a workspace</td>
                        </tr>
                        <tr>
                            <th scope="row">Credential</th>
                            <td>Password (and a code, if two-step verification is on), then a short-lived session</td>
                            <td>A connection key in the application's backend secrets</td>
                        </tr>
                        <tr>
                            <th scope="row">Has a role?</th>
                            <td>Yes: Owner, Admin or Member, <strong>per workspace</strong></td>
                            <td><strong>No</strong></td>
                        </tr>
                        <tr>
                            <th scope="row">Can sign in to the console?</th>
                            <td>Yes</td>
                            <td><strong>No</strong></td>
                        </tr>
                        <tr>
                            <th scope="row">Can invite people?</th>
                            <td>Owners and Admins only</td>
                            <td><strong>Never</strong></td>
                        </tr>
                        <tr>
                            <th scope="row">What it can do</th>
                            <td>Use the console within its role</td>
                            <td>Report security checks for itself</td>
                        </tr>
                        <tr>
                            <th scope="row">If compromised</th>
                            <td>Reset the password (that signs out every device), or choose Sign out everywhere on your Account page</td>
                            <td>Revoke the key and issue a new one</td>
                        </tr>
                    </tbody>
                </DocTable>
                <p>
                    A connection key is deliberately narrow. It proves <em>"I am lumen-api (production), owned by the
                    workspace lumen"</em> and nothing more. It can't read the console, act as a person, see other
                    applications, or touch another workspace.
                </p>
            </DocSection>

            <DocSection id="how-a-person-joins" title="How a person joins">
                <PersonJoinsLesson />
                <p>
                    Details, including what each invite screen means, are in{" "}
                    <DocLink to="teams-roles-and-invites">Teams, roles &amp; invites</DocLink>.
                </p>
            </DocSection>

            <DocSection id="how-an-application-gets-its-key" title="How an application gets its key">
                <AppGetsKeyLesson />
                <p>
                    See <DocLink to="applications-and-connection-keys">Applications &amp; connection keys</DocLink> and{" "}
                    <DocLink to="connecting-your-software">Connecting an app</DocLink>.
                </p>
            </DocSection>

            <DocSection id="your-products-own-users" title="An app's own users">
                <p>
                    An app can use Gait to sign its own users in <strong>without</strong> making them members of its
                    Gait workspace. Lumen does this. Say Lumen, with the Gait workspace <code>lumen</code>, is used by an
                    organization called Example Clinic (a made-up name), whose staff sign in to Lumen:
                </p>
                <Diagram
                    source={PRODUCT_USERS}
                    description="A Gait account, jordan@example.org, with a confirmed email, signs in to Lumen. Lumen decides that Jordan belongs to its organization Example Clinic and which role Jordan has in Lumen."
                />
                <ul>
                    <li><strong>Gait authenticates</strong>: it answers "who is this?".</li>
                    <li>
                        <strong>Lumen authorizes</strong>: it decides which organization and which of Lumen's roles
                        the person has, using its own invites and data.
                    </li>
                    <li>
                        Jordan never joins the Gait workspace <code>lumen</code> and never sees the Gait console. That
                        workspace is for the people who look after Lumen's security.
                    </li>
                </ul>
                <DocTable caption="Lumen's Gait workspace compared with an organization inside Lumen">
                    <thead>
                        <tr>
                            <th scope="col"><span className="doc-visually-hidden">Property</span></th>
                            <th scope="col">Gait workspace <code>lumen</code></th>
                            <th scope="col">Lumen organization "Example Clinic"</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <th scope="row">Who's in it</th>
                            <td>Me, and anyone I invite to look after Lumen's security in Gait</td>
                            <td>That organization's staff</td>
                        </tr>
                        <tr>
                            <th scope="row">Roles</th>
                            <td>Owner / Admin / Member (Gait's)</td>
                            <td>Whatever Lumen defines</td>
                        </tr>
                        <tr>
                            <th scope="row">Joined by</th>
                            <td>A Gait invite</td>
                            <td>Lumen's own invite</td>
                        </tr>
                        <tr>
                            <th scope="row">Sees</th>
                            <td>The Gait console</td>
                            <td>Lumen</td>
                        </tr>
                    </tbody>
                </DocTable>
            </DocSection>

            <DocSection id="boundaries-that-always-hold" title="Boundaries that always hold">
                <Diagram
                    source={BOUNDARIES}
                    description="A connection key can report checks for its own application, and cannot sign in, invite anyone, or see other applications or workspaces. A Member can see their own workspace, and cannot see another workspace or manage applications, keys or people."
                />
                <ol>
                    <li><strong>A key is never a person.</strong> Keys can't sign in, invite, or hold a role.</li>
                    <li>
                        <strong>A role never crosses workspaces.</strong> Being Owner of one workspace means nothing in
                        another. Links to another workspace's pages behave as if they don't exist.
                    </li>
                    <li>
                        <strong>Joining needs proof.</strong> A signed-in account with the invited, confirmed email
                        address, whether you join from the invite link or from the invites Gait shows you.
                    </li>
                    <li>
                        <strong>Gait authenticates; the app authorizes.</strong> Gait never stores or enforces an app's
                        own roles.
                    </li>
                </ol>
                <Callout kind="availability">
                    {statusOf("membersAndInviteAccept") === "live"
                        ? "Inviting people and accepting an invite both work in the console today."
                        : "The console screen for accepting an invite is still being built."}{" "}
                    See <DocLink to="teams-roles-and-invites#availability">what works today</DocLink>.
                </Callout>
            </DocSection>
        </>
    );
}
