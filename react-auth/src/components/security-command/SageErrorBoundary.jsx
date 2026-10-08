import React from "react";
import { safeLogError } from "../../utils/safeLog";

/**
 * B-UX3 section 24: a Sage rendering failure (a malformed citation, an
 * unrecognized field shape) must never take down Security Command,
 * workflow state, or action routing around it -- Knowledge UX is an
 * enhancement, contained locally. Falls back to the raw backend answer
 * text, which is always a plain string regardless of what else in the
 * response is malformed.
 */
export class SageErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    // The error's class name only: its message can quote response content
    // (GAIT-SEC-095).
    safeLogError("Sage response failed to render", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <p className="copilot-message-answer">
          {this.props.fallbackAnswer || "Gait could not display this knowledge response."}
        </p>
      );
    }
    return this.props.children;
  }
}

export default SageErrorBoundary;
