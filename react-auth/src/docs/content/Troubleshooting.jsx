import React from "react";
import { Link } from "react-router-dom";
import { DocLink, DocSection, DocTable } from "../components/DocPrimitives";
import { statusOf } from "../featureStatus";

function Problems({ caption, rows }) {
    return (
        <DocTable caption={caption}>
            <thead>
                <tr>
                    <th scope="col">You see</th>
                    <th scope="col">Why</th>
                    <th scope="col">Fix</th>
                </tr>
            </thead>
            <tbody>
                {rows.map(([symptom, why, fix]) => (
                    <tr key={symptom}>
                        <th scope="row">{symptom}</th>
                        <td>{why}</td>
                        <td>{fix}</td>
                    </tr>
                ))}
            </tbody>
        </DocTable>
    );
}

export default function Troubleshooting() {
    return (
        <>
            <p className="doc-lede">What a message means and what to do about it.</p>

            <DocSection id="signing-in-and-your-company" title="Signing in and your company">
                <Problems
                    caption="Signing in and company problems"
                    rows={[
                        [
                            "The console asks you to create a company",
                            "Your account isn't in any company yet.",
                            "Create one, or ask your team's Owner for an invite.",
                        ],
                        [
                            "You can't create a company until you confirm your email",
                            statusOf("emailVerification") === "live"
                                ? "Your email address isn't confirmed yet."
                                : "Your email address isn't confirmed yet (once email confirmation is live).",
                            "Open the link Gait emailed you, or send a new one from the console.",
                        ],
                        [
                            "Signed out after an update",
                            "A security upgrade occasionally signs everyone out once.",
                            "Sign in again.",
                        ],
                    ]}
                />
            </DocSection>

            <DocSection id="joining-and-access" title="Joining and access">
                <Problems
                    caption="Joining and access problems"
                    rows={[
                        [
                            "\"This doesn't exist, or you don't have access to it\"",
                            "You're not a member of that company, or the link is wrong. Gait doesn't say which.",
                            "Check the address with your company's Owner.",
                        ],
                        [
                            "\"Your role can't do that\"",
                            "Your role in this company doesn't allow the action.",
                            <>
                                Ask an Owner or Admin. See <DocLink to="teams-roles-and-invites#roles">Roles</DocLink>.
                            </>,
                        ],
                        [
                            "An invite link says it can't be used",
                            "It was used, revoked, or is older than 7 days.",
                            "Ask for a new invite.",
                        ],
                        [
                            "An invite says it's for a different email",
                            "You're signed in with another account.",
                            "Sign out and sign in with the invited email address.",
                        ],
                        [
                            "The last Owner can't leave",
                            "A company always keeps at least one Owner.",
                            "Make someone else an Owner first.",
                        ],
                    ]}
                />
            </DocSection>

            <DocSection id="reporting-security-checks" title="Reporting security checks">
                <Problems
                    caption="Reporting problems"
                    rows={[
                        [
                            "Your application gets \"Invalid application credential\"",
                            "Wrong key, a revoked key, or the application is suspended or retired.",
                            <>
                                Check the application's status; issue a new key if needed. See{" "}
                                <DocLink to="applications-and-connection-keys">Applications &amp; connection keys</DocLink>.
                            </>,
                        ],
                        [
                            "Your self-check refuses to report because of the environment",
                            "The key belongs to an application in a different environment.",
                            "Use the key of this environment's application.",
                        ],
                        [
                            "A second report didn't show up",
                            "It reused a source_reference, so Gait treated it as a retry of the first.",
                            "Make source_reference unique for every run.",
                        ],
                        [
                            "A PASS didn't close a finding",
                            "The finding is Gait-verified; a self-reported PASS can't close it.",
                            <>
                                See{" "}
                                <DocLink to="security-checks-and-findings#self-reported-vs-gait-verified">
                                    Self-reported vs Gait-verified
                                </DocLink>
                                .
                            </>,
                        ],
                    ]}
                />
            </DocSection>

            <DocSection id="still-stuck" title="Still stuck?">
                <p>
                    <Link to="/send-email">Contact us</Link>. Describe what you did and what you saw, but never include a
                    connection key, password or invite link.
                </p>
            </DocSection>
        </>
    );
}
