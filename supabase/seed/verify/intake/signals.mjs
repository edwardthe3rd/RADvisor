/**
 * Shared signal builder for the intake classifier. Turns a Google place_id (+
 * optional name/website) into the exact feature bundle classify.mjs consumes,
 * so the training dataset and live batch classification stay identical.
 */

import {
  fetchWebsiteEvidence,
  detectAcquisition,
  detectClosed,
  closedPhrase,
  detectSubcategories,
  detectAnchorCategories,
  rentalContextText,
} from "../lib.mjs";

const PLACE_FIELDS = [
  "displayName",
  "businessStatus",
  "primaryType",
  "primaryTypeDisplayName",
  "types",
  "websiteUri",
  "editorialSummary",
  "generativeSummary",
  "reviewSummary",
].join(",");

export async function fetchPlaceFull(apiKey, placeId) {
  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": PLACE_FIELDS,
      },
    });
    if (!res.ok) return { error: `HTTP ${res.status}` };
    return { place: await res.json() };
  } catch (e) {
    return { error: e.message };
  }
}

export function summaryText(p) {
  return [
    p.editorialSummary?.text,
    p.editorialSummary?.overview,
    p.generativeSummary?.overview?.text,
    p.reviewSummary?.text?.text,
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * Build the classifier feature bundle. `seed` may carry a pre-known name/website
 * (e.g. from an existing record); otherwise they come from Google.
 */
export async function buildSignalBundle(apiKey, { placeId, name, website }) {
  const { place, error } = await fetchPlaceFull(apiKey, placeId);
  const resolvedWebsite = website || place?.websiteUri || null;
  const summary = place ? summaryText(place) : "";

  const web = await fetchWebsiteEvidence(resolvedWebsite);
  const blob = `${web.text} ${summary}`;
  const acq = detectAcquisition(blob);
  // Two category detections: rental-context (precise — gear next to rent/demo/lease)
  // and full-blob (high recall). Stored separately so the combination rule can be
  // tuned offline; `subcatsByCat` is the rule classify.mjs consumes (context, with
  // full-blob fallback when context finds nothing).
  const ctx = `${rentalContextText(web.text, 250)} ${summary}`.trim();
  const detectInto = (source) => {
    const by = {};
    for (const cat of detectAnchorCategories(source)) {
      const subs = detectSubcategories(source, cat);
      if (subs.length) by[cat] = subs;
    }
    return by;
  };
  const ctxSubcatsByCat = detectInto(ctx);
  const blobSubcatsByCat = detectInto(blob);
  const subcatsByCat = Object.keys(ctxSubcatsByCat).length
    ? ctxSubcatsByCat
    : blobSubcatsByCat;
  const anchorCategories = Object.keys(subcatsByCat);

  return {
    placeId,
    name: name || place?.displayName?.text || null,
    website: resolvedWebsite,
    googleError: error || null,
    businessStatus: place?.businessStatus || null,
    primaryType: place?.primaryType || null,
    primaryTypeDisplay: place?.primaryTypeDisplayName?.text || null,
    types: place?.types || [],
    summary,
    webReachable: web.reachable,
    webClosed: detectClosed(blob),
    webClosedPhrase: closedPhrase(blob),
    webRental: acq.rental,
    webDemo: acq.demo,
    webLease: acq.lease,
    webRetailOnly: acq.retailOnly,
    anchorCategories,
    subcatsByCat,
    ctxSubcatsByCat,
    blobSubcatsByCat,
  };
}
