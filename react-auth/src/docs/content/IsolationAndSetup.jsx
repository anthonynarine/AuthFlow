import React from "react";
import { DocLink, DocSection, DocTable, StatusBadge } from "../components/DocPrimitives";
import { AccountPoolDiagram, ConsoleIsolationDiagram, FlowSteps } from "../components/IsolationDiagrams";
import { STATUS_AS_OF } from "../featureStatus";

function formatAsOf(isoDate) {
    const [year, month, day] = isoDate.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
    });
}

/** A journey's steps, each with its Live/Pending badge and an optional note. */
function JourneySteps({ label, steps }) {
    return (
        <ol className="iso-steps" aria-label={label}>
            {steps.map(([text, feature, note], index) => (
                <li key={index}>
                    <span className="iso-step-text">
                        {text}
                        {note && <span className="iso-step-note">{note}</span>}
                    </span>
                    <StatusBadge feature={feature} />
                </li>
            ))}
        </ol>
    );
}

const FINDINGS_SCREEN_NOTE = "Findings screen (F3). The findings API is available now.";

function H3({ id, children }) {
    return (
        <h3 id={id} className="doc-h3">
            {children}
        </h3>
    );
}

const KEY_DECIDES_COMPANY = [
    {
        from: "App Two backend",
        to: "Gait",
        text: (
            <>
                <code>POST /api/security/tenant-signals/</code> with the header{" "}
                <code>Gait-Application-Credential: &lt;app-two key&gt;</code>
            </>
        ),
    },
    { from: "Gait", text: "The key leads to app-two-api (production), which belongs to company app-two." },
    { from: "Gait", to: "Findings", text: "Recorded under app-two / app-two-api.", outcome: "ok" },
];

const WRONG_DOOR = [
    {
        from: "sec@app-one",
        to: "Gait",
        text: <code>GET /api/organizations/app-one/security/findings/</code>,
    },
    { from: "Gait", to: "sec@app-one", text: "200, app-one's findings.", outcome: "ok" },
    {
        from: "sec@app-one",
        to: "Gait",
        text: <code>GET /api/organizations/app-two/security/findings/</code>,
    },
    { from: "Gait", text: "app-two exists, but there's no membership row for sec@app-one." },
    { from: "Gait", to: "sec@app-one", text: "404, exactly like a company that doesn't exist.", outcome: "denied" },
];

