import React from 'react';
import './Features.css'; 
import { useNavigate } from 'react-router-dom';
import { RiArrowGoBackLine } from 'react-icons/ri';

export const Features = () => {

  let navigate = useNavigate();

  function handleClick () {
    navigate("/");
  };


  return (
    <div className="features-container" style={{position: "relative"}}>
        <button onClick={handleClick} style={{ position: 'absolute', top: 20, left: 0, margin: '20px', background: 'none', color: "#D3D3D3", border: 'none', cursor: 'pointer' }}
              title="Go back to homepage">
        <RiArrowGoBackLine size="1.5em" style={{ color: "black"}} />
      </button>
      <h1>React Technical Features </h1>
      <h2>Network Requests</h2>

      <section>
        <p>Let's delve into the technicalities of how network requests are managed to ensure seamless communication with the server. The focus lies on security, efficiency, and handling network responses to provide a reliable experience.</p>
      </section>

      <section>
        <a href="https://axios-http.com/docs/interceptors" target="_blank" rel="noopener noreferrer">
            <h2>The Core: Axios Interceptors</h2>
        </a>
        <p>The application utilizes Axios, an HTTP client, to manage network requests. It doesn't use Axios directly; instead, it utilizes <em>interceptors</em>. Interceptors are functions that Axios calls automatically on every request or response, allowing us to inject custom logic, such as attaching access tokens or handling expired tokens.</p>
      </section>

      <section>
        <a href="https://axios-http.com/docs/req_config" target="_blank" rel="noopener noreferrer">
            <h2>Request Interceptor</h2>
        </a>
        <p> Request interceptors: securely attach access tokens. Every time the application sends a request to the server, it passes through a <em>request interceptor</em>. This interceptor's job is simple: it checks if you have an access token (a digital key that proves your identity and permissions) stored in your browser's cookies. If you do, the interceptor attaches this token to your request's headers, ensuring that the server recognizes and trusts your request.</p>
      </section>

      <section>
        <a href="https://www.npmjs.com/package/js-cookie" target="_blank" rel="noopener noreferrer">
            <h2>Why Cookies?</h2>
        </a>
        <p>We store access tokens in cookies because they're secure and automatically sent with each request to the domain. This makes managing your session safe and easy, as opposed to storing tokens in local storage, which is vulnerable to attacks like XSS (Cross-Site Scripting).</p>
      </section>

      <section>
        <a href="https://axios-http.com/docs/res_schema#response-interceptor" target="_blank" rel="noopener noreferrer">
          <h2>Response Interceptor</h2>
        </a>

        <p>Handling token expiry gracefully with a response interceptor. Not all responses are about success; some indicate that your access token has expired. When this happens, the <em>response interceptor</em> comes into play. Instead of letting the request fail, the interceptor attempts to refresh your token automatically by contacting our server's token-refresh endpoint.</p>
        <p>If the refresh is successful, it updates your cookie with the new access token and retries the original request without you ever noticing a hiccup. This seamless process ensures that you're not abruptly logged out or forced to manually refresh the page.</p>
      </section>

      <section>
        <h2>Security and User Experience</h2>
        <p>Through the use of Axios interceptors, the application secures your data and access, and also aims to enhance your experience by handling expired tokens and network errors smoothly. This mechanism is crucial for maintaining a secure, responsive, and user-friendly platform.</p>
      </section>

      <section>
        <h2>Let's Learn Together</h2>
        <p>I hope this overview gave you some insight into the engineering behind this application. By transparently sharing how I handle network requests, my goal is to not only inform you but also inspire trust and confidence.</p>
        <p>Thank you for taking the time to learn about the inner workings of this application. Security and user experience are my top priorities, I am committed to imporving continuously.</p>
      </section>
    </div>
  );
};
