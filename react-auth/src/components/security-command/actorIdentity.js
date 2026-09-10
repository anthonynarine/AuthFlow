import {
  RiInformationLine,
  RiFileShieldLine,
  RiFlowChart,
  RiSearchEyeLine,
  RiSwordLine,
  RiToolsLine,
  RiShieldCheckLine,
  RiUserLine,
  RiRocketLine,
  RiChat3Line,
} from "react-icons/ri";

/**
 * One shared visual vocabulary for "who acted" across the Command Center —
 * the case timeline and the workflow progress pipeline both resolve actors
 * through this module, so an actor never looks different in one place than
 * another. Variant names match the semantic diagram color roles already
 * defined as --diagram-* CSS custom properties in index.css (deterministic
 * / ai / human / truth / neutral), so the whole app shares one palette.
 */
export const ACTOR_IDENTITIES = {
  system: { key: "system", label: "System", icon: RiInformationLine, variant: "neutral" },
  security_truth: { key: "security_truth", label: "Security Truth", icon: RiFileShieldLine, variant: "truth" },
  commander: { key: "commander", label: "Incident Commander", icon: RiFlowChart, variant: "deterministic" },
  investigator: { key: "investigator", label: "Blue Team", icon: RiSearchEyeLine, variant: "ai" },
  red_team: { key: "red_team", label: "Red Team", icon: RiSwordLine, variant: "ai" },
  repair: { key: "repair", label: "Green Team", icon: RiToolsLine, variant: "ai" },
  validator: { key: "validator", label: "Security Validator", icon: RiShieldCheckLine, variant: "ai" },
  human: { key: "human", label: "Human Approver", icon: RiUserLine, variant: "human" },
  deployer: { key: "deployer", label: "Release Engineer", icon: RiRocketLine, variant: "ai" },
  security_copilot: { key: "security_copilot", label: "Security Copilot", icon: RiChat3Line, variant: "ai" },
};

const ACTOR_NAME_TO_KEY = {
  System: "system",
  "Security Truth": "security_truth",
  "Security Observatory": "security_truth",
  "Incident Commander": "commander",
  Commander: "commander",
  security_commander_v1: "commander",
  "Blue Team": "investigator",
  Investigator: "investigator",
  security_investigator_v1: "investigator",
  "Red Team": "red_team",
  security_red_team_v1: "red_team",
  "Green Team": "repair",
  Repair: "repair",
  security_repair_v1: "repair",
  "Security Validator": "validator",
  Validator: "validator",
  security_validator_v1: "validator",
  "Human Approver": "human",
  Human: "human",
  "Release Engineer": "deployer",
  Deployer: "deployer",
  security_deployer_v1: "deployer",
  security_staging_deployer_v1: "deployer",
  "Human Approval": "human",
  "Security Copilot": "security_copilot",
};

const TECHNICAL_ACTOR_PATTERNS = [
  [/commander/i, "commander"],
  [/investigator|investigate|blue[_ -]?team/i, "investigator"],
  [/red[_ -]?team|adversary|attack/i, "red_team"],
  [/repair|remediation|green[_ -]?team/i, "repair"],
  [/validator|validation/i, "validator"],
  [/deploy/i, "deployer"],
  [/copilot/i, "security_copilot"],
  [/human|approval/i, "human"],
  [/observatory|truth|b-obs/i, "security_truth"],
  [/^b-agent/i, "security_copilot"],
];

/**
 * Resolve a trusted workflow event to a canonical actor identity.
 *
 * The backend sends actor_display_name="Security Observatory" both for the
 * original FINDING_OPENED event and for post-deploy verification events —
 * those are two different concepts to an operator (the case being opened
 * vs. trusted evidence being re-checked), so event_type/category is used to
 * tell them apart. Everything else maps directly off actor_display_name,
 * which the backend already humanizes (see security_agents/presentation.py
 * display_agent_name) — no B-AGENT keys ever reach this layer.
 */
export function resolveActorIdentity(event) {
  const actorName = event?.actor_display_name || "";
  const eventType = event?.event_type || "";
  const category = event?.category || "";

  if (eventType === "FINDING_OPENED") {
    return ACTOR_IDENTITIES.system;
  }
  if (category === "VERIFICATION" || eventType.startsWith("POST_DEPLOY_VERIFICATION")) {
    return ACTOR_IDENTITIES.security_truth;
  }
  if (actorName === "Security Observatory") {
    return ACTOR_IDENTITIES.security_truth;
  }

  const key = ACTOR_NAME_TO_KEY[actorName];
  if (key) {
    return ACTOR_IDENTITIES[key];
  }

  const technicalMatch = TECHNICAL_ACTOR_PATTERNS.find(([pattern]) => pattern.test(actorName));
  if (technicalMatch) {
    return ACTOR_IDENTITIES[technicalMatch[1]];
  }

  // Unmapped but still a real, trusted backend-supplied display name.
  return { key: "unknown", label: actorName || "System", icon: RiInformationLine, variant: "neutral" };
}

export function actorIdentityForKey(key) {
  return ACTOR_IDENTITIES[key] || ACTOR_IDENTITIES.system;
}
