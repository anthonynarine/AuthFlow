import React, { useState } from "react";
import { useSecurityEvidence } from "../../hooks/useSecurityEvidence";
import { useSecurityEvidenceDetail } from "../../hooks/useSecurityEvidenceDetail";
import { SecurityEvidenceFilters } from "./SecurityEvidenceFilters";
import { SecurityEvidenceTable } from "./SecurityEvidenceTable";
import { SecurityEvidenceDetailModal } from "./SecurityEvidenceDetailModal";

export function SecurityEvidenceSection() {
  const evidence = useSecurityEvidence();
  const evidenceDetail = useSecurityEvidenceDetail();
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
