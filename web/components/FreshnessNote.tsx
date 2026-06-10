import { isStale } from "@/lib/format";

/**
 * Honesty-about-freshness indicator (03 §5): muted note when a record hasn't
 * been verified in 90 days. Never hides the item.
 */
export default function FreshnessNote({
  lastVerified,
}: {
  lastVerified: string | null;
}) {
  if (!isStale(lastVerified)) return null;
  return (
    <p className="text-xs text-ink-tertiary">Prices may have changed</p>
  );
}
