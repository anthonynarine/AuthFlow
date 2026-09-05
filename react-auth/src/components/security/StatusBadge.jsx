import React from "react";
import { humanizeEnum } from "./securityLabels";

export function StatusBadge({ status, type = "outcome", label }) {
  const value = status || "UNKNOWN";
  return <span className={`security-badge ${type}-${value.toLowerCase()}`}>{label || humanizeEnum(value)}</span>;
}
