import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  RiArrowGoBackLine,
  RiArrowRightUpLine,
  RiBookOpenLine,
  RiCheckLine,
  RiCodeSSlashLine,
  RiFileCopyLine,
  RiGithubLine,
  RiKey2Line,
  RiPulseLine,
  RiServerLine,
  RiShieldKeyholeLine,
  RiUserLine,
} from "react-icons/ri";
import "../home/Home.css";
import "./DevelopersPage.css";
import { DiagramFrame, DiagramNode, FlowConnector } from "../diagrams/DiagramPrimitives";

const REPO = "https://github.com/anthonynarine/gait-sdk";
const PYPI = "https://pypi.org/project/gait-sdk/";
const doc = (name) => `${REPO}/blob/main/docs/${name}`;

const boundary = [
  { who: "Gait", verb: "authenticates", question: "Who are you?", detail: "Login, 2FA, sessions, signed tokens." },
  { who: "gait-sdk", verb: "verifies", question: "Is this token genuine, and whose is it?", detail: "Runs inside your service." },
  { who: "Your application", verb: "authorizes", question: "What may this person do here?", detail: "Roles, organizations, permissions." },
];

const flow = [
  {
    variant: "human",
    icon: RiUserLine,
    eyebrow: "1 · Browser",
    title: "The user signs in to Gait",
    description: "Password, then 2FA if it's on. Your app never sees a password.",
  },
  {
    variant: "deterministic",
    icon: RiKey2Line,
    eyebrow: "2 · Gait",
    title: "Gait issues a signed token",
    description: "A 15-minute RS256 access token. Gait publishes the public keys at /.well-known/jwks.json.",
  },
  {
    variant: "enforcement",
    icon: RiShieldKeyholeLine,
    eyebrow: "3 · gait-sdk, in your API",
    title: "Verified locally",
    description: "Signature, issuer, audience and expiry are checked against cached public keys. No call to Gait per request.",
  },
  {
    variant: "truth",
    icon: RiServerLine,
    eyebrow: "4 · Your code",
    title: "You decide what's allowed",
    description: "You get a verified identity: subject, email, session. Roles and permissions stay in your data.",
  },
];

const quickStart = {
  django: {
    label: "Django REST Framework",
    install: 'pip install "gait-sdk[django]"',
    configure: `# settings.py
INSTALLED_APPS = [..., "gait_sdk"]          # validates configuration at startup

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ["gait_sdk.authentication.ExternalJWTAuthentication"],
}

GAIT_TOKEN_VERIFIER = "jwks"                 # verify locally (recommended)
GAIT_JWKS_URL = "https://auth.example.com/.well-known/jwks.json"
GAIT_ISSUER = "https://auth.example.com"
GAIT_AUDIENCE = "urn:gait:your-app"
GAIT_AUTH_URL = "https://auth.example.com/api"   # used for live session checks`,
    use: `# views.py
from gait_sdk.django.authentication import require_live_session

class FinalizeReport(APIView):
    def post(self, request, pk):
        identity = request.verified_identity    # subject, email, session_id, token_id, issuer
        ...                                     # YOUR authorization check first
        require_live_session(request)           # sensitive action: confirm the session live
        ...                                     # then mutate`,
  },
  fastapi: {
    label: "FastAPI",
    install: 'pip install "gait-sdk[fastapi]"',
    configure: `# .env (or real environment variables)
GAIT_TOKEN_VERIFIER=jwks
GAIT_JWKS_URL=https://auth.example.com/.well-known/jwks.json
GAIT_ISSUER=https://auth.example.com
GAIT_AUDIENCE=urn:gait:your-app
GAIT_AUTH_URL=https://auth.example.com/api`,
    use: `from fastapi import Depends, FastAPI
from gait_sdk.fastapi.dependencies import require_live_session, validate_configuration, verify_token

app = FastAPI()
validate_configuration()   # fail at startup, not on the first request

@app.get("/me")
async def me(claims: dict = Depends(verify_token)):
    return {"subject": claims["id"], "email": claims["email"]}

@app.post("/danger")
async def danger(claims: dict = Depends(require_live_session)):
    ...`,
  },
};

const modules = [
  { name: "Token verification", code: "gait_sdk.verification", text: "JWKS (local, recommended) or introspection. Both return the same VerifiedIdentity." },
  { name: "Live session checks", code: "require_live_session", text: "One call before a sensitive action confirms the session hasn't been revoked." },
  { name: "Django REST Framework", code: "ExternalJWTAuthentication", text: "A drop-in authentication class with real 401s, so refresh-on-401 works." },
  { name: "FastAPI", code: "verify_token", text: "Dependencies for verification, live checks, and startup validation." },
  { name: "Service identity", code: "gait_sdk.application", text: "Verify your service's own Gait credential for machine-to-machine calls." },
  { name: "Security signals", code: "gait_sdk.security", text: "Report security events from your app back to Gait's observatory." },
];

