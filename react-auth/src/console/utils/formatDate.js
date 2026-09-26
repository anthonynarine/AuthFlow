const FORMAT = new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
});

/** "26 Sep 2026, 15:06" in the viewer's locale and time zone; "Never" when there's no date. */
export function formatDateTime(value) {
    if (!value) {
        return "Never";
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "Never" : FORMAT.format(date);
}
