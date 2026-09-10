const NORMALIZATION_PASSES = [
  [/\bIncident Commander\b/g, "__INCIDENT_COMMANDER__"],
  [/\bSecurity Commander\b/g, "__INCIDENT_COMMANDER__"],
  [/(^|[^A-Za-z])Commander\b/g, "$1__INCIDENT_COMMANDER__"],
  [/\bBlue Team\b/g, "__BLUE_TEAM__"],
  [/\bInvestigator\b/g, "__BLUE_TEAM__"],
  [/\bRed Team\b/g, "__RED_TEAM__"],
  [/\bGreen Team\b/g, "__GREEN_TEAM__"],
  [/\bRepair Agent\b/g, "__GREEN_TEAM__"],
  [/\bRepair\b/g, "__GREEN_TEAM__"],
  [/\bSecurity Validator\b/g, "__SECURITY_VALIDATOR__"],
  [/(^|[^A-Za-z])Validator\b/g, "$1__SECURITY_VALIDATOR__"],
  [/\bHuman Approver\b/g, "__HUMAN_APPROVER__"],
  [/\bHuman Approval\b/gi, "__HUMAN_APPROVER__"],
  [/(^|[^A-Za-z])Human\b/g, "$1__HUMAN_APPROVER__"],
  [/\bRelease Engineer\b/g, "__RELEASE_ENGINEER__"],
  [/\bDeployer\b/g, "__RELEASE_ENGINEER__"],
  [/\bsecurity_commander_v1\b/gi, "__INCIDENT_COMMANDER__"],
  [/\bsecurity_investigator_v1\b/gi, "__BLUE_TEAM__"],
  [/\bsecurity_red_team_v1\b/gi, "__RED_TEAM__"],
  [/\bsecurity_repair_v1\b/gi, "__GREEN_TEAM__"],
  [/\bsecurity_validator_v1\b/gi, "__SECURITY_VALIDATOR__"],
  [/\bsecurity_deployer_v1\b/gi, "__RELEASE_ENGINEER__"],
  [/\bsecurity_staging_deployer_v1\b/gi, "__RELEASE_ENGINEER__"],
];

const PLACEHOLDER_REPLACEMENTS = [
  [/__INCIDENT_COMMANDER__/g, "Incident Commander"],
  [/__BLUE_TEAM__/g, "Blue Team"],
  [/__RED_TEAM__/g, "Red Team"],
  [/__GREEN_TEAM__/g, "Green Team"],
  [/__SECURITY_VALIDATOR__/g, "Security Validator"],
  [/__HUMAN_APPROVER__/g, "Human Approver"],
  [/__RELEASE_ENGINEER__/g, "Release Engineer"],
];

export function normalizeSecurityRoleText(value) {
  if (value === null || value === undefined) {
    return value;
  }
  const normalized = NORMALIZATION_PASSES.reduce(
    (text, [pattern, replacement]) => text.replace(pattern, replacement),
    String(value)
  );
  return PLACEHOLDER_REPLACEMENTS.reduce(
    (text, [pattern, replacement]) => text.replace(pattern, replacement),
    normalized
  );
}
