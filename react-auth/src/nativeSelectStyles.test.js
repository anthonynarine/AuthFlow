import fs from "fs";
import path from "path";

test("single native selects reserve text space and inset the chevron, excluding listboxes", () => {
 const css = fs.readFileSync(path.join(__dirname, "index.css"), "utf8");
 const shared = css.slice(css.indexOf("/* Shared native single-select spacing."));
 expect(shared).toContain('select:not([multiple]):not([size])');
 expect(shared).toContain('select:not([multiple])[size="1"]');
 expect(shared).toContain("background-position: right 21px center, right 16px center");
 expect(shared).toContain("padding-inline-end: 42px");
 expect(shared).toContain("@media (forced-colors: active)");
 expect(shared).toContain("appearance: auto");
});
