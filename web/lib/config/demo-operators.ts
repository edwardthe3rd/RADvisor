import type { Operator } from "@/lib/supabase/types";

/** Label appended to demo-only operators in the UI (derived, not stored in `name`). */
export const DEMO_ONLY_NAME_SUFFIX = " (Demo Only)";

/**
 * Demo-only = offers demos/tryouts but not rentals. Operators that offer both
 * rentals and demos are surfaced as rentals (with a demo badge), not demo-only.
 */
export function isDemoOnly(
  op: Pick<Operator, "offers_demo" | "offers_rental">,
): boolean {
  return op.offers_demo === true && op.offers_rental !== true;
}

/** True when the operator offers demos/tryouts at all (alongside rentals or not). */
export function offersDemo(op: Pick<Operator, "offers_demo">): boolean {
  return op.offers_demo === true;
}
