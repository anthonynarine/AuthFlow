import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { RiArrowGoBackLine, RiShieldKeyholeLine } from "react-icons/ri";
import { useBasicAuthServices } from "../../context/auth/BasicAuthContext";
import { useUserSessionServices } from "../../context/auth/UserSessionContext";
import { usePlaybookCatalog } from "../../hooks/usePlaybookCatalog";
import { useExerciseRunHistory } from "../../hooks/useExerciseRunHistory";
import { useScheduleList } from "../../hooks/useScheduleList";
import { useScheduleMutations } from "../../hooks/useScheduleMutations";
import { SecurityErrorState } from "../security/SecurityErrorState";
import { SecurityPageSwitcher } from "../security/SecurityPageSwitcher";
import { AccountMenu } from "../../account/AccountMenu";
import { ExerciseCatalogFilters } from "./ExerciseCatalogFilters";
import { PlaybookCatalogList } from "./PlaybookCatalogList";
import { PlaybookDetailModal } from "./PlaybookDetailModal";
import { RunExerciseModal } from "./RunExerciseModal";
import { ExerciseRunHistoryTable } from "./ExerciseRunHistoryTable";
import { ExerciseRunDetailModal } from "./ExerciseRunDetailModal";
import { ScheduleList } from "./ScheduleList";
import { CreateScheduleModal } from "./CreateScheduleModal";
import { ScheduleDetailModal } from "./ScheduleDetailModal";
import { ScheduleOccurrenceHistoryModal } from "./ScheduleOccurrenceHistoryModal";
import { canRunSecurityExercises } from "./securityExerciseLabels";
import "../security/SecurityObservatory.css";
import "./SecurityExercises.css";

const SECTIONS = [
  { key: "catalog", label: "Catalog" },
  { key: "history", label: "Run History" },
  { key: "schedules", label: "Schedules" },
];

function isForbidden(...errors) {
  return errors.some((error) => error?.response?.status === 403);
}

