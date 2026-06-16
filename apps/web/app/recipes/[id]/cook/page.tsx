"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api, speakText, stopSpeaking } from "@/lib/api";
import { SiteHeader } from "@/components/site-header";

export default function CookingModePage() {
  const params = useParams();
  const id = params.id as string;

  const [recipe, setRecipe] = useState<any>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(
    new Set()
  );
  const [speaking, setSpeaking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getRecipe(id)
      .then(setRecipe)
      .catch(() => setError("Failed to load recipe"))
      .finally(() => setLoading(false));

    return () => stopSpeaking();
  }, [id]);

  const steps = recipe?.steps || [];
  const currentStep = steps[stepIndex];

  function toggleIngredient(index: number) {
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function readStep(index: number) {
    const step = steps[index];
    if (!step) return;
    setSpeaking(true);
    const utterance = speakText(step.instructionText, recipe?.language);
    if (utterance) {
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
    } else {
      setSpeaking(false);
    }
  }

  function goToStep(index: number) {
    stopSpeaking();
    setSpeaking(false);
    setStepIndex(index);
  }

  function nextStep() {
    if (stepIndex < steps.length - 1) {
      goToStep(stepIndex + 1);
    }
  }

  function prevStep() {
    if (stepIndex > 0) {
      goToStep(stepIndex - 1);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-muted-foreground">Loading cooking mode...</p>
        </div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
          <p className="text-destructive">{error || "Recipe not found"}</p>
          <Link href={`/recipes/${id}`} className={cn(buttonVariants())}>
            Back to recipe
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Cooking mode</p>
            <h1 className="text-2xl font-bold">{recipe.title}</h1>
          </div>
          <Link
            href={`/recipes/${id}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Exit
          </Link>
        </div>

        {recipe.ingredients?.length > 0 && stepIndex === 0 && (
          <section className="mb-8 rounded-xl border p-4">
            <h2 className="mb-3 font-semibold">Gather ingredients</h2>
            <ul className="space-y-2">
              {recipe.ingredients.map((ing: any, index: number) => (
                <li key={index} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={checkedIngredients.has(index)}
                    onChange={() => toggleIngredient(index)}
                    className="rounded"
                  />
                  <span
                    className={
                      checkedIngredients.has(index)
                        ? "text-muted-foreground line-through"
                        : ""
                    }
                  >
                    {ing.quantity} {ing.name}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Step {stepIndex + 1} of {steps.length}
            </span>
            {recipe.cookingTimeMinutes && (
              <span>⏱️ {recipe.cookingTimeMinutes} min total</span>
            )}
          </div>

          {currentStep ? (
            <>
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                {currentStep.stepNumber || stepIndex + 1}
              </div>
              <p className="text-xl leading-relaxed">
                {currentStep.instructionText}
              </p>
            </>
          ) : (
            <p className="text-muted-foreground">No steps in this recipe.</p>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <Button variant="outline" onClick={prevStep} disabled={stepIndex === 0}>
              ← Previous
            </Button>
            <Button
              onClick={() => readStep(stepIndex)}
              disabled={speaking || !currentStep}
            >
              {speaking ? "🔊 Speaking..." : "🔊 Read step"}
            </Button>
            <Button
              onClick={nextStep}
              disabled={stepIndex >= steps.length - 1}
            >
              Next →
            </Button>
          </div>
        </section>

        {steps.length > 1 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {steps.map((_: any, index: number) => (
              <button
                key={index}
                onClick={() => goToStep(index)}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border text-sm font-medium transition-colors",
                  index === stepIndex
                    ? "border-primary bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                {index + 1}
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
