"use client";

import { useState, useEffect } from "react";
// import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import { RECIPE_LANGUAGES, type RecipeLanguageCode } from "@/lib/languages";

type RecipeStep = {
  stepNumber: number;
  instructionText: string;
};

type Ingredient = {
  name: string;
  quantity: string;
};

type StructuredRecipe = {
  title: string;
  description?: string;
  ingredients: Ingredient[];
  steps: RecipeStep[];
  cookingTimeMinutes: number | null;
  difficulty: "easy" | "medium" | "hard" | null;
  tags: string[];
};

export default function CreateRecipePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<"input" | "preview" | "details">("input");
  const [inputMethod, setInputMethod] = useState<"text" | "voice">("text");
  const [recipeText, setRecipeText] = useState("");
  const [language, setLanguage] = useState<RecipeLanguageCode | "auto">("auto");
  const [structured, setStructured] = useState<StructuredRecipe | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Final recipe details
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium"
  );
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [steps, setSteps] = useState<RecipeStep[]>([]);
  const [cookingTime, setCookingTime] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) router.push("/login");
  }, [user, authLoading, router]);

  async function handleStructure() {
    if (!recipeText.trim()) {
      setError("Please enter recipe text");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const result = await api.structureRecipe(
        recipeText,
        language === "auto" ? "auto" : language
      );
      setStructured(result);
      setTitle(result.title || "");
      setDescription(result.description || "");
      setDifficulty(result.difficulty || "medium");
      setTags(result.tags || []);
      setIngredients(result.ingredients || []);
      setSteps(result.steps || []);
      setCookingTime(result.cookingTimeMinutes || null);
      setStep("preview");
    } catch (err) {
      setError("Failed to structure recipe. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleImprove() {
    if (!structured) return;

    try {
      setLoading(true);
      setError("");
      const result = await api.improveRecipe(
        JSON.stringify(structured),
        language === "auto" ? undefined : language
      );
      setStructured(result.improved);
      setTitle(result.improved.title);
      setDescription(result.improved.description || "");
      setIngredients(result.improved.ingredients);
      setSteps(result.improved.steps);
      setDifficulty(result.improved.difficulty || "medium");
      setTags(result.improved.tags);
      setCookingTime(result.improved.cookingTimeMinutes);
    } catch (err) {
      setError("Failed to improve recipe");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!title.trim()) {
      setError("Recipe title is required");
      return;
    }

    if (ingredients.length === 0) {
      setError("At least one ingredient is required");
      return;
    }

    if (steps.length === 0) {
      setError("At least one step is required");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      const recipeData = {
        title,
        description,
        difficulty,
        ingredients,
        steps,
        cookingTimeMinutes: cookingTime,
        tags,
        status: "published",
        language: language === "auto" ? undefined : language,
        rawInput: recipeText,
      };

      await api.createRecipe(recipeData);
      // Success - redirect to recipes page
      window.location.href = "/recipes";
    } catch (err) {
      setError("Failed to create recipe");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  function addTag() {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  function removeIngredient(index: number) {
    setIngredients(ingredients.filter((_, i) => i !== index));
  }

  function removeStep(index: number) {
    setSteps(steps.filter((_, i) => i !== index));
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="mb-8 text-3xl font-bold">Create New Recipe</h1>

        {error && (
          <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive mb-6">
            {error}
          </div>
        )}

        {step === "input" && (
          <Card>
            <CardHeader>
              <CardTitle>How would you like to input your recipe?</CardTitle>
              <CardDescription>
                You can paste instructions, type them out, or record your voice
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-accent">
                  <input
                    type="radio"
                    name="method"
                    value="text"
                    checked={inputMethod === "text"}
                    onChange={(e) => setInputMethod("text" as any)}
                  />
                  <div>
                    <p className="font-semibold">Text Input</p>
                    <p className="text-sm text-muted-foreground">
                      Paste or type your recipe instructions
                    </p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-accent opacity-50 pointer-events-none">
                  <input
                    type="radio"
                    name="method"
                    value="voice"
                    disabled
                  />
                  <div>
                    <p className="font-semibold">Voice Recording</p>
                    <p className="text-sm text-muted-foreground">
                      Record your voice (Coming soon for web)
                    </p>
                  </div>
                </label>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold">Recipe language</label>
                <select
                  value={language}
                  onChange={(e) =>
                    setLanguage(e.target.value as RecipeLanguageCode | "auto")
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="auto">Auto-detect from text</option>
                  {Object.values(RECIPE_LANGUAGES).map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name} ({lang.nativeName})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Choose the language of your recipe, or auto-detect for mixed
                  input (e.g. German, Tamil, Hindi, Japanese).
                </p>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold">Recipe Instructions</label>
                <textarea
                  placeholder="Paste your recipe in any supported language — English, Deutsch, 日本語, Français, தமிழ், తెలుగు, हिन्दी, മലയാളം, Español, ਪੰਜਾਬੀ..."
                  value={recipeText}
                  onChange={(e) => setRecipeText(e.target.value)}
                  className="w-full rounded-md border border-input px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-48 font-mono"
                />
              </div>

              <Button
                onClick={handleStructure}
                disabled={loading || !recipeText.trim()}
                size="lg"
                className="w-full"
              >
                {loading ? "Structuring..." : "✨ Structure with AI"}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "preview" && (
          <Card>
            <CardHeader>
              <CardTitle>Review Your Recipe</CardTitle>
              <CardDescription>
                AI has structured your recipe. Review and improve it before publishing.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-semibold">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-20"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-3">
                  <label className="text-sm font-semibold">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold">Cooking Time (mins)</label>
                  <input
                    type="number"
                    value={cookingTime || ""}
                    onChange={(e) =>
                      setCookingTime(e.target.value ? parseInt(e.target.value) : null)
                    }
                    className="w-full rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold">Tags</label>
                <div className="flex gap-2 mb-2 flex-wrap">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => removeTag(tag)}
                    >
                      {tag} ✕
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add tag and press Add"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                    className="flex-1 rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                  <Button onClick={addTag} variant="outline">
                    Add
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold">Ingredients</label>
                  <span className="text-xs text-muted-foreground">
                    {ingredients.length} items
                  </span>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {ingredients.map((ing, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 bg-muted rounded"
                    >
                      <span className="flex-1">
                        {ing.quantity} {ing.name}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeIngredient(idx)}
                      >
                        ✕
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold">Steps</label>
                  <span className="text-xs text-muted-foreground">
                    {steps.length} steps
                  </span>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {steps.map((step, idx) => (
                    <div
                      key={idx}
                      className="flex gap-2 p-2 bg-muted rounded items-start"
                    >
                      <span className="text-sm font-semibold shrink-0 mt-1">
                        {idx + 1}.
                      </span>
                      <span className="flex-1 text-sm">{step.instructionText}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStep(idx)}
                      >
                        ✕
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep("input");
                    setError("");
                  }}
                  className="flex-1"
                >
                  ← Back
                </Button>
                <Button
                  variant="outline"
                  onClick={handleImprove}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? "Improving..." : "✨ Improve Recipe"}
                </Button>
                <Button onClick={() => setStep("details")} className="flex-1">
                  Continue →
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "details" && (
          <Card>
            <CardHeader>
              <CardTitle>Final Details</CardTitle>
              <CardDescription>
                Review your recipe one more time before publishing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">{title}</h3>
                {description && (
                  <p className="text-muted-foreground">{description}</p>
                )}
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge>{difficulty}</Badge>
                  {tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {cookingTime && (
                <div className="p-3 bg-muted rounded text-sm">
                  ⏱️ {cookingTime} minutes cooking time
                </div>
              )}

              <div>
                <h4 className="font-semibold mb-2">Ingredients</h4>
                <ul className="space-y-1 text-sm">
                  {ingredients.map((ing, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <input type="checkbox" disabled />
                      <span>
                        {ing.quantity} {ing.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Steps</h4>
                <ol className="space-y-2 text-sm">
                  {steps.map((step, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="font-semibold shrink-0">{idx + 1}.</span>
                      <span>{step.instructionText}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setStep("preview")}
                  className="flex-1"
                >
                  ← Edit
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  size="lg"
                  className="flex-1"
                >
                  {submitting ? "Publishing..." : "🚀 Publish Recipe"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
