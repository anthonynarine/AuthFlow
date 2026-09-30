import React from "react";
import { DocLink, DocSection } from "../components/DocPrimitives";

// Only what the code does today, for every workspace. Deliberately no numbers
// (limits and lifetimes can change) and no claims beyond the listed items:
// e.g. not "every secret is hashed", no HSTS, nothing about how the two-step
// app secret is stored (not encrypted yet: SEC1).

export default function HowGaitProtectsYourData() {
    return (
        <>
            <p className="doc-lede">
                What Gait does to keep your workspace private and your keys and sessions safe.
            </p>

            <DocSection id="your-workspace-is-walled-off" title="Your workspace is walled off">
                <ul>
                    <li>
                        To anyone who isn't a member, your workspace doesn't exist: they get the same answer as for a
                        workspace that doesn't exist, so its name can't even be confirmed.
                    </li>
                    <li>
                        Membership is checked on every request, not remembered from when someone signed in. When you
                        remove someone, they lose access straight away.
                    </li>
                    <li>
                        Every lookup happens inside your workspace. Asking for another workspace's application or
                        finding by its ID gets the same answer as an ID that doesn't exist.
                    </li>
                    <li>What Gait sends back is limited to the fields meant for your team.</li>
                </ul>
                <p>
                    More: <DocLink to="isolation">Isolation and setup</DocLink>.
                </p>
            </DocSection>

            <DocSection id="the-key-decides" title="Connection keys decide where a report goes">
                <ul>
                    <li>
                        A report is filed under the application its key belongs to, and so under that workspace and
                        environment. Nothing in the report can choose another; a report that tries is refused.
                    </li>
                    <li>
                        A key stops working at once when it's revoked, when its application is suspended or retired,
                        or when its workspace is suspended.
                    </li>
                    <li>A key can only report checks. It can't sign in, invite anyone or read anything.</li>
                </ul>
            </DocSection>

            <DocSection id="secrets-gait-doesnt-keep" title="Secrets Gait doesn't keep">
                <p>
                    Gait keeps only a fingerprint (a one-way hash) of these, so nobody can read them back, including
                    Gait:
                </p>
                <ul>
                    <li>connection keys, shown once when they're issued;</li>
                    <li>the secret in each invite link;</li>
                    <li>the secret in each email-confirmation link;</li>
                    <li>the secret in each password-reset link;</li>
                    <li>your two-step recovery codes, shown once when they're made.</li>
                </ul>
                <p>
                    Invite, email-confirmation and password-reset links also carry their secret after the{" "}
                    <code>#</code>, the part of a link browsers don't send to servers, and the page removes it from the
                    address bar once it's read.
                </p>
            </DocSection>

            <DocSection id="your-console-session" title="Your console session">
                <ul>
                    <li>
                        Staying signed in uses a cookie that scripts on the page can't read. The short-lived token that
                        proves who you are lives only in the page's memory, never in the browser's storage.
                    </li>
                    <li>
                        Gait only accepts that cookie from requests sent by gaitobservatory.com itself.
                    </li>
                    <li>
                        <strong>Sign out</strong> ends your session on Gait's side, not just in your browser.{" "}
                        <strong>Sign out everywhere</strong>, on your Account page, ends every session, including this
                        one.
                    </li>
                    <li>
                        Resetting your password signs you out everywhere. Changing your password, or turning
                        two-step verification on or off, signs out your other devices.
                    </li>
                </ul>
            </DocSection>

            <DocSection id="two-step-verification" title="Two-step verification">
                <p>
                    Turn on <DocLink to="two-step-verification">two-step verification</DocLink> and a stolen password
                    isn't enough: signing in also needs a code from your authenticator app, or one of your one-time
                    recovery codes. Gait emails you when a recovery code is used, when new codes are made, and when
                    two-step verification is turned off.
                </p>
                <p>
                    New passwords need at least 12 characters, not only numbers, and can't be a common password or too
                    like your name or email address.
                </p>
            </DocSection>

            <DocSection id="limits-on-repeated-attempts" title="Limits on repeated attempts">
                <p>
                    Signing in, entering a two-step code, resetting a password, confirming an email address and
                    accepting an invite are all limited. Too many attempts in a short time and Gait asks you to wait before trying again.
                </p>
                <p>
                    Asking for a password reset gets the same answer whether or not an account exists for that
                    address, so it can't be used to find out who has an account.
                </p>
            </DocSection>

            <DocSection id="a-confirmed-email" title="A confirmed email address">
                <p>
                    You can't create a workspace or join one until you've confirmed your email address, and an invite
                    only works for an account with exactly the invited address. See{" "}
                    <DocLink to="teams-roles-and-invites#joining-needs-proof">Joining needs proof</DocLink>.
                </p>
            </DocSection>

            <DocSection id="your-software" title="Your software">
                <p>
                    Gait never changes your code, servers or data, and its automated agents work only on Gait's own
                    platform. See <DocLink to="what-gait-is#what-gait-is-not">What Gait is not</DocLink> and{" "}
                    <DocLink to="automated-security-response">Automated security response</DocLink>. Found a problem?{" "}
                    <DocLink to="report-a-vulnerability">Report a vulnerability</DocLink>.
                </p>
            </DocSection>
        </>
    );
}
