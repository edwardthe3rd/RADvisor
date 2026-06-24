#!/usr/bin/env node
/**
 * Coverage preview for the Pass A v2 sweep — DATA ONLY, no API calls, no cost.
 *
 *   node supabase/seed/quadtree_sweep_coverage.mjs
 *
 * Emits quadtree_sweep_coverage.geojson. Drag it into https://geojson.io to SEE,
 * before spending a cent, exactly what the sweep will cover:
 *
 *   RED  outlines  = AOI corridors (continuous coverage, no interior gaps)
 *   GREEN tiles    = the rectangle cells each query is actually restricted to
 *   one point      = summary (tile count, query count, baseline call estimate)
 *
 * Same AOI_RECTS / GRID_CONFIG / seedTiles() the runner uses, so the map is the
 * sweep — not an approximation of it.
 */

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { AOI_RECTS, GRID_CONFIG, QUERIES, SERVICE_AREA_TERMS, seedTiles } from "./quadtree_sweep_queries.mjs";

const seedDir = dirname(fileURLToPath(import.meta.url));
const outPath = join(seedDir, "quadtree_sweep_coverage.geojson");

// --- geometry helpers -------------------------------------------------------
const rectRing = (low, high) => [[
  [low.lng, low.lat],
  [high.lng, low.lat],
  [high.lng, high.lat],
  [low.lng, high.lat],
  [low.lng, low.lat],
]];

const poly =(coords, props) => ({ type: "Feature", properties: props, geometry: { type: "Polygon", coordinates: coords } });

// --- build features ---------------------------------------------------------
const tiles = seedTiles();
const features = [];

// Seed tiles — what every query is actually restricted to.
for (const t of tiles) {
  features.push(
    poly(rectRing(t.low, t.high), {
      layer: "seed-tile",
      title: `tile ${t.id}`,
      stroke: "#2e7d32",
      "stroke-width": 1,
      "stroke-opacity": 0.6,
      fill: "#2e7d32",
      "fill-opacity": 0.06,
    }),
  );
}

// Geojson is tiles-only by design (cleanest reference). AOI corridors + summary
// stats still print to the console below; edit here if you want them re-layered.
const bboxS = Math.min(...AOI_RECTS.map((r) => r.low.lat));
const bboxN = Math.max(...AOI_RECTS.map((r) => r.high.lat));
const bboxW = Math.min(...AOI_RECTS.map((r) => r.low.lng));
const bboxE = Math.max(...AOI_RECTS.map((r) => r.high.lng));
// One page-series per (tile, term): SERVICE_AREA_TERMS no longer add a second
// pass — they run the merged includePureServiceAreaBusinesses pass in that single
// series (superset of the standard one), so they're already counted in QUERIES.
const serviceAreaTermCount = QUERIES.filter((q) => SERVICE_AREA_TERMS.has(q.term)).length;
const baselineCalls = tiles.length * QUERIES.length;

writeFileSync(outPath, JSON.stringify({ type: "FeatureCollection", features }, null, 2));

// --- console summary --------------------------------------------------------
console.log("Pass A v2 coverage preview");
console.log(`  AOI corridors:   ${AOI_RECTS.length}`);
console.log(`  Seed tiles:      ${tiles.length}  (${GRID_CONFIG.seedCellKm}km cells, quadtree floor ${GRID_CONFIG.minCellKm}km)`);
console.log(`  Queries:         ${QUERIES.length}`);
console.log(`  Service-area:    ${serviceAreaTermCount} terms run the merged pass (no separate series)`);
console.log(`  Baseline series: ${baselineCalls.toLocaleString()} (tiles × queries, pre-subdivision)`);
console.log(`  BBox:            lat [${bboxS}, ${bboxN}]  lng [${bboxW}, ${bboxE}]`);
console.log(`\nWrote ${outPath}`);
console.log("Open https://geojson.io and drag this file in (green=tiles only).");
