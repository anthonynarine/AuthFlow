import React, { useState } from "react";
import { useSecurityEvidence } from "../../hooks/useSecurityEvidence";
import { useSecurityEvidenceDetail } from "../../hooks/useSecurityEvidenceDetail";
import { useSecurityHelp } from "../../hooks/useSecurityHelp";
import { SecurityEvidenceFilters } from "./SecurityEvidenceFilters";
import { SecurityEvidenceTable } from "./SecurityEvidenceTable";
import { SecurityEvidenceDetailModal } from "./SecurityEvidenceDetailModal";
import { SecurityInfoButton } from "./SecurityInfoButton";

export function SecurityEvidenceSection() {
  const evidence = useSecurityEvidence();
  const evidenceDetail = useSecurityEvidenceDetail();
  const help = useSecurityHelp();
  const evidenceHelpTopic = help.getTopic("evidence");
  const [selectedEvidenceId, setSelectedEvidenceId] = useState(null);

  const handleSelectEvidence = (item) => {
    setSelectedEvidenceId(item.id);
  };

  const handleClose = () => {
    setSelectedEvidenceId(null);
    evidenceDetail.clearEvidence();
  };

  return (
    <section className="security-panel" aria-labelledby="security-evidence-heading">
      <div className="security-section-heading">
        <div>
          <p className="security-eyebrow">Security Evidence</p>
          <h2 id="security-evidence-heading">Evidence</h2>
        </div>
        {evidenceHelpTopic && <SecurityInfoButton title="Security Evidence" content={evidenceHelpTopic} />}
      </div>
      <SecurityEvidenceFilters
        filters={evidence.filters}
        onChange={evidence.updateFilter}
        onReset={evidence.resetFilters}
      />
      <SecurityEvidenceTable
        evidence={evidence.evidence}
        count={evidence.count}
        page={evidence.page}
        pageSize={evidence.pageSize}
        next={evidence.next}
        previous={evidence.previous}
        isLoading={evidence.isLoading}
        error={evidence.error}
        onPageChange={evidence.setPage}
        onSelectEvidence={handleSelectEvidence}
        onRetry={evidence.refetch}
      />
      <SecurityEvidenceDetailModal
        evidenceId={selectedEvidenceId}
        evidence={evidenceDetail.evidence}
        isLoading={evidenceDetail.isLoading}
        error={evidenceDetail.error}
        onLoad={evidenceDetail.fetchEvidence}
        onClose={handleClose}
      />
    </section>
  );
}
