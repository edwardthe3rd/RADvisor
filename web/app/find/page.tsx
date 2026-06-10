import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import ItemCard from "@/components/ItemCard";
import OperatorCard from "@/components/OperatorCard";
import QuizFlow from "@/components/find/QuizFlow";
import { categoryLabel, subcategoryLabel } from "@/lib/config/categories";
import { REGION_SPOTS } from "@/lib/config/locations";
import { haversineMiles } from "@/lib/config/geo";
import {
  answersFromSearchParams,
  answersToSearchParams,
  getSteps,
  type QuizAnswers,
} from "@/lib/config/quiz";
import {
  getOperatorsByCategory,
  searchEquipment,
  type EquipmentWithOperator,
} from "@/lib/data";
import type { Filters } from "@/lib/search/buildQuery";
import type { Operator } from "@/lib/supabase/types";
import { pickPrice } from "@/lib/format";
import type { SkillLevel } from "@/lib/supabase/types";

export const metadata = {
  title: "Find the right gear",
  description:
    "Answer a few questions and we'll pinpoint the right outdoor gear rental near Reno & Lake Tahoe.",
};

interface QuizResults {
  items: EquipmentWithOperator[];
  operators: Operator[];
  relaxed: string[];
}

function answersToFilters(answers: QuizAnswers): Filters {
  const filters: Filters = { tier: answers.duration ?? "full_day" };
  if (answers.activity && answers.activity !== "not_sure") {
    filters.categories = [answers.activity];
  }
  if (answers.subtype && answers.subtype !== "any") {
    filters.subcategories = [answers.subtype];
  }
  if (answers.skill && answers.skill !== "all") {
    filters.skill = [answers.skill as SkillLevel];
  }
  if (answers.budget && answers.budget !== "none") {
    filters.priceMax = Number(answers.budget);
  }
  return filters;
}

/**
 * Zero-result relaxation ladder (04 §4): budget → skill → subcategory →
 * popular in category → operators in the category. Always returns something
 * and reports what was relaxed.
 */
async function getResults(answers: QuizAnswers): Promise<QuizResults> {
  const relaxed: string[] = [];
  let filters = answersToFilters(answers);

  let items = await searchEquipment(filters);
  if (items.length === 0 && filters.priceMax !== undefined) {
    filters = { ...filters, priceMax: undefined };
    relaxed.push("budget");
    items = await searchEquipment(filters);
  }
  if (items.length === 0 && filters.skill) {
    filters = { ...filters, skill: undefined };
    relaxed.push("skill level");
    items = await searchEquipment(filters);
  }
  if (items.length === 0 && filters.subcategories) {
    filters = { ...filters, subcategories: undefined };
    relaxed.push("gear type");
    items = await searchEquipment(filters);
  }

  // Ultimate fallback: the operators that rent this kind of gear. Honest
  // Tier-1 posture (07 §2) — the directory always has something to offer.
  let operators: Operator[] = [];
  if (items.length === 0 && answers.activity && answers.activity !== "not_sure") {
    operators = await getOperatorsByCategory(answers.activity);
  }

  return { items, operators, relaxed };
}

function sortByDistanceThenPrice(
  results: QuizResults,
  answers: QuizAnswers,
): { itemDistances: Map<string, number>; operatorDistances: Map<string, number> } {
  const spot = REGION_SPOTS.find((s) => s.slug === answers.location);
  const itemDistances = new Map<string, number>();
  const operatorDistances = new Map<string, number>();
  if (!spot) return { itemDistances, operatorDistances };

  for (const item of results.items) {
    const { lat, lng } = item.operators;
    if (lat != null && lng != null) {
      itemDistances.set(item.id, haversineMiles(spot, { lat, lng }));
    }
  }
  for (const op of results.operators) {
    if (op.lat != null && op.lng != null) {
      operatorDistances.set(op.id, haversineMiles(spot, { lat: op.lat, lng: op.lng }));
    }
  }
  const tier = answers.duration ?? "full_day";
  results.items.sort((a, b) => {
    const da = itemDistances.get(a.id) ?? Infinity;
    const db = itemDistances.get(b.id) ?? Infinity;
    if (Math.abs(da - db) > 0.5) return da - db;
    return (pickPrice(a, tier)?.value ?? Infinity) - (pickPrice(b, tier)?.value ?? Infinity);
  });
  results.operators.sort(
    (a, b) =>
      (operatorDistances.get(a.id) ?? Infinity) -
      (operatorDistances.get(b.id) ?? Infinity),
  );
  return { itemDistances, operatorDistances };
}

