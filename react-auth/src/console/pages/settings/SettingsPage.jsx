import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, ErrorState, LoadingState, PageHeader } from "../../components/ui/primitives";
import { Field } from "../../components/ui/Field";
import { fetchOrganization, renameOrganization } from "../../api/consoleApi";
import { consoleKeys } from "../../api/queryKeys";
import { apiErrorMessage, apiFieldErrors } from "../../utils/apiErrors";
import { formatDateTime } from "../../utils/formatDate";
import { rememberLastOrganization } from "../ConsoleEntry";
import { ROLE_LABELS } from "../members/memberRules";
import "../members/Members.css";

const NAME_MAX = 160;

/** F4: company settings. Owners rename; everyone else reads. The slug never changes. */
export function SettingsPage() {
    const { orgSlug } = useOutletContext();
    const queryClient = useQueryClient();
    const organization = useQuery({
        queryKey: consoleKeys.organization(orgSlug),
        queryFn: () => fetchOrganization(orgSlug),
    });
    const rename = useMutation({
        mutationFn: (name) => renameOrganization(orgSlug, name),
        onSuccess: (updated) => {
            queryClient.setQueryData(consoleKeys.organization(orgSlug), updated);
            // The company switcher shows the name too.
            queryClient.invalidateQueries({ queryKey: consoleKeys.myOrganizations() });
        },
    });
    const [name, setName] = useState("");
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        rememberLastOrganization(orgSlug);
    }, [orgSlug]);
    useEffect(() => {
        if (organization.data) setName(organization.data.name);
    }, [organization.data]);

    const header = <PageHeader title="Settings" description="Your company's details." />;
    if (organization.isLoading) return <>{header}<LoadingState label="Loading settings…" /></>;
    if (organization.isError) return <>{header}<ErrorState error={organization.error} onRetry={organization.refetch} /></>;

    const data = organization.data;
    const isOwner = data.your_role === "OWNER";
    const trimmed = name.trim();
    const problem = !trimmed ? "Give the company a name." : trimmed.length > NAME_MAX ? `Use ${NAME_MAX} characters or fewer.` : null;
    const unchanged = trimmed === data.name;

    const onSubmit = async (event) => {
        event.preventDefault();
        setSaved(false);
        if (problem || unchanged) return;
        try {
            await rename.mutateAsync(trimmed);
            setSaved(true);
        } catch {
            // shown below
        }
    };

    return (
        <>
            {header}
            <Card title="Company">
                {isOwner ? (
                    <form onSubmit={onSubmit} noValidate className="gc-settings-form">
                        <Field label="Company name" error={(!unchanged && problem) || apiFieldErrors(rename.error).name}>
                            <input
                                className="gc-input"
                                value={name}
                                maxLength={NAME_MAX}
                                onChange={(event) => {
                                    setName(event.target.value);
                                    setSaved(false);
                                }}
                            />
                        </Field>
                        <div className="gc-badge-row">
                            <button type="submit" className="gc-button gc-button--primary" disabled={rename.isPending || unchanged || Boolean(problem)}>
                                {rename.isPending ? "Saving…" : "Save name"}
                            </button>
                            <span role="status" aria-live="polite" className="gc-muted">{saved ? "Saved." : ""}</span>
                        </div>
                        {rename.isError && !apiFieldErrors(rename.error).name ? (
                            <p className="gc-form-error" role="alert">{apiErrorMessage(rename.error)}</p>
                        ) : null}
                    </form>
                ) : (
                    <dl className="gc-meta">
                        <div><dt>Company name</dt><dd>{data.name}</dd></div>
                    </dl>
                )}
                <dl className="gc-meta gc-settings-meta">
                    <div>
                        <dt>URL slug</dt>
                        <dd><code className="gc-code">{data.slug}</code></dd>
                    </div>
                    <div><dt>Created</dt><dd>{formatDateTime(data.created_at)}</dd></div>
                    <div><dt>Your role</dt><dd>{ROLE_LABELS[data.your_role] || data.your_role}</dd></div>
                </dl>
                <p className="gc-muted gc-settings-note">
                    The slug can't be changed: it's how your company is identified in links and by your software.
                    {isOwner ? "" : " Only Owners can rename the company."}
                </p>
            </Card>
        </>
    );
}

export default SettingsPage;
