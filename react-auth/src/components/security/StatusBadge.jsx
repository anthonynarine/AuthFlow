import React from "react";
import { humanizeEnum } from "./securityLabels";

export function StatusBadge({ status, type = "outcome" }) {
  const value = status || "UNKNOWN";
  return <span className={`security-badge ${type}-${value.toLowerCase()}`}>{humanizeEnum(value)}</span>;
}
