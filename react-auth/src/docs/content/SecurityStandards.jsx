import React from "react";
import { DocSection } from "../components/DocPrimitives";

export default function SecurityStandards() {
    return (
        <>
            <p className="doc-lede">Published guidance shapes Gait’s design. Each control still needs implementation, testing and deployment evidence.</p>
            <DocSection id="references" title="The references I use">
                <ul>
                    <li><a href="https://pages.nist.gov/800-63-4/sp800-63b.html">NIST SP 800-63B-4</a>: authentication and session guidance.</li>
                    <li><a href="https://owasp.org/www-project-application-security-verification-standard/">OWASP ASVS</a>: testable application-security requirements. A requirement-by-requirement assessment is planned.</li>
                    <li><a href="https://www.cisecurity.org/controls/v8-1">CIS Controls</a>: operational safeguards, including secure configuration, logging and recovery. An applicability assessment is planned.</li>
                </ul>
                <p>Using these references does not establish certification, full AAL2 conformity or an ASVS verification level. Gait makes no such claim here.</p>
            </DocSection>
            <DocSection id="sessions" title="Session policy: implementation in progress">
                <p>The selected baseline follows NIST’s AAL2 recommended limits: one hour of inactivity and 24 hours overall. Stricter application policies may apply. These session changes are being implemented and tested; they are not yet deployed.</p>
                <ul>
                    <li>Meaningful user activity will extend the inactivity window only.</li>
                    <li>Background polling and token refresh will not extend either deadline.</li>
                    <li>Reaching either deadline will end the session and require a new sign-in.</li>
                    <li>Sensitive actions will keep a separate recent-authentication requirement, without applying that short window to ordinary active browsing.</li>
                </ul>
                <p>Gait and each connected application must enforce their own session policy. Registration and ownership verification do not establish that login, MFA or session expiry has been tested.</p>
            </DocSection>
            <DocSection id="verification" title="How changes are verified">
                <p>Session changes require denial and expiry-boundary tests, independent Security and QA review, human release approval, and deployment verification. Planned, implemented, verified and deployed behavior are distinct states; this page will change when evidence supports the next state.</p>
                <p>Legal, regulatory and contractual requirements depend on an application’s data, users and business activities. A financial or health-related application is not automatically covered by every rule for that sector.</p>
            </DocSection>
        </>
    );
}
