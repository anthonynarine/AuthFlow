import { useState } from "react";
import "./RequestFlow.css";
import {
  RiSendPlaneLine,
  RiExchangeLine,
  RiShieldKeyholeLine,
  RiKeyLine,
  RiCheckboxCircleLine,
  RiQrCodeLine,
  RiRefreshLine,
} from "react-icons/ri";
import { FaPython } from "react-icons/fa";

const flows = {
  register: {
    label: "Register",
    steps: [
      { icon: RiSendPlaneLine, title: "Request", body: "The client sends your name, email, and password to POST /register/." },
      { icon: RiExchangeLine, title: "Interceptor", body: "Axios attaches the CSRF token before the request ever leaves the browser." },
      { icon: FaPython, title: "Validate", body: "Django checks that the email isn't already taken and the passwords match." },
      { icon: RiKeyLine, title: "Hash & store", body: "The password is hashed before the account is saved — the raw password is never stored." },
      { icon: RiCheckboxCircleLine, title: "Confirm", body: "A success response comes back and you're redirected to log in." },
    ],
  },
  login: {
    label: "Login",
    steps: [
      { icon: RiSendPlaneLine, title: "Request", body: "The client sends your email and password to POST /login/." },
      { icon: RiExchangeLine, title: "Interceptor", body: "Axios attaches the CSRF token to the request before it ever leaves the browser." },
      { icon: FaPython, title: "Verify", body: "Django checks the password hash. If two-factor is enabled, it responds with a 2FA-required flag instead of tokens." },
      { icon: RiShieldKeyholeLine, title: "Confirm (if 2FA is on)", body: "The one-time code from your authenticator app is sent to POST /two-factor-login/ and checked against the account's TOTP secret." },
      { icon: RiKeyLine, title: "Issue tokens", body: "Django issues a short-lived access token and a longer-lived refresh token." },
      { icon: RiCheckboxCircleLine, title: "Store & continue", body: "The response interceptor stores both tokens in cookies, and you're signed in." },
    ],
  },
  twoFactor: {
    label: "Enable 2FA",
    steps: [
      { icon: RiShieldKeyholeLine, title: "Turn it on", body: "Flipping on two-factor from account settings sends PATCH /user/toggle-2fa/." },
      { icon: FaPython, title: "Generate secret", body: "Django creates a TOTP secret for your account and marks setup as in progress." },
      { icon: RiQrCodeLine, title: "Scan the code", body: "A QR code comes back from GET /generate-qr/ for you to scan with an authenticator app." },
      { icon: RiExchangeLine, title: "Confirm once", body: "You enter the 6-digit code once to prove the app is synced, via POST /verify-otp/." },
      { icon: RiCheckboxCircleLine, title: "Enabled", body: "Two-factor is now required on every future login." },
    ],
  },
  refresh: {
    label: "Stay signed in",
    steps: [
      { icon: RiSendPlaneLine, title: "Expired request", body: "A request goes out carrying an access token that's already expired." },
      { icon: RiExchangeLine, title: "401 caught", body: "The response interceptor catches the 401 before it ever reaches your code." },
      { icon: RiRefreshLine, title: "Refresh call", body: "It calls POST /token-refresh/ with the refresh token in the Authorization header." },
      { icon: RiKeyLine, title: "New token issued", body: "Django issues a fresh access token — refresh tokens aren't rotated today." },
      { icon: RiCheckboxCircleLine, title: "Retry", body: "The original request is retried automatically. You never see the interruption." },
    ],
  },
};

const flowOrder = ["register", "login", "twoFactor", "refresh"];

export function RequestFlow() {
  const [activeFlow, setActiveFlow] = useState("login");

  return (
    <div className="request-flow-wrap">
      <div className="request-flow-chips" role="tablist" aria-label="Choose a flow to inspect">
        {flowOrder.map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={activeFlow === key}
            className={`request-flow-chip${activeFlow === key ? " is-active" : ""}`}
            onClick={() => setActiveFlow(key)}
          >
            {flows[key].label}
          </button>
        ))}
      </div>

      <div className="request-flow-stage">
        {flowOrder.map((key) => {
          const steps = flows[key].steps;
          const isActive = activeFlow === key;
          return (
            <ol
              className={`request-flow${isActive ? " is-active" : ""}`}
              key={key}
              aria-hidden={!isActive}
            >
              {steps.map(({ icon: Icon, title, body }, index) => (
                <li className="request-flow-step" key={title}>
                  <div className="request-flow-marker">
                    <span className="request-flow-icon"><Icon /></span>
                    {index < steps.length - 1 && <span className="request-flow-line" aria-hidden="true" />}
                  </div>
                  <div className="request-flow-content">
                    <p className="request-flow-title">{title}</p>
                    <p className="request-flow-body">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          );
        })}
      </div>
    </div>
  );
}

export default RequestFlow;
