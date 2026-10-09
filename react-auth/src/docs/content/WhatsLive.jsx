import React from "react";
import { DocLink, DocSection, DocTable, StatusBadge } from "../components/DocPrimitives";
import { FEATURE_INFO, statusAsOfLabel } from "../featureStatus";
import { CHANGELOG } from "../changelog";
import { findDocPage } from "../manifest";

// Everything here is read from featureStatus.js (status) and changelog.js
// (history). Nothing on this page states a status of its own.

function dateLabel(isoDate) {
    const [year, month, day] = isoDate.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
    });
}

export default function WhatsLive() {
    return (
        <>
            <p className="doc-lede">What works today, and what has changed recently.</p>

            <DocSection id="status" title="What's live">
                <p>
                    <StatusBadge status="live" /> means it works today.{" "}
                    <StatusBadge status="earlyAccess" /> means it's in early use and may still change.{" "}
                    <StatusBadge status="inDevelopment" /> means it works in an app that is itself still in development.{" "}
                    <StatusBadge status="inProgress" /> means it's built but not yet running.{" "}
                    <StatusBadge status="pending" /> means it isn't available yet.
                </p>
                <DocTable caption="What's live">
                    <thead>
                        <tr>
                            <th scope="col">Feature</th>
                            <th scope="col">What it covers</th>
                            <th scope="col">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.keys(FEATURE_INFO).map((key) => {
                            const info = FEATURE_INFO[key];
                            return (
                                <tr key={key}>
                                    <th scope="row">
                                        <DocLink to={info.doc}>{info.name}</DocLink>
                                    </th>
                                    <td>{info.summary}</td>
                                    <td>
                                        <StatusBadge feature={key} />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </DocTable>
                <p className="doc-muted">
                    Status as of {statusAsOfLabel()}.
                </p>
            </DocSection>

            <DocSection id="changelog" title="Changelog">
                <p>
                    Changes that reached gaitobservatory.com, newest first. The badges show each feature's status
                    today.
                </p>
                <DocTable caption="Changelog">
                    <thead>
                        <tr>
                            <th scope="col">Date</th>
                            <th scope="col">Change</th>
                            <th scope="col">Status today</th>
                        </tr>
                    </thead>
                    <tbody>
                        {CHANGELOG.map((entry) => (
                            <tr key={`${entry.date} ${entry.change}`}>
                                <th scope="row">
                                    <time dateTime={entry.date}>{dateLabel(entry.date)}</time>
                                </th>
                                <td>
                                    {entry.change}
                                    {entry.doc && (
                                        <>
                                            {" "}
                                            <DocLink to={entry.doc}>{findDocPage(entry.doc.split("#")[0]).title}</DocLink>
                                        </>
                                    )}
                                </td>
                                <td>
                                    {entry.features.map((feature) => (
                                        <StatusBadge key={feature} feature={feature} />
                                    ))}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </DocTable>
            </DocSection>
        </>
    );
}
