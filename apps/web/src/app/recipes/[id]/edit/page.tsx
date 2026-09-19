"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import { SortableList, type Keyed } from "@/components/sortable-list";
import { useTranslation } from "@/lib/i18n/i18n-provider";

type Ingredient = { name: string; quantity: string };
type Step = { stepNumber: number; instructionText: string };
type IngredientRow = Ingredient & Keyed;
type StepRow = Step & Keyed;

function genKey() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function withKeys<T>(items: T[]): (T & Keyed)[] {
  return items.map((item) => ({ ...item, _key: genKey() }));
}

function stripKeys<T extends Keyed>(items: T[]): Omit<T, "_key">[] {
  return items.map(({ _key, ...rest }) => rest);
}

export default function EditRecipePage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useTranslation();
  const id = params.id as string;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [cookingTime, setCookingTime] = useState<number | "">("");
  const [tags, setTags] = useState("");
  const [ingredients, setIngredients] = useState<IngredientRow[]>([]);
  const [steps, setSteps] = useState<StepRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [newIngredientName, setNewIngredientName] = useState("");
  const [newIngredientQuantity, setNewIngredientQuantity] = useState("");
  const [newStepText, setNewStepText] = useState("");
  const [polishingStepKey, setPolishingStepKey] = useState<string | null>(null);

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
          setError(t("recipeEdit.notYourRecipe"));
          return;
        }
        setTitle(recipe.title);
        setImageUrl(recipe.imageUrl || null);
        setDescription(recipe.description || "");
        setDifficulty(recipe.difficulty || "medium");
        setVisibility(recipe.visibility || "public");
        setCookingTime(recipe.cookingTimeMinutes || "");
        setTags((recipe.tags || []).join(", "));
        setIngredients(
          withKeys(
            (recipe.ingredients || []).map((i: any) => ({
              name: i.name,
              quantity: i.quantity,
            }))
          )
        );
        setSteps(
          withKeys(
            (recipe.steps || []).map((s: any, idx: number) => ({
              stepNumber: s.stepNumber || idx + 1,
              instructionText: s.instructionText,
            }))
          )
        );
      })
      .catch(() => setError(t("recipeDetail.loadFailed")))
      .finally(() => setLoading(false));
  }, [id, user, authLoading, router]);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploadingImage(true);
    try {
      const { url } = await api.uploadFile(file);
      setImageUrl(url);
      toast.success(t("recipeNew.photoUploadedToast"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("recipeNew.uploadPhotoFailed"));
    } finally {
      setUploadingImage(false);
    }
  }

  function removeIngredient(index: number) {
    setIngredients(ingredients.filter((_, i) => i !== index));
  }

  function addIngredient() {
    if (!newIngredientName.trim()) return;
    setIngredients([
      ...ingredients,
      {
        name: newIngredientName.trim(),
        quantity: newIngredientQuantity.trim(),
        _key: genKey(),
      },
    ]);
    setNewIngredientName("");
    setNewIngredientQuantity("");
  }

  function reorderIngredients(next: IngredientRow[]) {
    setIngredients(next);
  }

  function removeStep(index: number) {
    setSteps(
      steps
        .filter((_, i) => i !== index)
        .map((s, i) => ({ ...s, stepNumber: i + 1 }))
    );
  }

  function addStep() {
    if (!newStepText.trim()) return;
    setSteps([
      ...steps,
      { stepNumber: steps.length + 1, instructionText: newStepText.trim(), _key: genKey() },
    ]);
    setNewStepText("");
  }

  function reorderSteps(next: StepRow[]) {
    setSteps(next.map((s, i) => ({ ...s, stepNumber: i + 1 })));
  }

  async function handlePolishStep(stepKey: string) {
    const target = steps.find((s) => s._key === stepKey);
    if (!target || !target.instructionText.trim()) return;

    setPolishingStepKey(stepKey);
    try {
      const { text } = await api.polishStep(target.instructionText);
      setSteps((prev) =>
        prev.map((s) => (s._key === stepKey ? { ...s, instructionText: text } : s))
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("recipeNew.polishFailed"));
    } finally {
      setPolishingStepKey(null);
    }
  }

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
        ingredients: stripKeys(ingredients),
        steps: steps.map((s, idx) => ({
          stepNumber: idx + 1,
          instructionText: s.instructionText,
        })),
        status: "published",
        imageUrl: imageUrl ?? undefined,
        visibility,
      });
      router.push(`/recipes/${id}`);
    } catch {
      setError(t("recipeEdit.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-muted-foreground">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-6 py-8">
        <h1 className="mb-6 text-3xl font-bold">{t("recipeEdit.pageTitle")}</h1>

        {error && (
          <p className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("recipeEdit.detailsLabel")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {imageUrl ? (
                <div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt={title}
                    className="w-full max-w-xs rounded-lg border object-cover aspect-video"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => setImageUrl(null)}
                  >
                    {t("recipeNew.removePhoto")}
                  </Button>
                </div>
              ) : (
                <label className="cursor-pointer inline-block">
                  <span className="inline-flex items-center rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted">
                    {uploadingImage ? t("recipeNew.uploadingPhoto") : t("recipeNew.addPhoto")}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingImage}
                    onChange={handleImageUpload}
                  />
                </label>
              )}
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("recipeNew.titleLabel")}
                required
                className="flex h-10 w-full rounded-md border px-3 text-sm"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("recipeNew.descriptionLabel")}
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
                  <option value="easy">{t("recipesList.easy")}</option>
                  <option value="medium">{t("recipesList.medium")}</option>
                  <option value="hard">{t("recipesList.hard")}</option>
                </select>
                <input
                  type="number"
                  value={cookingTime}
                  onChange={(e) =>
                    setCookingTime(e.target.value ? Number(e.target.value) : "")
                  }
                  placeholder={t("recipeEdit.cookTimePlaceholder")}
                  className="flex h-10 w-32 rounded-md border px-3 text-sm"
                />
              </div>
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder={t("recipeEdit.tagsPlaceholder")}
                className="flex h-10 w-full rounded-md border px-3 text-sm"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setVisibility("public")}
                  className={`flex-1 rounded-lg border p-3 text-left text-sm transition-colors ${
                    visibility === "public"
                      ? "border-primary bg-primary/10"
                      : "hover:bg-accent"
                  }`}
                >
                  <p className="font-semibold">🌍 {t("recipeNew.publicLabel")}</p>
                  <p className="text-xs text-muted-foreground">{t("recipeNew.publicDescription")}</p>
                </button>
                <button
                  type="button"
                  onClick={() => setVisibility("private")}
                  className={`flex-1 rounded-lg border p-3 text-left text-sm transition-colors ${
                    visibility === "private"
                      ? "border-primary bg-primary/10"
                      : "hover:bg-accent"
                  }`}
                >
                  <p className="font-semibold">🔒 {t("recipeNew.privateLabel")}</p>
                  <p className="text-xs text-muted-foreground">{t("recipeNew.privateDescription")}</p>
                </button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("recipeNew.ingredientsLabel")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <SortableList
                items={ingredients}
                onReorder={reorderIngredients}
                className="space-y-2"
                renderItem={(ing) => {
                  const idx = ingredients.findIndex((i) => i._key === ing._key);
                  return (
                    <div className="flex flex-1 gap-2">
                      <input
                        value={ing.quantity}
                        onChange={(e) => {
                          const next = [...ingredients];
                          next[idx] = { ...next[idx]!, quantity: e.target.value };
                          setIngredients(next);
                        }}
                        placeholder={t("recipeNew.qty")}
                        className="w-24 rounded-md border px-2 py-1 text-sm"
                      />
                      <input
                        value={ing.name}
                        onChange={(e) => {
                          const next = [...ingredients];
                          next[idx] = { ...next[idx]!, name: e.target.value };
                          setIngredients(next);
                        }}
                        placeholder={t("recipeNew.ingredientPlaceholder")}
                        className="flex-1 rounded-md border px-2 py-1 text-sm"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeIngredient(idx)}
                      >
                        ✕
                      </Button>
                    </div>
                  );
                }}
              />
              <div className="flex gap-2 pt-1">
                <input
                  value={newIngredientQuantity}
                  onChange={(e) => setNewIngredientQuantity(e.target.value)}
                  placeholder={t("recipeNew.qty")}
                  className="w-24 rounded-md border px-2 py-1 text-sm"
                />
                <input
                  value={newIngredientName}
                  onChange={(e) => setNewIngredientName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addIngredient())}
                  placeholder={t("recipeNew.addIngredientPlaceholder")}
                  className="flex-1 rounded-md border px-2 py-1 text-sm"
                />
                <Button type="button" variant="outline" size="sm" onClick={addIngredient}>
                  {t("recipeNew.addButton")}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("recipeNew.stepsLabel")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <SortableList
                items={steps}
                onReorder={reorderSteps}
                className="space-y-3"
                renderItem={(step) => {
                  const idx = steps.findIndex((s) => s._key === step._key);
                  const polishing = polishingStepKey === step._key;
                  return (
                    <div className="flex flex-1 gap-2 items-start">
                      <span className="text-sm font-semibold shrink-0 mt-2">{idx + 1}.</span>
                      <textarea
                        value={step.instructionText}
                        onChange={(e) => {
                          const next = [...steps];
                          next[idx] = { ...next[idx]!, instructionText: e.target.value };
                          setSteps(next);
                        }}
                        placeholder={t("recipeEdit.stepPlaceholder", { number: idx + 1 })}
                        className="min-h-20 flex-1 rounded-md border px-3 py-2 text-sm"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        title={t("recipeNew.polishStepTitle")}
                        disabled={polishing || !step.instructionText.trim()}
                        onClick={() => handlePolishStep(step._key)}
                      >
                        {polishing ? "..." : <Sparkles className="size-4" />}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStep(idx)}
                      >
                        ✕
                      </Button>
                    </div>
                  );
                }}
              />
              <div className="flex gap-2 pt-1">
                <textarea
                  value={newStepText}
                  onChange={(e) => setNewStepText(e.target.value)}
                  placeholder={t("recipeNew.addStepPlaceholder")}
                  className="min-h-10 flex-1 rounded-md border px-3 py-2 text-sm"
                />
                <Button type="button" variant="outline" size="sm" onClick={addStep}>
                  {t("recipeNew.addButton")}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Link
              href={`/recipes/${id}`}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              {t("common.cancel")}
            </Link>
            <Button type="submit" disabled={saving}>
              {saving ? t("recipeEdit.saving") : t("recipeEdit.saveChanges")}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
