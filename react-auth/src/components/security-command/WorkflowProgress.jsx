import React from "react";
import { humanizeEnum } from "../security/securityLabels";
import { actorIdentityForKey } from "./actorIdentity";
import { normalizeSecurityRoleText } from "./roleTerminology";

const PIPELINE = [
  { key: "investigator", specialistKey: "investigator" },
  { key: "red_team", specialistKey: "red_team" },
  { key: "repair", specialistKey: "repair" },
  { key: "validator", specialistKey: "validator" },
  { key: "human", specialistKey: null },
  { key: "deployer", specialistKey: "deployer" },
];

function statusToneClass(status) {
  switch (status) {
    case "RUNNING":
      return "running";
    case "COMPLETE":
      return "complete";
    case "FAILED":
      return "failed";
    case "LOCKED":
      return "locked";
    case "WAITING":
    default:
      return "waiting";
  }
}

export function WorkflowProgress({ specialists, humanAttentionState, isLoading }) {
  if (isLoading && !specialists) {
    return <p className="workflow-progress-loading">Loading specialist status…</p>;
  }

  if (!specialists) {
    return null;
  }

  return (
    <ol className="workflow-progress" aria-label="Specialist workflow progress">
      {PIPELINE.map((node) => {
        const identity = actorIdentityForKey(node.key);
        const Icon = identity.icon;
        const isHuman = node.key === "human";
        const entry = node.specialistKey ? specialists[node.specialistKey] : null;
        const status = isHuman
          ? humanAttentionState === "HUMAN_APPROVAL_REQUIRED"
            ? "AWAITING"
            : null
          : entry?.status;
        const label = isHuman
          ? status === "AWAITING"
            ? "Awaiting approval"
            : "—"
          : normalizeSecurityRoleText(entry?.label || humanizeEnum(status));
        const toneClass = isHuman
          ? status === "AWAITING"
            ? "attention"
            : "waiting"
          : statusToneClass(status);

        return (
          <li key={node.key} className={`workflow-progress-node workflow-progress-node--${identity.variant}`}>
            <span className={`workflow-progress-role workflow-progress-role--${identity.variant}`}>
              <Icon aria-hidden="true" />
              {identity.label}
            </span>
            <span className={`workflow-progress-status workflow-progress-status--${toneClass}`}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
