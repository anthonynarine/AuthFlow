import React from "react";
import { Callout, DocLink, DocSection } from "../components/DocPrimitives";

export default function RotateAConnectionKey() {
    return (
        <>
            <p className="doc-lede">
                Replace an application's connection key without a gap in reporting: add the new key, move your
                software onto it, then retire the old one.
            </p>
            <p>
                Rotate on a schedule you choose (keys issued in the console don't expire, and Gait doesn't send
                reminders), when someone who had the key leaves, or after any doubt about where it's been. If you think
                it has leaked, go straight to{" "}
                <DocLink to="applications-and-connection-keys#if-a-key-leaks">If a key leaks</DocLink>.
            </p>
            <p>
                You'll need the Owner or Admin role, and the application must be active: new keys can only be issued
                for an active application.
            </p>

            <DocSection id="issue-the-new-key" title="1. Issue the new key">
                <ol>
                    <li>
                        In the console, open <strong>Applications</strong>, then the application.
                    </li>
                    <li>
                        Under connection keys, choose <strong>Issue key</strong> and give it a label that says where it
                        will live, for example <code>prod server, Sept rotation</code>.
                    </li>
                    <li>
                        Copy the key into your secret store now. It's shown once; Gait keeps only a fingerprint.
                    </li>
                </ol>
                <p>
                    An application can have several active keys at once, so the old key keeps working while you
                    switch.
                </p>
            </DocSection>

            <DocSection id="deploy-it" title="2. Deploy it">
                <p>
                    Set the new key as <code>GAIT_APPLICATION_CREDENTIAL</code> wherever the application runs, then
                    restart or redeploy.
                </p>
                <Callout kind="warning" title="Restart after changing the key">
                    gait-sdk reads <code>GAIT_APPLICATION_CREDENTIAL</code> once, when your process starts. A process
                    that's already running keeps using the old key until it restarts.
                </Callout>
            </DocSection>

            <DocSection id="check-last-used" title="3. Check Last used">
                <p>
                    In the application's key list, the <strong>Last used</strong> column shows when each key last
                    reported. Wait until the new key shows a time and the old one stops moving.
                </p>
                <ul>
                    <li>
                        It only changes when your software actually reports, so if your checks run once a day, give it a
                        day.
                    </li>
                    <li>It's updated at most every 5 minutes per key, so it can lag a little.</li>
                    <li>Reload the page to see the latest values.</li>
                </ul>
            </DocSection>

            <DocSection id="revoke-the-old-key" title="4. Revoke the old key">
                <p>
                    Choose <strong>Revoke</strong> on the old key. The confirmation shows when it was last used, and
                    warns you if it was used in the last 24 hours, which means something still depends on it.
                </p>
                <p>
                    Revoking is <strong>immediate and permanent</strong>. The key stays in the list, marked revoked
                    with the date.
                </p>
            </DocSection>

            <DocSection id="if-something-still-used-it" title="If something still used the old key">
                <p>
                    Its reports are refused with "Invalid application credential" (gait-sdk raises{" "}
                    <code>InvalidApplicationCredentialError</code>). A revoked key can't be restored: give that
                    software the new key and restart it. More causes of that error:{" "}
                    <DocLink to="troubleshooting#reporting-security-checks">Troubleshooting</DocLink>.
                </p>
            </DocSection>
        </>
    );
}