export function SecurityExercisesPage() {
  const { user } = useBasicAuthServices();
  const { validateSession } = useUserSessionServices();
  const catalog = usePlaybookCatalog();
  const history = useExerciseRunHistory();
  const schedules = useScheduleList();
  const listMutations = useScheduleMutations();

  const [activeSection, setActiveSection] = useState("catalog");
  const [detailPlaybook, setDetailPlaybook] = useState(null);
  const [runPlaybook, setRunPlaybook] = useState(null);
  const [selectedRunId, setSelectedRunId] = useState(null);
  const [selectedRunPreview, setSelectedRunPreview] = useState(null);
  const [createScheduleOpen, setCreateScheduleOpen] = useState(false);
  const [detailSchedule, setDetailSchedule] = useState(null);
  const [occurrenceSchedule, setOccurrenceSchedule] = useState(null);

  const canRunExercises = canRunSecurityExercises(user);

  useEffect(() => {
    validateSession().catch(() => {});
  }, [validateSession]);

  const forbidden = isForbidden(catalog.error, history.error, schedules.error);

  if (forbidden) {
    return (
      <main className="security-page">
        <section className="security-shell">
          <Link to="/" className="security-back-link">
            <RiArrowGoBackLine /> Home
          </Link>
          <SecurityErrorState error={{ response: { status: 403 } }} />
        </section>
      </main>
    );
  }

  const openRunFromCatalog = (playbook) => {
    setDetailPlaybook(null);
    setRunPlaybook(playbook);
  };

  const handleRunSettled = () => {
    // Backend remains authoritative: refetch history rather than
    // inferring the new run's place in the list from client state.
    history.refetch().catch(() => {});
  };

  const openScheduleDetail = (schedule) => {
    setOccurrenceSchedule(null);
    setDetailSchedule(schedule);
  };

  const openScheduleOccurrences = (schedule) => {
    setDetailSchedule(null);
    setOccurrenceSchedule(schedule);
  };

  // Reuses the existing Run Detail dialog for occurrence -> run lineage
  // rather than a second representation. Only the run id is known here
  // (no initialRun preview), so the dialog shows its own loading state
  // until it fetches the real run.
  const viewRunById = (runId) => {
    setDetailSchedule(null);
    setOccurrenceSchedule(null);
    setSelectedRunPreview(null);
    setSelectedRunId(runId);
  };

  const handleScheduleCreated = () => {
    schedules.refetch().catch(() => {});
  };

  const handleScheduleUpdated = (updatedSchedule) => {
    setDetailSchedule(updatedSchedule);
    schedules.refetch().catch(() => {});
  };

  const handleScheduleToggled = async (schedule, nextEnabled) => {
    await listMutations.updateSchedule(schedule.id, { enabled: nextEnabled });
    schedules.refetch().catch(() => {});
  };

  return (
    <main className="security-page">
      <section className="security-shell">
        <header className="security-header">
          <div>
            <Link to="/" className="security-back-link">
              <RiArrowGoBackLine /> Home
            </Link>
            <p className="security-kicker">
              <RiShieldKeyholeLine /> Gait Security
            </p>
            <h1>Security Exercises</h1>
            <p>Browse the approved adversarial verification catalog and run governed, bounded exercises.</p>
          </div>
          <div className="security-header-actions">
            <AccountMenu status={!canRunExercises ? "View only" : null} />
          </div>
        </header>

        <SecurityPageSwitcher current="exercises" user={user} />

        <nav className="security-nav" aria-label="Security Exercises sections">
          {SECTIONS.map((section) => {
            const isActive = section.key === activeSection;
            return (
              <button
                key={section.key}
                type="button"
                className={`security-tab${isActive ? " active" : ""}`}
                aria-current={isActive ? "page" : undefined}
                onClick={() => setActiveSection(section.key)}
              >
                {section.label}
              </button>
            );
          })}
        </nav>

        {activeSection === "catalog" && (
          <section className="security-panel" aria-labelledby="exercise-catalog-heading">
            <div className="security-section-heading">
              <div>
                <p className="security-eyebrow">Playbook Catalog</p>
                <h2 id="exercise-catalog-heading">Approved Adversarial Verification</h2>
              </div>
            </div>
            <ExerciseCatalogFilters
              filters={catalog.filters}
              onChange={catalog.updateFilter}
              onReset={catalog.resetFilters}
            />
            <PlaybookCatalogList
              playbooks={catalog.playbooks}
              isLoading={catalog.isLoading}
              error={catalog.error}
              isStale={catalog.isStale}
              onRetry={catalog.refetch}
              onViewDetails={setDetailPlaybook}
              onRunExercise={openRunFromCatalog}
              canRun={canRunExercises}
            />
          </section>
        )}

        {activeSection === "history" && (
          <section className="security-panel" aria-labelledby="exercise-history-heading">
            <div className="security-section-heading">
              <div>
                <p className="security-eyebrow">Run History</p>
                <h2 id="exercise-history-heading">Recent Exercise Runs</h2>
              </div>
            </div>
            <ExerciseRunHistoryTable
              runs={history.runs}
              isLoading={history.isLoading}
              error={history.error}
              isStale={history.isStale}
              onRetry={history.refetch}
              onSelectRun={(run) => {
                setSelectedRunPreview(run);
                setSelectedRunId(run.id);
              }}
            />
          </section>
        )}

        {activeSection === "schedules" && (
          <section className="security-panel" aria-labelledby="exercise-schedules-heading">
            <div className="security-section-heading">
              <div>
                <p className="security-eyebrow">Schedules</p>
                <h2 id="exercise-schedules-heading">Continuous Security Exercises</h2>
                <p className="security-muted">
                  A schedule requests an approved playbook on a bounded cadence. Every occurrence still passes
                  through the same governed run path as a manual exercise -- Incident Commander, Red Team, and the
                  Agent Gateway.
                </p>
              </div>
              <div className="security-section-heading-actions">
                {canRunExercises && (
                  <button type="button" className="security-button primary" onClick={() => setCreateScheduleOpen(true)}>
                    + Create Schedule
                  </button>
                )}
                <button type="button" className="security-button secondary" onClick={() => schedules.refetch().catch(() => {})}>
                  Refresh
                </button>
              </div>
            </div>
            <ScheduleList
              schedules={schedules.schedules}
              playbooks={catalog.playbooks}
              isLoading={schedules.isLoading}
              error={schedules.error}
              isStale={schedules.isStale}
              canManage={canRunExercises}
              onRetry={schedules.refetch}
              onView={openScheduleDetail}
              onViewOccurrences={openScheduleOccurrences}
              onViewRun={viewRunById}
              onToggleEnabled={handleScheduleToggled}
            />
          </section>
        )}
      </section>

      <CreateScheduleModal
        open={createScheduleOpen}
        playbooks={catalog.playbooks}
        onClose={() => setCreateScheduleOpen(false)}
        onCreated={handleScheduleCreated}
      />

      <ScheduleDetailModal
        schedule={detailSchedule}
        playbooks={catalog.playbooks}
        canManage={canRunExercises}
        onClose={() => setDetailSchedule(null)}
        onUpdated={handleScheduleUpdated}
        onViewOccurrences={openScheduleOccurrences}
      />

      <ScheduleOccurrenceHistoryModal
        schedule={occurrenceSchedule}
        onClose={() => setOccurrenceSchedule(null)}
        onViewRun={viewRunById}
      />

      <PlaybookDetailModal
        playbook={detailPlaybook}
        onClose={() => setDetailPlaybook(null)}
        onRunExercise={openRunFromCatalog}
        canRun={canRunExercises}
      />

      <RunExerciseModal
        playbook={runPlaybook}
        onClose={() => setRunPlaybook(null)}
        onRunSettled={handleRunSettled}
      />

      <ExerciseRunDetailModal
        runId={selectedRunId}
        initialRun={selectedRunPreview}
        onClose={() => {
          setSelectedRunId(null);
          setSelectedRunPreview(null);
        }}
      />
    </main>
  );
}

export default SecurityExercisesPage;
