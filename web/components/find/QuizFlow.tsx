"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  answersToSearchParams,
  getSteps,
  type QuizAnswers,
} from "@/lib/config/quiz";

/**
 * The guided questionnaire flow (instructions/04): one question per screen,
 * big tappable options, progress indicator, back navigation. State lives in
 * client memory and lands in the URL so results are shareable.
 */
export default function QuizFlow({
  initialAnswers = {},
  initialStep = 0,
}: {
  initialAnswers?: QuizAnswers;
  initialStep?: number;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<QuizAnswers>(initialAnswers);
  const [stepIndex, setStepIndex] = useState(initialStep);

  const steps = getSteps(answers);
  const step = steps[Math.min(stepIndex, steps.length - 1)];

  function select(value: string) {
    const next = { ...answers, [step.id]: value };
    // Changing the activity invalidates downstream conditional answers.
    if (step.id === "activity") {
      next.subtype = undefined;
      next.skill = undefined;
    }
    const nextSteps = getSteps(next);
    const nextIndex = stepIndex + 1;
    if (nextIndex >= nextSteps.length) {
      const params = answersToSearchParams(next);
      params.set("done", "1");
      router.push(`/find?${params}`);
      return;
    }
    setAnswers(next);
    setStepIndex(nextIndex);
  }

  return (
    <div className="mx-auto max-w-xl">
      <p className="mb-2 text-sm font-semibold text-ink-secondary">
        Step {stepIndex + 1} of {steps.length}
      </p>
      <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-surface-muted">
        <div
          className="h-full rounded-full bg-brand-gold transition-all"
          style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
        />
      </div>

      <h1 className="mb-6 text-2xl font-extrabold text-ink-primary sm:text-3xl">
        {step.question}
      </h1>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {step.options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => select(option.value)}
            className={`rounded-lg border px-4 py-4 text-left font-semibold transition hover:border-brand-gold hover:bg-brand-goldLight ${
              answers[step.id] === option.value
                ? "border-brand-gold bg-brand-goldLight text-brand-goldDark"
                : "border-surface-border bg-white text-ink-primary"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {stepIndex > 0 && (
        <button
          type="button"
          onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
          className="mt-6 text-sm font-semibold text-ink-link hover:underline"
        >
          ← Back
        </button>
      )}
    </div>
  );
}
