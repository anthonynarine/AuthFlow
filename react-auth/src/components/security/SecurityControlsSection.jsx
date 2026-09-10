import React, { useState } from "react";
import { useSecurityControls } from "../../hooks/useSecurityControls";
import { useSecurityControlDetail } from "../../hooks/useSecurityControlDetail";
import { useSecurityDomains } from "../../hooks/useSecurityDomains";
import { useSecurityHelp } from "../../hooks/useSecurityHelp";
import { SecurityControlsFilters } from "./SecurityControlsFilters";
import { SecurityControlsTable } from "./SecurityControlsTable";
import { SecurityControlDetailModal } from "./SecurityControlDetailModal";
import { SecurityInfoButton } from "./SecurityInfoButton";

export function SecurityControlsSection() {
  const controls = useSecurityControls();
  const domains = useSecurityDomains();
  const controlDetail = useSecurityControlDetail();
  const help = useSecurityHelp();
  const controlsHelpTopic = help.getTopic("controls");
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
        {controlsHelpTopic && <SecurityInfoButton title="Security Controls" content={controlsHelpTopic} />}
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
