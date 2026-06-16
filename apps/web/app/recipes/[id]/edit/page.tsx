"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";

type Ingredient = { name: string; quantity: string };
type Step = { stepNumber: number; instructionText: string };

export default function EditRecipePage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const id = params.id as string;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [cookingTime, setCookingTime] = useState<number | "">("");
  const [tags, setTags] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    api
      .getRecipe(id)
      .then((recipe) => {
        if (recipe.createdBy !== user.id) {
          setError("You can only edit your own recipes");
          return;
        }
        setTitle(recipe.title);
        setDescription(recipe.description || "");
        setDifficulty(recipe.difficulty || "medium");
        setCookingTime(recipe.cookingTimeMinutes || "");
        setTags((recipe.tags || []).join(", "));
        setIngredients(
          (recipe.ingredients || []).map((i: any) => ({
            name: i.name,
            quantity: i.quantity,
          }))
        );
        setSteps(
          (recipe.steps || []).map((s: any, idx: number) => ({
            stepNumber: s.stepNumber || idx + 1,
            instructionText: s.instructionText,
          }))
        );
      })
      .catch(() => setError("Failed to load recipe"))
      .finally(() => setLoading(false));
  }, [id, user, authLoading, router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.updateRecipe(id, {
        title,
        description,
        difficulty,
        cookingTimeMinutes: cookingTime === "" ? null : Number(cookingTime),
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        ingredients,
        steps: steps.map((s, idx) => ({
          stepNumber: idx + 1,
          instructionText: s.instructionText,
        })),
        status: "published",
      });
      router.push(`/recipes/${id}`);
    } catch {
      setError("Failed to save recipe");
    } finally {
      setSaving(false);
    }
  }

  if (loading || authLoading) {
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
      <main className="mx-auto max-w-2xl px-6 py-8">
        <h1 className="mb-6 text-3xl font-bold">Edit Recipe</h1>

        {error && (
          <p className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                required
                className="flex h-10 w-full rounded-md border px-3 text-sm"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description"
                className="min-h-24 w-full rounded-md border px-3 py-2 text-sm"
              />
              <div className="flex gap-4">
                <select
                  value={difficulty}
                  onChange={(e) =>
                    setDifficulty(e.target.value as "easy" | "medium" | "hard")
                  }
                  className="flex h-10 rounded-md border px-3 text-sm"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
                <input
                  type="number"
                  value={cookingTime}
                  onChange={(e) =>
                    setCookingTime(e.target.value ? Number(e.target.value) : "")
                  }
                  placeholder="Cook time (mins)"
                  className="flex h-10 w-32 rounded-md border px-3 text-sm"
                />
              </div>
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Tags (comma separated)"
                className="flex h-10 w-full rounded-md border px-3 text-sm"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ingredients</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {ingredients.map((ing, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    value={ing.quantity}
                    onChange={(e) => {
                      const next = [...ingredients];
                      next[idx] = {
                        name: next[idx]?.name ?? "",
                        quantity: e.target.value,
                      };
                      setIngredients(next);
                    }}
                    placeholder="Qty"
                    className="w-24 rounded-md border px-2 py-1 text-sm"
                  />
                  <input
                    value={ing.name}
                    onChange={(e) => {
                      const next = [...ingredients];
                      next[idx] = {
                        quantity: next[idx]?.quantity ?? "",
                        name: e.target.value,
                      };
                      setIngredients(next);
                    }}
                    placeholder="Ingredient"
                    className="flex-1 rounded-md border px-2 py-1 text-sm"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {steps.map((step, idx) => (
                <textarea
                  key={idx}
                  value={step.instructionText}
                  onChange={(e) => {
                    const next = [...steps];
                    next[idx] = {
                      stepNumber: next[idx]?.stepNumber ?? idx + 1,
                      instructionText: e.target.value,
                    };
                    setSteps(next);
                  }}
                  placeholder={`Step ${idx + 1}`}
                  className="min-h-20 w-full rounded-md border px-3 py-2 text-sm"
                />
              ))}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Link
              href={`/recipes/${id}`}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Cancel
            </Link>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