const guarantees = [
  ["RS256 only.", "alg=none, HS256 key confusion and unknown algorithms are rejected. iss, aud, exp, sub, sid, jti and the token type are all required."],
  ["No secrets to steal.", "The SDK only ever holds Gait's public keys, so even a compromised service can't mint tokens."],
  ["Fails closed.", "An invalid token is a 401. If Gait can't be reached it's a 503, never a quiet fallback to a weaker check."],
  ["Hardened key fetching.", "HTTPS enforced, response size and key count capped, one refresh at a time, and a 30-second cooldown on unknown keys."],
  ["Nothing sensitive in logs.", "No token, cookie or credential value is ever logged."],
  ["Verifiable releases.", "Published from GitHub Actions with PyPI Trusted Publishing and provenance attestations. No long-lived upload tokens."],
];

const docs = [
  { title: "Concepts", href: doc("CONCEPTS.md"), text: "Tokens, signatures, JWKS and revocation, in plain language." },
  { title: "Integration guide", href: doc("INTEGRATION_GUIDE.md"), text: "Wiring it in, sensitive actions, and testing." },
  { title: "Security", href: doc("SECURITY.md"), text: "Threat model, guarantees, known limits, reporting." },
  { title: "Troubleshooting", href: doc("TROUBLESHOOTING.md"), text: "Every error message, what it means, and the fix." },
];