function summaryChips(answers: QuizAnswers) {
  const steps = getSteps(answers);
  return steps
    .map((step, index) => {
      const value = answers[step.id];
      if (!value) return null;
      let label: string;
      if (step.id === "activity") {
        label = value === "not_sure" ? "Open to anything" : categoryLabel(value);
      } else if (step.id === "subtype") {
        label =
          value === "any"
            ? "Any gear"
            : subcategoryLabel(answers.activity ?? "", value);
      } else {
        label = step.options.find((o) => o.value === value)?.label ?? value;
      }
      const params = answersToSearchParams(answers);
      params.delete("done");
      params.set("step", String(index));
      return { label, href: `/find?${params}` };
    })
    .filter((c): c is { label: string; href: string } => c !== null);
}

export default async function FindPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const done = searchParams.done === "1";
  const answers = answersFromSearchParams(searchParams);

  if (!done) {
    const stepParam = Array.isArray(searchParams.step)
      ? searchParams.step[0]
      : searchParams.step;
    const initialStep = stepParam ? Math.max(0, Number(stepParam) || 0) : 0;
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-content px-4 py-10">
          <QuizFlow initialAnswers={answers} initialStep={initialStep} />
        </main>
      </>
    );
  }

  const results = await getResults(answers);
  const { itemDistances, operatorDistances } = sortByDistanceThenPrice(
    results,
    answers,
  );
  const chips = summaryChips(answers);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-content px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <Link
              key={chip.href}
              href={chip.href}
              className="rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-ink-secondary hover:bg-surface-border"
              title="Tap to change this answer"
            >
              {chip.label} ✎
            </Link>
          ))}
          <Link
            href="/find"
            className="text-xs font-semibold text-ink-link hover:underline"
          >
            Start over
          </Link>
        </div>

        {results.relaxed.length > 0 && (
          <p className="mb-4 rounded-lg bg-brand-tertiaryLight px-4 py-3 text-sm text-ink-primary">
            We couldn&rsquo;t find exact matches, so we widened the{" "}
            {results.relaxed.join(" and ")} to show you the closest options.
          </p>
        )}

        {results.items.length > 0 ? (
          <>
            <h1 className="mb-4 text-2xl font-extrabold text-ink-primary">
              {results.items.length} match{results.items.length === 1 ? "" : "es"}
            </h1>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {results.items.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  tier={answers.duration}
                  distanceMiles={itemDistances.get(item.id)}
                />
              ))}
            </div>
          </>
        ) : results.operators.length > 0 ? (
          <>
            <h1 className="mb-2 text-2xl font-extrabold text-ink-primary">
              {results.operators.length} operator
              {results.operators.length === 1 ? "" : "s"} rent{" "}
              {answers.activity ? categoryLabel(answers.activity).toLowerCase() : ""} gear
              near you
            </h1>
            <p className="mb-6 text-ink-secondary">
              Individual gear listings are coming soon — contact an operator
              directly to confirm what they have available.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {results.operators.map((operator) => (
                <OperatorCard
                  key={operator.id}
                  operator={operator}
                  distanceMiles={operatorDistances.get(operator.id)}
                />
              ))}
            </div>
          </>
        ) : (
          <p className="rounded-lg border border-surface-borderLight bg-surface-muted p-6 text-ink-secondary">
            Nothing matched — try{" "}
            <Link href="/find" className="font-semibold text-ink-link hover:underline">
              different answers
            </Link>{" "}
            or{" "}
            <Link href="/search" className="font-semibold text-ink-link hover:underline">
              browse everything
            </Link>
            .
          </p>
        )}
      </main>
    </>
  );
}
