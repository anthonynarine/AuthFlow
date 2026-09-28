import React, { useState } from "react";
import { Alert, Button } from "../ds/components";

/** Plain text for copy and download: one code per line, with who and when. */
export function recoveryCodesText(codes, { email, date = new Date() } = {}) {
    const header = [
        "Gait recovery codes",
        email ? `Account: ${email}` : null,
        `Created: ${date.toISOString().slice(0, 10)}`,
        "Each code works once. Keep them somewhere safe, away from this device.",
        "",
    ].filter((line) => line !== null);
    return [...header, ...codes].join("\n") + "\n";
}

/**
 * Recovery codes, shown once. Copy and "Download as .txt" (made in the
 * browser; nothing is uploaded), and Finish only after "I've saved them".
 * The codes live only in this component's props: never stored or logged.
 */
export function RecoveryCodes({ codes, email, onFinish }) {
    const [saved, setSaved] = useState(false);
    const [note, setNote] = useState("");

    const text = () => recoveryCodesText(codes, { email });

    const onCopy = async () => {
        try {
            await navigator.clipboard.writeText(text());
            setNote(`Copied ${codes.length} codes. Paste them into your password manager.`);
        } catch {
            setNote("Copying didn't work here. Select the codes and copy them, or download them instead.");
        }
    };

    const onDownload = () => {
        const url = URL.createObjectURL(new Blob([text()], { type: "text/plain" }));
        const link = document.createElement("a");
        link.href = url;
        link.download = "gait-recovery-codes.txt";
        link.click();
        URL.revokeObjectURL(url);
        setNote("Downloaded gait-recovery-codes.txt.");
    };

    return (
        <>
            <ol className="ds-codes" aria-label="Recovery codes">
                {codes.map((code) => (
                    <li key={code}>{code}</li>
                ))}
            </ol>
            <div className="ds-row-actions">
                <Button kind="secondary" small onClick={onCopy}>Copy codes</Button>
                <Button kind="secondary" small onClick={onDownload}>Download as .txt</Button>
            </div>
            <p className="ds-visually-hidden" role="status" aria-live="polite">{note}</p>
            {note ? <Alert kind="success">{note}</Alert> : null}
            <label className="ds-check">
                <input type="checkbox" checked={saved} onChange={(event) => setSaved(event.target.checked)} />
                <span>I've saved these codes somewhere safe, outside this device.</span>
            </label>
            <div className="ds-actions">
                <Button onClick={onFinish} disabled={!saved} aria-describedby={saved ? undefined : "ds-codes-why"}>
                    Finish
                </Button>
                {saved ? null : (
                    <p className="ds-hint" id="ds-codes-why">Tick the box once the codes are saved. You won't see them again.</p>
                )}
            </div>
        </>
    );
}

export default RecoveryCodes;
