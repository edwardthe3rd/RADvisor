/**
 * Offline category-rule tuner. Tries several ways of combining the rental-context
 * and full-blob category detections (both stored in dataset.json) against the DB
 * categories, so the best rule can be picked WITHOUT re-fetching. Read-only.
 *
 *   node supabase/seed/verify/intake/tune_categories.mjs
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const intakeDir = dirname(fileURLToPath(import.meta.url));
const ds = JSON.parse(readFileSync(join(intakeDir, "dataset.json"), "utf8")).rows;
const act = ds.filter((r) => r.is_active && r.categories.length);

const CATEGORY_DOMAIN = {
  snow_sports: "snow", winter_other: "snow", water_sports: "water",
  mountain_biking: "cyc", road_cycling: "cyc", electric_transport: "cyc",
  burning_man_bikes: "cyc", motorcycles: "moto", off_road: "moto",
  rock_climbing: "climb", camping: "camp", aerial: "air",
};
const TYPE_ALLOWED_DOMAINS = { bicycle_store: ["cyc"], marina: ["water"], ski_resort: ["snow"] };
function gate(cats, pt) {
  const a = TYPE_ALLOWED_DOMAINS[pt];
  return a ? cats.filter((c) => a.includes(CATEGORY_DOMAIN[c])) : cats;
}

const keys = (o) => Object.keys(o || {});
const RULES = {
  "ctx only": (r) => keys(r.ctxSubcatsByCat),
  "blob only": (r) => keys(r.blobSubcatsByCat),
  "ctx, fallback blob": (r) =>
    keys(r.ctxSubcatsByCat).length ? keys(r.ctxSubcatsByCat) : keys(r.blobSubcatsByCat),
  "union(ctx,blob)": (r) => [...new Set([...keys(r.ctxSubcatsByCat), ...keys(r.blobSubcatsByCat)])],
  "ctx ∪ blob(>=2 subcats)": (r) => [
    ...new Set([
      ...keys(r.ctxSubcatsByCat),
      ...Object.entries(r.blobSubcatsByCat || {}).filter(([, s]) => s.length >= 2).map(([c]) => c),
    ]),
  ],
  "ctx ∪ blob(if webRental)": (r) => [
    ...new Set([...keys(r.ctxSubcatsByCat), ...(r.webRental ? keys(r.blobSubcatsByCat) : [])]),
  ],
};

function score(ruleFn) {
  let exact = 0, falseC = 0, missing = 0, opsFalse = 0, opsMissing = 0, empty = 0;
  for (const r of act) {
    const det = new Set(gate(ruleFn(r), r.primaryType));
    if (!det.size) empty++;
    const db = new Set(r.categories);
    const ex = [...det].filter((c) => !db.has(c));
    const mi = [...db].filter((c) => !det.has(c));
    falseC += ex.length; missing += mi.length;
    if (ex.length) opsFalse++;
    if (mi.length) opsMissing++;
    if (!ex.length && !mi.length) exact++;
  }
  return { exact, falseC, missing, opsFalse, opsMissing, empty };
}

console.log(`Active labeled operators: ${act.length}\n`);
console.log("rule".padEnd(26) + "exact  falseCats missing opsFalse opsMissing emptyCats");
for (const [name, fn] of Object.entries(RULES)) {
  const s = score(fn);
  console.log(
    name.padEnd(26) +
      `${String(s.exact).padStart(4)}  ${String(s.falseC).padStart(8)} ${String(s.missing).padStart(7)} ${String(s.opsFalse).padStart(8)} ${String(s.opsMissing).padStart(10)} ${String(s.empty).padStart(9)}`,
  );
}
