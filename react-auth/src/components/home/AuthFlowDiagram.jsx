import "./AuthFlowDiagram.css";
import { FaReact, FaPython } from "react-icons/fa";
import { RiExchangeLine, RiShieldKeyholeLine, RiLoopLeftLine } from "react-icons/ri";

const nodes = [
  { icon: FaReact, title: "React client", subtitle: "Login, register, 2FA forms" },
  { icon: RiExchangeLine, title: "Axios interceptors", subtitle: "Attach JWT + CSRF headers" },
  { icon: FaPython, title: "Django REST API", subtitle: "Verifies credentials & tokens" },
  { icon: RiShieldKeyholeLine, title: "JWT + 2FA", subtitle: "Issues access & refresh tokens" },
];

export function AuthFlowDiagram() {
  return (
    <div className="flow-diagram">
      <div className="flow-row">
        {nodes.map(({ icon: Icon, title, subtitle }, index) => (
          <div className="flow-node-wrap" key={title}>
            <div className="flow-node">
              <div className="flow-node-icon"><Icon /></div>
              <p className="flow-node-title">{title}</p>
              <p className="flow-node-subtitle">{subtitle}</p>
            </div>
            {index < nodes.length - 1 && (
              <div className="flow-connector" aria-hidden="true">
                <svg viewBox="0 0 100 24" preserveAspectRatio="none">
                  <path className="flow-line" d="M 0 12 H 100" />
                  <path className="flow-arrowhead" d="M 92 6 L 100 12 L 92 18" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flow-loop">
        <RiLoopLeftLine className="flow-loop-icon" aria-hidden="true" />
        <span className="flow-loop-label">401 → refresh token → retry request, automatically</span>
      </div>
    </div>
  );
}

export default AuthFlowDiagram;
