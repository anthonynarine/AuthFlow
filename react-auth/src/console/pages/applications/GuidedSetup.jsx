import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "../../components/ui/primitives";
import { BackendSetupInstructions } from "../../../components/workspace/onboarding/BackendSetupInstructions";
import { fetchSetupHelp } from "../../api/consoleApi";
import { useApplications, useCreateApplication } from "./useApplications";

const STEPS = [
    ["install", "Install the SDK"], ["storage", "Save the key in backend secrets"],
    ["configure", "Configure and restart the backend"], ["verify", "Run the identity check in your terminal"],
    ["production", "Prepare the production connection"],
];
const ISSUES = [["explain", "Explain this step"], ["missing_key", "Key is missing"], ["rejected_key", "Key was rejected"],
    ["connectivity", "Cannot reach Gait"], ["wrong_identity", "Wrong application or environment"]];

function SetupProgress({ organizationSlug, application, framework, canManage, activity, credentials }) {
    const [completed, setCompleted] = useState([]);
    const [step, setStep] = useState("install");
    const [issue, setIssue] = useState("explain");
    const [help, setHelp] = useState(null);
    const [pending, setPending] = useState(false);
    const alive = useRef(true);
    useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
    const stepIndex = STEPS.findIndex(([value]) => value === step);
    const chooseStep = (value) => { setStep(value); setHelp(null); setIssue("explain"); };
    const applications = useApplications(organizationSlug);
    const create = useCreateApplication(organizationSlug);
    const production = applications.data?.find((candidate) => candidate.slug === application.slug && candidate.environment === "production");
    const observed = (!activity.isError && activity.data?.has_activity) ||
        (canManage && !credentials.isError && credentials.data?.some((credential) => credential.last_used_at));
    const requestHelp = async () => {
        setPending(true);
        setHelp(null);
        try {
            const result = await fetchSetupHelp(organizationSlug, application.id, { framework, step, issue });
            if (alive.current) setHelp(result && typeof result.explanation === "string"
                ? { source: result.source === "ai" ? "ai" : "guide", explanation: result.explanation }
                : { source: "guide", explanation: "Help is unavailable. Follow the connection guide and retry later." });
        } catch {
            if (alive.current) setHelp({ source: "guide", explanation: "Help is unavailable. Check your backend configuration using the instructions below, then retry. Never share your key or secret configuration." });
        } finally { if (alive.current) setPending(false); }
    };
    return <>
        <p>Use your saved connection key. This guide never issues a key or deploys your application.</p>
        <nav aria-label="Setup steps"><ol className="gc-setup-steps">
            {STEPS.map(([value, label], index) => <li key={value}><button type="button" className="gc-button gc-button--ghost" aria-current={step === value ? "step" : undefined} disabled={pending} onClick={() => chooseStep(value)}>{index + 1}. {label}</button></li>)}
        </ol></nav>
        <h3>Step {stepIndex + 1} of {STEPS.length}: {STEPS[stepIndex][1]}</h3>
        {step !== "production" ? <BackendSetupInstructions frameworkKey={framework} onChoose={() => {}} organizationSlug={organizationSlug} application={application} hideFrameworkChoice stepIndex={stepIndex} /> : null}
        <fieldset><legend>Your setup checklist</legend>
            {STEPS.map(([value, label]) => <div key={value}><label><input type="checkbox" checked={completed.includes(value)}
                onChange={(event) => setCompleted(event.target.checked ? [...completed, value] : completed.filter((item) => item !== value))} /> {label}</label></div>)}
        </fieldset>
        <p className="gc-muted">Checkmarks are your acknowledgements, not verified connection status. Progress lasts only while this guide is open.</p>
        <p role="status">{observed ? "Gait has recorded credential use or a security report for this application. This does not confirm the configuration of your current server." : "No connection evidence is currently available. Run the identity check in your backend terminal."}</p>
        {step === "production" ? application.environment !== "production" ? <section aria-label="Production connection">
            <h3>Prepare production</h3>
            <p>Use a separate production application and key in the same workspace. Put the production key in your host's secret settings, restart the backend, and run the identity check there with environment production. Local success does not verify production.</p>
            {applications.isLoading ? <p>Looking for the production application…</p> : applications.isError ? <><p role="alert">Could not load applications.</p><button type="button" onClick={() => applications.refetch()}>Retry application lookup</button></> : production ?
                <Link to={`/console/${encodeURIComponent(organizationSlug)}/applications/${encodeURIComponent(production.id)}?env=production`}>Open production application</Link> :
                <button type="button" className="gc-button" disabled={!canManage || application.status !== "ACTIVE" || create.isPending}
                    onClick={() => create.mutate({ name: application.name, slug: application.slug, environment: "production" })}>Create production application</button>}
            {!canManage ? <p>Only Owners and Admins can create the production application.</p> : null}
            {create.isError ? <p role="alert">Production creation failed. Retry, or refresh the application lookup if it already exists.</p> : null}
        </section> : <p>For production, store this application's key in your host's secret settings and run the identity check from the deployed backend.</p> : null}
        <section aria-label="Setup help"><h3>Help with a step</h3>
            <p>Help for: {STEPS[stepIndex][1]}</p>
            <label>Question <select value={issue} disabled={pending} onChange={(event) => { setIssue(event.target.value); setHelp(null); }}>{ISSUES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <button type="button" className="gc-button" disabled={!canManage || pending} onClick={requestHelp}>{pending ? "Getting help…" : "Get setup help"}</button>
            {!canManage ? <p>Setup help requests are available to Owners and Admins.</p> : null}
            {help ? <div role="status"><strong>{help.source === "ai" ? "AI explanation" : "Connection guide"}</strong><p>{help.explanation}</p><p className="gc-muted">Explanations do not verify connections or authorize changes. Check commands against the guide before running them.</p></div> : null}
        </section>
        <div className="gc-secret-actions">
            <button type="button" className="gc-button gc-button--ghost" disabled={pending || stepIndex === 0} onClick={() => chooseStep(STEPS[stepIndex - 1][0])}>Back</button>
            <button type="button" className="gc-button gc-button--primary" disabled={pending || stepIndex === STEPS.length - 1} onClick={() => chooseStep(STEPS[stepIndex + 1][0])}>Next</button>
        </div>
    </>;
}

/** Progress is memory only, scoped by mounted application and framework. No secret inputs. */
export function GuidedSetup(props) {
    const [open, setOpen] = useState(false);
    const [framework, setFramework] = useState("django");
    return <Card title="Security reporting setup"><p>Connect your software’s security reporting with a backend connection key. Set up human sign-in separately below.</p><button type="button" className="gc-button" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? "Close setup guide" : "Guide security reporting"}</button>
        {open ? <section aria-label="Guided connection setup">
            <div role="group" aria-label="Guide framework">{["django", "fastapi"].map((value) => <button type="button" className="gc-button" key={value} aria-pressed={framework === value} onClick={() => setFramework(value)}>{value === "django" ? "Django" : "FastAPI"}</button>)}</div>
            <SetupProgress key={`${props.organizationSlug}/${props.application.id}/${props.application.environment}/${props.canManage}/${framework}`} {...props} framework={framework} />
        </section> : null}
    </Card>;
}
