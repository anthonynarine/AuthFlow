import React from "react";
import { Link } from "react-router-dom";
import { DocLink, DocSection, StatusBadge } from "../components/DocPrimitives";

// Words match the Account page and sign-in screens. Turning it off and making
// new codes always ask for the password and a code (H6); changing the password
// and starting setup only ask when your sign-in isn't recent. Deliberately not
// claimed: a staff recovery service, or anything about how the app's secret is
// stored.

export default function TwoStepVerification() {
    return (
        <>
            <p className="doc-lede">
                Two-step verification asks for a code from an authenticator app after your password, so a stolen
                password isn't enough to get into your account.
            </p>
            <p>
                <StatusBadge feature="twoStepVerification" /> It's your own sign-in, so it covers every workspace you
                belong to. While it's off, your menu in the console shows <strong>2FA off</strong>.
            </p>

            <DocSection id="turn-it-on" title="Turn it on">
                <p>
                    Open your menu in the console, choose <strong>Account</strong>, then{" "}
                    <strong>Turn on two-step verification</strong>. It takes about two minutes, in four steps:
                </p>
                <ol>
                    <li>
                        <strong>Before you start.</strong> Have an authenticator app on your phone (for example
                        1Password, Google Authenticator or Authy), then confirm your password.
                    </li>
                    <li>
                        <strong>Scan the code.</strong> Add an account in your app and point it at the QR code. Can't
                        scan? Type the setup key shown under it instead.
                    </li>
                    <li>
                        <strong>Confirm a code.</strong> Enter the 6-digit code your app shows. It changes every 30
                        seconds.
                    </li>
                    <li>
                        <strong>Save your recovery codes.</strong> You get 10. Copy them or download them (as{" "}
                        <code>gait-recovery-codes.txt</code>) into a password manager or somewhere safe, away from this
                        device. This is the only time Gait shows them. Tick the box to say they're saved, then{" "}
                        <strong>Finish</strong>.
                    </li>
                </ol>
                <p>Turning it on signs you out on your other devices.</p>
            </DocSection>

            <DocSection id="signing-in" title="Signing in with a code">
                <p>
                    After your password, Gait asks you to <strong>Enter your code</strong>: open your authenticator app
                    and enter the 6-digit code for Gait. Each code works once, so enter the one showing now.
                </p>
                <p>
                    You have 10 minutes after your password to enter it. Take longer and you'll see{" "}
                    <strong>That sign-in timed out</strong>: enter your password again.
                </p>
            </DocSection>

            <DocSection id="lost-your-phone" title="Lost your phone?">
                <ol>
                    <li>
                        On the code screen, choose <strong>Lost your phone? Use a recovery code</strong> and enter one
                        of your saved codes. Capitals, spaces and hyphens don't matter. Each code works once.
                    </li>
                    <li>
                        You land on your <strong>Account</strong> page, which says how many recovery codes you have
                        left.
                    </li>
                    <li>
                        Set up your new phone: turn two-step verification off (with your password and another recovery
                        code), then on again with the new phone. That also gives you a fresh set of recovery codes.
                    </li>
                </ol>
                <p>
                    Gait emails you whenever one of your recovery codes is used. Lost your phone <em>and</em> your
                    recovery codes? You'll need help to sign in: <Link to="/send-email">contact me</Link>.
                </p>
            </DocSection>

            <DocSection id="recovery-codes" title="Your recovery codes">
                <ul>
                    <li>
                        Your <strong>Account</strong> page shows how many you have left and when they were made. With 3
                        or fewer left it says <strong>Running low</strong>.
                    </li>
                    <li>
                        <strong>Make new codes</strong> asks for your password and a code, then replaces every old code
                        at once and shows the new ones, once. Gait emails you when new codes are made.
                    </li>
                    <li>Used every code? Make new ones before you need them.</li>
                </ul>
            </DocSection>

            <DocSection id="turn-it-off" title="Turn it off">
                <p>
                    On your <strong>Account</strong> page, choose <strong>Turn off</strong> and confirm with your
                    password and a code from your app (or a recovery code). Your account then only
                    needs a password, your other devices are signed out, and your recovery codes stop working. Gait
                    emails you that it was turned off.
                </p>
            </DocSection>

            <DocSection id="confirm-its-you" title={"\"Confirm it's you\""}>
                <p>
                    Turning two-step verification off and making new recovery codes always ask for your password and a
                    code from your app (or a recovery code), every time, even if you've just signed in.
                </p>
                <p>
                    For other changes that matter (changing your password, or starting to turn two-step verification
                    on), Gait asks you to confirm it's you if you haven't signed in recently: your password, and, while
                    two-step verification is on, a code from your app or a recovery code.
                </p>
                <p>
                    More on keeping your account safe:{" "}
                    <DocLink to="how-gait-protects-your-data">How Gait protects your data</DocLink>.
                </p>
            </DocSection>
        </>
    );
}