export default function IsolationAndSetup() {
    return (
        <>
            <p className="doc-lede">
                How Gait keeps one customer's people, applications and findings away from another's, and the four
                journeys that make up a working setup.
            </p>
            <p>
                The examples use two made-up customers, <strong>App One</strong> and <strong>App Two</strong>, each with
                its own product and its own end users. Background first:{" "}
                <DocLink to="people-and-applications">People and applications</DocLink>. Invite details:{" "}
                <DocLink to="teams-roles-and-invites">Teams, roles &amp; invites</DocLink>.
            </p>

            <DocSection id="isolation-at-a-glance" title="Isolation at a glance">
                <H3 id="the-gait-console">① The Gait console: walled off per company, enforced by Gait</H3>
                <ConsoleIsolationDiagram />
                <p>
                    Every member, application, key and finding belongs to exactly one company. Console URLs are{" "}
                    <code>/api/organizations/&lt;company&gt;/…</code>; Gait loads that company, then requires your
                    membership row in it. No row means <strong>404</strong>, the same answer as a company that doesn't
                    exist, so names can't be probed.
                </p>

                <H3 id="your-products-users">② Your product's users: one shared login pool, walled off by each product</H3>
                <AccountPoolDiagram />
                <p>
                    Gait accounts are shared on purpose, like Google logins: one person, one login, usable at any
                    product. An account alone grants nothing. App One's customer orgs and roles live in App One's
                    database, App Two's in App Two's; Gait never stores or enforces them. What someone can do always
                    comes from a membership row, in Gait (①) or in the product (②).
                </p>
            </DocSection>

            <DocSection id="what-ties-each-thing-to-one-company" title="What ties each thing to one company">
                <DocTable caption="What ties each thing to one company">
                    <thead>
                        <tr>
                            <th scope="col">Thing</th>
                            <th scope="col">How it's bound</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <th scope="row">Team members</th>
                            <td>
                                A membership row: (company, person, role). Owner of <code>app-one</code> means nothing
                                in <code>app-two</code>.
                            </td>
                        </tr>
                        <tr>
                            <th scope="row">Console pages and API</th>
                            <td>
                                The company comes from the URL, and your membership row in it is required before
                                anything runs. Not a member: 404.
                            </td>
                        </tr>
                        <tr>
                            <th scope="row">Applications and keys</th>
                            <td>
                                Each app belongs to one company; each key belongs to one app. Gait stores only a hash
                                of the key.
                            </td>
                        </tr>
                        <tr>
                            <th scope="row">Signals and findings</th>
                            <td>
                                The company comes <strong>from the key</strong> and nothing else in the request. App
                                Two's key can only ever write App Two findings.
                            </td>
                        </tr>
                        <tr>
                            <th scope="row">Invites</th>
                            <td>
                                Tied to one company, and need the emailed token plus a signed-in account whose verified
                                email matches.
                            </td>
                        </tr>
                    </tbody>
                </DocTable>
            </DocSection>

            <DocSection id="a-key-decides-the-company" title="A key decides the company">
                <FlowSteps
                    label="App Two's backend reports a signal"
                    steps={KEY_DECIDES_COMPANY}
                    note="Nothing in the request can point it at app-one."
                />
            </DocSection>

            <DocSection id="someone-knocks-on-the-wrong-door" title="Someone knocks on the wrong door">
                <p>
                    <code>sec@app-one</code> is an Admin of app-one, and not a member of app-two.
                </p>
                <FlowSteps label="An app-one Admin asks for app-two's findings" steps={WRONG_DOOR} />
            </DocSection>

            <DocSection id="the-four-journeys" title="The four journeys">
                <p>
                    Status as of {formatAsOf(STATUS_AS_OF)}. <StatusBadge status="live" /> means you can do it today;{" "}
                    <StatusBadge status="pending" /> means it isn't available in the console yet, even if Gait's API
                    already supports it.
                </p>

                <H3 id="journey-1">1. You set up security observability for your product</H3>
                <p>
                    Done once by the product's owner. Diagrams for the{" "}
                    <DocLink to="people-and-applications#how-a-person-joins">account</DocLink> and{" "}
                    <DocLink to="people-and-applications#how-an-application-gets-its-key">key</DocLink> steps.
                </p>
                <JourneySteps
                    label="Journey 1 steps"
                    steps={[
                        ["Register a Gait account", "core"],
                        ["Confirm your email", "emailVerification"],
                        [<>Create the company (<code>app-one</code>); you become its Owner</>, "core"],
                        [
                            <>
                                Add one application per environment (<code>app-one-api</code> · <code>local</code>,{" "}
                                <code>app-one-api</code> · <code>production</code>)
                            </>,
                            "core",
                        ],
                        [
                            <>
                                Issue a connection key (shown once) and put it in that environment's backend config as{" "}
                                <code>GAIT_APPLICATION_CREDENTIAL</code>
                            </>,
                            "core",
                        ],
                        ["Watch findings; acknowledge or accept risk with a note", "findingsScreen", FINDINGS_SCREEN_NOTE],
                    ]}
                />
                <p>Your product's end users are <strong>not</strong> invited here.</p>

                <H3 id="journey-2">2. Your product reports to Gait</H3>
                <p>No person involved; the application key is the only credential.</p>
                <JourneySteps
                    label="Journey 2 steps"
                    steps={[
                        ["Your backend runs its self-check", "core"],
                        ["gait-sdk sends a signal, with the key in a header", "core"],
                    ]}
                />
                <div className="iso-branches">
                    <div className="iso-branch iso-branch--fail">
                        <p className="iso-branch-title">If the result is FAIL</p>
                        <ol>
                            <li>A finding opens, for this app only.</li>
                            <li>A scheduled job opens a case.</li>
                            <li>
                                An Owner or Admin acknowledges it or accepts the risk.{" "}
                                <StatusBadge feature="findingsScreen" />
                            </li>
                        </ol>
                    </div>
                    <div className="iso-branch iso-branch--pass">
                        <p className="iso-branch-title">If the result is PASS</p>
                        <ol>
                            <li>The finding resolves (if all its evidence is self-reported).</li>
                        </ol>
                    </div>
                </div>
                <p>
                    Customer findings are kept apart from Gait's own platform findings. An accepted risk stays accepted
                    if the check fails again. Reporting, findings and cases are <StatusBadge feature="core" />; acting
                    on a finding in the console waits for the findings screen, as in journey 1.
                </p>

                <H3 id="journey-3">3. A teammate joins your Gait company</H3>
                <p>
                    An Owner or Admin invites by email and role, Gait emails a single-use link (valid 7 days), and the
                    invitee signs in with the invited, verified email and chooses <strong>Join</strong>. Every step,
                    screen and rule: <DocLink to="teams-roles-and-invites">Teams, roles &amp; invites</DocLink>.
                </p>
                <JourneySteps
                    label="Journey 3 steps"
                    steps={[
                        ["An Owner or Admin invites a teammate by email and role", "membersAndInviteAccept"],
                        ["Gait emails a single-use link, valid for 7 days", "membersAndInviteAccept"],
                        ["The invitee signs in with the invited, verified email", "emailVerification"],
                        [<>The invitee chooses <strong>Join</strong></>, "membersAndInviteAccept"],
                    ]}
                />

                <H3 id="journey-4">4. Your product's own users get in</H3>
                <p>Everything here happens in your product. Gait only provides the login.</p>
                <JourneySteps
                    label="Journey 4 steps"
                    steps={[
                        ["The Org A admin registers on App One's sign-up page; App One creates a Gait account (login only)", "core"],
                        ["The Org A admin creates customer org A in App One", "core"],
                        [
                            "The Org A admin invites user@org-a as Staff; App One gives them a one-time invite link, which they send to user@org-a",
                            "core",
                        ],
                        ["user@org-a opens the link and signs in or registers", "core"],
                        ["App One asks Gait \"who is this?\" (gait-sdk); Gait answers: user@org-a", "core"],
                        ["App One checks the invite token is valid and creates a membership row: org A · Staff", "core"],
                        [
                            "On every request after that, App One verifies the token with Gait (gait-sdk), checks membership and role, and returns org A's data only",
                            "core",
                        ],
                    ]}
                />
                <p>Your product owns the invite, the roles and the data scoping.</p>
            </DocSection>

            <DocSection id="planned" title="Planned">
                <p>Planned: sign-in hosted by Gait, and tokens tied to the app they were issued for.</p>
            </DocSection>
        </>
    );
}
