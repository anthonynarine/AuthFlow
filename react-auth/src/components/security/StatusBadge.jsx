import React from "react";

export function StatusBadge({ status, type = "outcome" }) {
  const value = status || "UNKNOWN";
  return <span className={`security-badge ${type}-${value.toLowerCase()}`}>{value}</span>;
}
