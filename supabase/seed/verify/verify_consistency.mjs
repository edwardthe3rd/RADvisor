/**
 * Data-integrity lint for operators.json acquisition flags + subcategories.
 *
 *   node supabase/seed/verify/verify_consistency.mjs
 *
 * Flags structural problems (not website accuracy): leftover "(Demo Only)"
 * suffixes, flags set without a category, operators that offer nothing,
 * subcategories outside their category's taxonomy, or `_demo`/`_lease` variants
 * mistakenly stored as subcategory tags. Writes verify/consistency_report.md and
 * exits non-zero when issues are found.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { verifyDir, operatorsPath, SUBCATEGORY_KEYWORDS } from "./lib.mjs";

const operators = JSON.parse(readFileSync(operatorsPath, "utf8"));
const allowedByCategory = Object.fromEntries(
  Object.entries(SUBCATEGORY_KEYWORDS).map(([cat, m]) => [cat, new Set(Object.keys(m))]),
);

const issues = [];
function flag(op, msg) {
  issues.push({ slug: op.slug, name: op.name, msg });
}

for (const op of operators) {
  const cats = op.categories || [];
  const subs = op.subcategories || [];
  const active = op.is_active !== false;
  const offersRental = op.offers_rental !== false;
  const offersDemo = op.offers_demo === true;
  const offersLease = op.offers_season_lease === true;

  if (/\(Demo Only\)/i.test(op.name || ""))
    flag(op, 'name still contains "(Demo Only)" — express via offers_demo/offers_rental');

  if (active && (offersDemo || offersLease) && cats.length === 0)
    flag(op, "demo/lease flag set but categories is empty");

  if (active && cats.length && !offersRental && !offersDemo && !offersLease)
    flag(op, "categorized but offers nothing (rental/demo/lease all false)");

  for (const s of subs) {
    if (s.endsWith("_demo") || s.endsWith("_lease")) {
      flag(op, `subcategory "${s}" is an acquisition variant — store the base + a flag instead`);
      continue;
    }
    const inSomeCategory = cats.some((c) => allowedByCategory[c]?.has(s));
    if (!inSomeCategory)
      flag(op, `subcategory "${s}" not in the taxonomy of its categories [${cats.join(", ")}]`);
  }
}

let md = `# operators.json consistency report

Generated: ${new Date().toISOString().slice(0, 10)} · ${operators.length} operators · ${issues.length} issue(s)

`;
if (!issues.length) {
  md += "✅ No structural issues found.\n";
} else {
  md += "| Operator | Slug | Issue |\n|------|------|------|\n";
  for (const i of issues) {
    md += `| ${(i.name || "").replace(/\|/g, "/")} | \`${i.slug}\` | ${i.msg.replace(/\|/g, "/")} |\n`;
  }
}

const reportPath = join(verifyDir, "consistency_report.md");
writeFileSync(reportPath, md);
console.log(`${issues.length} issue(s). Report: ${reportPath}`);
for (const i of issues) console.log(`  ${i.slug}: ${i.msg}`);
process.exit(issues.length ? 1 : 0);
