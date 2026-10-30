# Hosted development Console setup

Candidate UI; availability and release are not established by this document.

The server-derived deployment badge distinguishes Hosted development from Production independently of the application environment. Unknown or unavailable capabilities disable local setup and export no configuration. A Local application on production cannot enroll local addresses.

Legacy production setup and key-dialog instructions require a server-confirmed Production deployment for the same application and environment. A production-labelled application on Hosted development cannot reveal static production connection instructions. Unknown, failed or mismatched capability responses keep those instructions closed; an application label never supplies deployment authority.

Owners/Admins open the Local development sign-in card, enter exact http://localhost:<port> or http://127.0.0.1:<port> origins and explicitly authorize enrollment. Gait validates exact origins and fresh MFA. Each app can authorize the same local address independently. This is local owner authorization, never public website ownership proof.

Active server enrollment displays Local development configured. Copy public issuer/API/JWKS/audience pins or the equivalent developer/AI handoff. Issue a named development credential in the existing one-time key dialog against this deployment’s configured API; save it only in backend secrets. No key value appears in the handoff or query cache. Use separate synthetic accounts and keys; never import production accounts/data or automatically link authority.

Backend connection and tested login remain separate, unconfirmed states. Test sign-in, MFA, an actual refresh request, foreground activity, and logout/private-page denial. Enrollment, copying, or a health request never marks those tests passed. Connection pins are available in collapsed advanced details.

Configure/revoke mutations never retry automatically. Revoke requires confirmation. Reauthentication warns unsaved edits will be lost and returns to the same app. Scope/deployment changes discard stale setup. Production keeps the existing HTTPS ownership flow.

## Confidential backend adapter

Use this application's UUID with six separate routes under the server-confirmed API base: `/application-auth/<UUID>/login/`, `/mfa/`, `/refresh/`, `/logout/`, `/status/` and `/activity/`. The BFF sends `Gait-Application-Credential` from server secrets only. Never forward browser `Origin`, `Cookie` or `Authorization` to those confidential endpoints. Protect browser-facing BFF requests against CSRF, use an opaque application session cookie, and retain tokens/pending MFA handles in server-side storage.

Copied SDK verification pins alone do not implement this protocol. Existing gait-sdk 0.5.4 does not establish application-auth support; confirm support in the actual published SDK or implement the reviewed adapter contract. Changing active origins invalidates prior sessions and pending MFA transactions. Revocation cannot be undone through the same enrollment form.