function CopyButton({ text, label = "Copy" }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button type="button" className="sdk-copy" onClick={copy} aria-label={copied ? "Copied" : label}>
      {copied ? <RiCheckLine /> : <RiFileCopyLine />}
      <span>{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}

function CodeBlock({ code, title }) {
  return (
    <div className="sdk-code">
      <div className="sdk-code-bar">
        <span>{title}</span>
        <CopyButton text={code} label={`Copy ${title}`} />
      </div>
      <pre><code>{code}</code></pre>
    </div>
  );
}

/**
 * The developer page for gait-sdk, the Python SDK that lets a Django REST
 * Framework or FastAPI service trust identities Gait issues. Content mirrors
 * the SDK's own README; the repo docs stay the source of truth.
 */
export function DevelopersPage() {
  const [framework, setFramework] = useState("django");
  const active = quickStart[framework];

  return (
    <div className="home-page product-home developers-page">
      <header className="site-header product-header">
        <Link className="brand" to="/" aria-label="Gait home">
          <RiShieldKeyholeLine />
          <span>Gait</span>
        </Link>
        <nav className="site-nav product-nav" aria-label="Developers page navigation">
          <a href={REPO} target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href={PYPI} target="_blank" rel="noopener noreferrer">PyPI</a>
          <Link to="/" className="nav-cta secondary">
            <RiArrowGoBackLine /> Back to Gait
          </Link>
        </nav>
      </header>

      <main>
        <section className="section sdk-hero">
          <p className="eyebrow">For developers</p>
          <h1 className="display-serif">gait-sdk</h1>
          <p className="sdk-hero-lede">
            The Python SDK for Gait. Drop it into a Django REST Framework or FastAPI service and trust who is
            calling you, without building login yourself.
          </p>
          <div className="sdk-install">
            <code>pip install gait-sdk</code>
            <CopyButton text="pip install gait-sdk" label="Copy install command" />
          </div>
          <ul className="sdk-chips" aria-label="Package facts">
            <li>On PyPI</li>
            <li>Python 3.10+</li>
            <li>Django REST Framework &amp; FastAPI</li>
            <li>MIT licensed</li>
          </ul>
          <div className="hero-actions">
            <a href={REPO} target="_blank" rel="noopener noreferrer" className="btn-pill btn-pill-primary">
              <RiGithubLine /> View on GitHub
            </a>
            <a href={PYPI} target="_blank" rel="noopener noreferrer" className="btn-pill btn-pill-secondary">
              PyPI package <RiArrowRightUpLine />
            </a>
          </div>
        </section>

        <section className="section" id="boundary">
          <p className="eyebrow">The design rule</p>
          <h2>Three jobs, three owners.</h2>
          <p className="section-lede">
            gait-sdk hands your code a verified identity. It never issues tokens, stores passwords, or makes
            authorization decisions. That stays with you.
          </p>
          <div className="sdk-boundary">
            {boundary.map((item) => (
              <div className="sdk-boundary-item" key={item.who}>
                <p className="sdk-boundary-who">{item.who}</p>
                <p className="sdk-boundary-verb">{item.verb}</p>
                <p className="sdk-boundary-question">{item.question}</p>
                <p className="sdk-boundary-detail">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="section" id="how-it-works">
          <p className="eyebrow">How it works</p>
          <h2>Gait proves who someone is. Your API checks that proof, locally.</h2>
          <DiagramFrame
            eyebrow="Request path"
            title="From sign-in to your authorization check"
            footnote="Sensitive actions add one live call: require_live_session asks Gait whether the session is still active, so a logout or revocation takes effect immediately instead of when the token expires."
          >
            <div className="sdk-flow">
              {flow.map((step, index) => (
                <React.Fragment key={step.eyebrow}>
                  {index > 0 && (
                    <>
                      <FlowConnector direction="right" className="sdk-flow-h" />
                      <FlowConnector direction="down" className="sdk-flow-v" />
                    </>
                  )}
                  <DiagramNode {...step} size="sm" />
                </React.Fragment>
              ))}
            </div>
          </DiagramFrame>
        </section>

        <section className="section" id="quick-start">
          <p className="eyebrow">Quick start</p>
          <h2>Three steps: install, configure, protect.</h2>
          <div className="sdk-tabs" role="tablist" aria-label="Framework">
            {Object.entries(quickStart).map(([key, value]) => (
              <button
                key={key}
                type="button"
                role="tab"
                id={`sdk-tab-${key}`}
                aria-selected={framework === key}
                aria-controls="sdk-tabpanel"
                className={framework === key ? "is-active" : ""}
                onClick={() => setFramework(key)}
              >
                {value.label}
              </button>
            ))}
          </div>
          <div className="sdk-steps" role="tabpanel" id="sdk-tabpanel" aria-labelledby={`sdk-tab-${framework}`}>
            <div className="sdk-step">
              <h3><span>1</span> Install</h3>
              <CodeBlock code={active.install} title="Terminal" />
            </div>
            <div className="sdk-step">
              <h3><span>2</span> Point it at Gait</h3>
              <CodeBlock code={active.configure} title={framework === "django" ? "settings.py" : ".env"} />
              <p className="section-note">
                A missing or insecure setting stops the service at startup, so a broken auth configuration never
                serves traffic.
              </p>
            </div>
            <div className="sdk-step">
              <h3><span>3</span> Protect your endpoints</h3>
              <CodeBlock code={active.use} title={framework === "django" ? "views.py" : "main.py"} />
            </div>
          </div>
        </section>

        <section className="section" id="live-session">
          <div className="proof-callout sdk-callout">
            <h4><RiPulseLine /> Why require_live_session exists</h4>
            <p className="section-note">
              Verifying locally is fast because it doesn't ask Gait anything, but it also can't see a logout until
              the token expires, which takes up to 15 minutes. For actions that matter, like signing a report,
              changing a role or moving money, call <code>require_live_session</code> first. It makes one live
              check with Gait and fails closed if Gait can't answer.
            </p>
          </div>
        </section>

        <section className="section" id="what-you-get">
          <p className="eyebrow">What you get</p>
          <h2>Everything a Python service needs to trust a Gait identity.</h2>
          <div className="sdk-cards">
            {modules.map((item) => (
              <div className="sdk-card" key={item.name}>
                <h3>{item.name}</h3>
                <code>{item.code}</code>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="section" id="security">
          <p className="eyebrow">Security</p>
          <h2>Built to fail closed.</h2>
          <ul className="sdk-guarantees">
            {guarantees.map(([title, text]) => (
              <li key={title}>
                <RiCheckLine aria-hidden="true" />
                <p><strong>{title}</strong> {text}</p>
              </li>
            ))}
          </ul>
          <p className="section-note">
            The full threat model, known limits and audit history are in{" "}
            <a href={doc("SECURITY.md")} target="_blank" rel="noopener noreferrer">SECURITY.md</a>.
          </p>
        </section>

        <section className="section" id="try-it">
          <p className="eyebrow">Try it in five minutes</p>
          <h2>No account needed.</h2>
          <p className="section-lede">
            The repo ships a small stand-in issuer plus a FastAPI and a Django example app, so you can watch a token
            get issued, verified and rejected on your own machine.
          </p>
          <a
            href={`${REPO}/tree/main/examples`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-pill btn-pill-secondary"
          >
            <RiCodeSSlashLine /> Open the examples
          </a>
        </section>

        <section className="section" id="docs">
          <p className="eyebrow">Documentation</p>
          <h2>Read more.</h2>
          <div className="sdk-cards">
            {docs.map((item) => (
              <a className="sdk-card sdk-doc-link" key={item.title} href={item.href} target="_blank" rel="noopener noreferrer">
                <h3><RiBookOpenLine aria-hidden="true" /> {item.title}</h3>
                <p>{item.text}</p>
              </a>
            ))}
          </div>
          <div className="business-inquiries-card sdk-availability">
            <p className="eyebrow">Availability</p>
            <p className="section-note">
              Gait currently serves its own first-party applications, starting with Lumen, a vascular-ultrasound
              reporting platform. Onboarding for outside applications is by hand for now.{" "}
              <Link to="/early-access">Request early access</Link> if you'd like to use Gait with your own app.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default DevelopersPage;
