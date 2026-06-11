// Question definitions for the guided questionnaire (instructions/04 §3).
// Config-driven so steps can be added/reordered without touching the flow
// component (04 §6).

import { CATEGORIES, getCategory } from "./categories";
import { REGION_SPOTS } from "./locations";
import type { PriceTier } from "@/lib/search/buildQuery";

export interface QuizOption {
  value: string;
  label: string;
}

export interface QuizAnswers {
  activity?: string; // category slug or "not_sure"
  subtype?: string; // subcategory slug or "any"
  skill?: string; // skill_level or "all"
  location?: string; // spot slug
  delivery?: "yes";
  duration?: PriceTier;
  budget?: string; // max $/day or "none"
}

export const DURATION_OPTIONS: { value: PriceTier; label: string }[] = [
  { value: "half_day", label: "Half day" },
  { value: "full_day", label: "Full day" },
  { value: "multi_day", label: "2–3 days" },
  { value: "weekly", label: "Week+" },
];

export const BUDGET_OPTIONS: QuizOption[] = [
  { value: "25", label: "Under $25/day" },
  { value: "50", label: "Under $50/day" },
  { value: "100", label: "Under $100/day" },
  { value: "250", label: "Under $250/day" },
  { value: "500", label: "Under $500/day" },
  { value: "none", label: "No limit" },
];

// Categories where a skill question is meaningful (04 §3 Step 2).
const SKILL_CATEGORIES = new Set([
  "snow_sports",
  "mountain_biking",
  "rock_climbing",
]);

export interface QuizStep {
  id: keyof QuizAnswers;
  question: string;
  options: QuizOption[];
}

/** The step list for a given set of answers (conditional flow). */
export function getSteps(answers: QuizAnswers): QuizStep[] {
  const steps: QuizStep[] = [
    {
      id: "activity",
      question: "What do you want to do?",
      options: [
        ...CATEGORIES.map((c) => ({ value: c.slug, label: c.label })),
        { value: "not_sure", label: "Not sure yet" },
      ],
    },
  ];

  const activity = answers.activity;
  const category = activity && activity !== "not_sure" ? getCategory(activity) : undefined;

  // "Not sure yet" → simplified path: location + budget only (04 §3 Step 1).
  if (category) {
    if (category.subcategories.length > 0) {
      steps.push({
        id: "subtype",
        question: `What kind of ${category.label.toLowerCase()}?`,
        options: [
          ...category.subcategories.map((s) => ({ value: s.slug, label: s.label })),
          { value: "any", label: "Anything works" },
        ],
      });
    }
    if (SKILL_CATEGORIES.has(category.slug)) {
      steps.push({
        id: "skill",
        question: "How experienced are you?",
        options: [
          { value: "beginner", label: "Beginner" },
          { value: "intermediate", label: "Intermediate" },
          { value: "advanced", label: "Advanced" },
          { value: "all", label: "Mixed group" },
        ],
      });
    }
  }

  steps.push({
    id: "location",
    question: "Where's your adventure?",
    options: REGION_SPOTS.map((s) => ({ value: s.slug, label: s.label })),
  });

  steps.push({
    id: "delivery",
    question: "Do you need gear delivered?",
    options: [
      { value: "any", label: "No preference" },
      { value: "yes", label: "Yes — delivery service" },
    ],
  });

  if (activity !== "not_sure") {
    steps.push({
      id: "duration",
      question: "How long do you need it?",
      options: DURATION_OPTIONS,
    });
  }

  steps.push({
    id: "budget",
    question: "What's your budget per day?",
    options: BUDGET_OPTIONS,
  });

  return steps;
}

export function answersFromSearchParams(
  params: Record<string, string | string[] | undefined>,
): QuizAnswers {
  const get = (k: string) => {
    const v = params[k];
    return (Array.isArray(v) ? v[0] : v) || undefined;
  };
  return {
    activity: get("activity"),
    subtype: get("subtype"),
    skill: get("skill"),
    location: get("location"),
    delivery: get("delivery") === "yes" ? "yes" : undefined,
    duration: get("duration") as PriceTier | undefined,
    budget: get("budget"),
  };
}

export function answersToSearchParams(answers: QuizAnswers): URLSearchParams {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(answers)) {
    if (!v || (k === "delivery" && v !== "yes")) continue;
    params.set(k, v);
  }
  return params;
}
