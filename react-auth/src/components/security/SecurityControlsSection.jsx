import React, { useState } from "react";
import { useSecurityControls } from "../../hooks/useSecurityControls";
import { useSecurityControlDetail } from "../../hooks/useSecurityControlDetail";
import { useSecurityDomains } from "../../hooks/useSecurityDomains";
import { SecurityControlsFilters } from "./SecurityControlsFilters";
import { SecurityControlsTable } from "./SecurityControlsTable";
import { SecurityControlDetailModal } from "./SecurityControlDetailModal";

export function SecurityControlsSection() {
  const controls = useSecurityControls();
  const domains = useSecurityDomains();
  const controlDetail = useSecurityControlDetail();
  const [selectedControlKey, setSelectedControlKey] = useState(null);

  const handleSelectControl = (control) => {
    setSelectedControlKey(control.control_key);
  };

  const handleClose = () => {
    setSelectedControlKey(null);
    controlDetail.clearControl();
  };

  return (
    <section className="security-panel" aria-labelledby="security-controls-heading">
      <div className="security-section-heading">
        <div>
          <p className="security-eyebrow">Security Controls</p>
          <h2 id="security-controls-heading">Controls</h2>
        </div>
      </div>
      <SecurityControlsFilters
        filters={controls.filters}
        domains={domains.domains}
        onChange={controls.updateFilter}
        onReset={controls.resetFilters}
      />
      <SecurityControlsTable
        controls={controls.controls}
        isLoading={controls.isLoading}
        error={controls.error}
        onSelectControl={handleSelectControl}
        onRetry={controls.refetch}
      />
      <SecurityControlDetailModal
        controlKey={selectedControlKey}
        control={controlDetail.control}
        isLoading={controlDetail.isLoading}
        error={controlDetail.error}
        onLoad={controlDetail.fetchControl}
        onClose={handleClose}
      />
    </section>
  );
}
