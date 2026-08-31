import React from "react";

export function SeverityBadge({ severity }) {
  const value = severity || "INFO";
  return <span className={`security-badge severity-${value.toLowerCase()}`}>{value}</span>;
}
