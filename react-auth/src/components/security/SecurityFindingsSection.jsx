import React, { useState } from "react";
import { useSecurityFindings } from "../../hooks/useSecurityFindings";
import { useSecurityFindingDetail } from "../../hooks/useSecurityFindingDetail";
import { useSecurityDomains } from "../../hooks/useSecurityDomains";
import { useSecurityHelp } from "../../hooks/useSecurityHelp";
import { SecurityFindingsFilters } from "./SecurityFindingsFilters";
import { SecurityFindingsTable } from "./SecurityFindingsTable";
import { SecurityFindingDetailModal } from "./SecurityFindingDetailModal";
import { SecurityInfoButton } from "./SecurityInfoButton";

export function SecurityFindingsSection() {
  const findings = useSecurityFindings();
  const domains = useSecurityDomains();
  const findingDetail = useSecurityFindingDetail();
  const help = useSecurityHelp();
  const findingsHelpTopic = help.getTopic("findings");
  const [selectedFindingId, setSelectedFindingId] = useState(null);

  const handleSelectFinding = (finding) => {
    setSelectedFindingId(finding.id);
  };

  const handleClose = () => {
    setSelectedFindingId(null);
    findingDetail.clearFinding();
  };

  return (
    <section className="security-panel" aria-labelledby="security-findings-heading">
      <div className="security-section-heading">
        <div>
          <p className="security-eyebrow">Security Findings</p>
          <h2 id="security-findings-heading">Findings</h2>
        </div>
        {findingsHelpTopic && <SecurityInfoButton title="Security Findings" content={findingsHelpTopic} />}
      </div>
      <SecurityFindingsFilters
        filters={findings.filters}
        domains={domains.domains}
        onChange={findings.updateFilter}
        onReset={findings.resetFilters}
      />
      <SecurityFindingsTable
        findings={findings.findings}
        count={findings.count}
        page={findings.page}
        pageSize={findings.pageSize}
        next={findings.next}
        previous={findings.previous}
        isLoading={findings.isLoading}
        error={findings.error}
        onPageChange={findings.setPage}
        onSelectFinding={handleSelectFinding}
        onRetry={findings.refetch}
      />
      <SecurityFindingDetailModal
        findingId={selectedFindingId}
        finding={findingDetail.finding}
        isLoading={findingDetail.isLoading}
        error={findingDetail.error}
        onLoad={findingDetail.fetchFinding}
        onClose={handleClose}
      />
    </section>
  );
}
