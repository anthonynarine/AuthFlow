import React, { useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { EmptyState, PageHeader } from "../components/ui/primitives";
import { rememberLastOrganization } from "./ConsoleEntry";

/** Temporary content for console sections built in later stages (F1-F4). */
export function SectionPlaceholder({ title, description }) {
    const scope = useOutletContext();

    useEffect(() => {
        rememberLastOrganization(scope.orgSlug);
    }, [scope.orgSlug]);

    return (
        <>
            <PageHeader title={title} description={description} />
            <EmptyState title={`${title} is on its way`}>
                {scope.membership.name} · {scope.environment}
            </EmptyState>
        </>
    );
}

export default SectionPlaceholder;
