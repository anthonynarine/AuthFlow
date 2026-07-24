import React from 'react';
import './ReactFeatures.css';
import { useNavigate } from 'react-router-dom';
import { RiArrowGoBackLine } from 'react-icons/ri';

const sections = [
  {
    heading: "The core: Axios interceptors",
    href: "https://axios-http.com/docs/interceptors",
    body: "Requests don't hit Axios directly — they pass through interceptors first. These are functions Axios runs automatically on every request or response, which is where custom logic like attaching access tokens or catching expired ones actually lives.",
  },
  {
    heading: "Request interceptor",
    href: "https://axios-http.com/docs/req_config",
    body: "Every outgoing request passes through a request interceptor. It checks your browser's cookies for an access token, and if one exists, attaches it to the request's headers so the server recognizes and trusts the request.",
  },
  {
    heading: "Why cookies?",
    href: "https://www.npmjs.com/package/js-cookie",
    body: "Access tokens are stored in cookies rather than local storage, because local storage is readable by any script on the page — an easy target for XSS. Cookies with the right flags are a safer place to keep something this sensitive.",
  },
  {
    heading: "Response interceptor",
    href: "https://axios-http.com/docs/res_schema#response-interceptor",
    body: "Not every response is a success — some mean the access token has expired. When that happens, the response interceptor steps in, calls the token-refresh endpoint, updates the cookie with a new token, and retries the original request automatically. No dropped session, no manual refresh.",
  },
];

export const ReactFeatures = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/");
  };

  return (
    <div className="features-page">
      <div className="features-container">
        <button onClick={handleClick} className="back-button" title="Go back to homepage">
          <RiArrowGoBackLine size="1.25em" />
        </button>

        <p className="features-eyebrow">React features</p>
        <h1>How network requests actually work here</h1>
        <p className="features-intro">
          A closer look at how this app keeps requests authenticated and sessions alive,
          without getting in your way.
        </p>

        {sections.map(({ heading, href, body }) => (
          <section className="glass-card feature-card" key={heading}>
            <a href={href} target="_blank" rel="noopener noreferrer">
              <h2>{heading}</h2>
            </a>
            <p>{body}</p>
          </section>
        ))}

        <section className="feature-closing">
          <h2>Why it's built this way</h2>
          <p>
            Axios interceptors keep token handling out of every individual component —
            security and a smooth experience come from one shared layer instead of being
            re-implemented per request. That's the same principle behind the rest of this
            project: understand the mechanism well enough to build it deliberately, not just
            wire up a library and hope.
          </p>
        </section>
      </div>
    </div>
  );
};
