"use client";

import { useState, useEffect, useRef } from "react";
// import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import { SortableList, type Keyed } from "@/components/sortable-list";
import { Sparkles } from "lucide-react";
import { useTranslation } from "@/lib/i18n/i18n-provider";

type RecipeStep = {
  stepNumber: number;
  instructionText: string;
};

type Ingredient = {
  name: string;
  quantity: string;
};

type StepRow = RecipeStep & Keyed;
type IngredientRow = Ingredient & Keyed;

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
  const { t } = useTranslation();
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
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [ingredients, setIngredients] = useState<IngredientRow[]>([]);
  const [steps, setSteps] = useState<StepRow[]>([]);
  const [improveHistory, setImproveHistory] = useState<
    Pick<
      StructuredRecipe,
      "title" | "description" | "ingredients" | "steps" | "difficulty" | "tags" | "cookingTimeMinutes"
    >[]
  >([]);
  const [polishingStepKey, setPolishingStepKey] = useState<string | null>(null);
  const [cookingTime, setCookingTime] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [newIngredientName, setNewIngredientName] = useState("");
  const [newIngredientQuantity, setNewIngredientQuantity] = useState("");
  const [newStepText, setNewStepText] = useState("");

  // Voice recording
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    setVoiceSupported(
      typeof window !== "undefined" &&
        !!navigator.mediaDevices?.getUserMedia &&
        typeof window.MediaRecorder !== "undefined"
    );
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) router.push("/login");
  }, [user, authLoading, router]);

  async function handleStructure() {
    if (!recipeText.trim()) {
      setError(t("recipeNew.enterRecipeText"));
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
      setIngredients(withKeys(result.ingredients || []));
      setSteps(withKeys(result.steps || []));
      setCookingTime(result.cookingTimeMinutes || null);
      setImproveHistory([]);
      setStep("preview");
    } catch (err) {
      setError(t("recipeNew.structureFailed"));
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleTranscribe(blob: Blob) {
    try {
      setTranscribing(true);
      const { text } = await api.transcribeAudio(
        blob,
        language === "auto" ? undefined : language
      );
      if (text) {
        setRecipeText((prev) => (prev.trim() ? `${prev}\n${text}` : text));
        toast.success(t("recipeNew.transcribedToast"));
      } else {
        toast.error(t("recipeNew.noSpeechToast"));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("recipeNew.transcribeFailed"));
    } finally {
      setTranscribing(false);
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || "audio/webm",
        });
        void handleTranscribe(blob);
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setRecording(true);
    } catch {
      toast.error(t("recipeNew.micAccessFailed"));
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  async function handleImprove() {
    if (!structured) return;

    // Snapshot the current state so this AI pass can be undone.
    const snapshot = {
      title,
      description,
      ingredients: stripKeys(ingredients),
      steps: stripKeys(steps),
      difficulty,
      tags,
      cookingTimeMinutes: cookingTime,
    };

    try {
      setLoading(true);
      setError("");
      const result = await api.improveRecipe(
        JSON.stringify(structured),
        language === "auto" ? undefined : language
      );
      setImproveHistory((prev) => [...prev, snapshot]);
      setStructured(result.improved);
      setTitle(result.improved.title);
      setDescription(result.improved.description || "");
      setIngredients(withKeys(result.improved.ingredients));
      setSteps(withKeys(result.improved.steps));
      setDifficulty(result.improved.difficulty || "medium");
      setTags(result.improved.tags);
      setCookingTime(result.improved.cookingTimeMinutes);
    } catch (err) {
      setError(t("recipeNew.improveFailed"));
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleUndoImprove() {
    setImproveHistory((prev) => {
      const last = prev[prev.length - 1];
      if (!last) return prev;

      setTitle(last.title);
      setDescription(last.description || "");
      setIngredients(withKeys(last.ingredients));
      setSteps(withKeys(last.steps));
      setDifficulty(last.difficulty || "medium");
      setTags(last.tags);
      setCookingTime(last.cookingTimeMinutes);
      setStructured((s) => (s ? { ...s, ...last } : s));

      return prev.slice(0, -1);
    });
  }

  async function handlePolishStep(stepKey: string) {
    const target = steps.find((s) => s._key === stepKey);
    if (!target || !target.instructionText.trim()) return;

    setPolishingStepKey(stepKey);
    try {
      const { text } = await api.polishStep(
        target.instructionText,
        language === "auto" ? undefined : language
      );
      setSteps((prev) =>
        prev.map((s) => (s._key === stepKey ? { ...s, instructionText: text } : s))
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("recipeNew.polishFailed"));
    } finally {
      setPolishingStepKey(null);
    }
  }

  async function handleSubmit() {
    if (!title.trim()) {
      setError(t("recipeNew.titleRequired"));
      return;
    }

    if (ingredients.length === 0) {
      setError(t("recipeNew.ingredientRequired"));
      return;
    }

    if (steps.length === 0) {
      setError(t("recipeNew.stepRequired"));
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      const recipeData = {
        title,
        description,
        difficulty,
        ingredients: stripKeys(ingredients),
        steps: stripKeys(steps),
        cookingTimeMinutes: cookingTime,
        tags,
        status: "published",
        language: language === "auto" ? undefined : language,
        rawInput: recipeText,
        imageUrl: imageUrl ?? undefined,
        visibility,
      };

      await api.createRecipe(recipeData);
      // Success - redirect to recipes page
      window.location.href = "/recipes";
    } catch (err) {
      setError(t("recipeNew.createFailed"));
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

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

  function updateIngredient(index: number, field: "name" | "quantity", value: string) {
    setIngredients(
      ingredients.map((ing, i) => (i === index ? { ...ing, [field]: value } : ing))
    );
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

  function updateStep(index: number, value: string) {
    setSteps(
      steps.map((s, i) => (i === index ? { ...s, instructionText: value } : s))
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

  if (authLoading || !user) {
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
        <h1 className="mb-8 text-3xl font-bold">{t("recipeNew.pageTitle")}</h1>

        {error && (
          <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive mb-6">
            {error}
          </div>
        )}

        {step === "input" && (
          <Card>
            <CardHeader>
              <CardTitle>{t("recipeNew.inputStepTitle")}</CardTitle>
              <CardDescription>{t("recipeNew.inputStepSubtitle")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-accent">
                  <input
                    type="radio"
                    name="method"
                    value="text"
                    checked={inputMethod === "text"}
                    onChange={() => setInputMethod("text")}
                  />
                  <div>
                    <p className="font-semibold">{t("recipeNew.textInput")}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("recipeNew.textInputDescription")}
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-center gap-3 p-4 border rounded-lg hover:bg-accent ${
                    voiceSupported ? "cursor-pointer" : "opacity-50 pointer-events-none"
                  }`}
                >
                  <input
                    type="radio"
                    name="method"
                    value="voice"
                    checked={inputMethod === "voice"}
                    disabled={!voiceSupported}
                    onChange={() => setInputMethod("voice")}
                  />
                  <div>
                    <p className="font-semibold">{t("recipeNew.voiceRecording")}</p>
                    <p className="text-sm text-muted-foreground">
                      {voiceSupported
                        ? t("recipeNew.voiceRecordingSupported")
                        : t("recipeNew.voiceRecordingUnsupported")}
                    </p>
                  </div>
                </label>
              </div>

              {inputMethod === "voice" && (
                <div className="flex flex-col items-center gap-3 p-6 border rounded-lg bg-muted/30">
                  <div className="relative">
                    {recording && (
                      <span className="absolute inset-0 rounded-lg bg-destructive/40 animate-ping" />
                    )}
                    <Button
                      type="button"
                      variant={recording ? "destructive" : "default"}
                      size="lg"
                      onClick={recording ? stopRecording : startRecording}
                      disabled={transcribing}
                      className="relative"
                    >
                      {transcribing
                        ? t("recipeNew.transcribing")
                        : recording
                          ? t("recipeNew.stopRecording")
                          : t("recipeNew.startRecording")}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {recording
                      ? t("recipeNew.recordingHint")
                      : t("recipeNew.transcriptHint")}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <label className="text-sm font-semibold">{t("recipeNew.recipeLanguage")}</label>
                <select
                  value={language}
                  onChange={(e) =>
                    setLanguage(e.target.value as RecipeLanguageCode | "auto")
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="auto">{t("recipeNew.autoDetect")}</option>
                  {Object.values(RECIPE_LANGUAGES).map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name} ({lang.nativeName})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">{t("recipeNew.languageHint")}</p>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold">{t("recipeNew.recipeInstructions")}</label>
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
                {loading ? t("recipeNew.structuring") : t("recipeNew.structureWithAi")}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "preview" && (
          <Card>
            <CardHeader>
              <CardTitle>{t("recipeNew.reviewTitle")}</CardTitle>
              <CardDescription>{t("recipeNew.reviewSubtitle")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-semibold">{t("recipeNew.titleLabel")}</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold">{t("recipeNew.descriptionLabel")}</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-20"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-3">
                  <label className="text-sm font-semibold">{t("recipeNew.difficultyLabel")}</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="easy">{t("recipesList.easy")}</option>
                    <option value="medium">{t("recipesList.medium")}</option>
                    <option value="hard">{t("recipesList.hard")}</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold">{t("recipeNew.cookingTimeLabel")}</label>
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
                <label className="text-sm font-semibold">{t("recipeNew.visibilityLabel")}</label>
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
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold">{t("recipeNew.tagsLabel")}</label>
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
                    placeholder={t("recipeNew.addTagPlaceholder")}
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                    className="flex-1 rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                  <Button onClick={addTag} variant="outline">
                    {t("recipeNew.add")}
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold">{t("recipeNew.ingredientsLabel")}</label>
                  <span className="text-xs text-muted-foreground">
                    {t("recipeNew.itemsCount", { count: ingredients.length })}
                  </span>
                </div>
                <SortableList
                  items={ingredients}
                  onReorder={reorderIngredients}
                  className="space-y-2 max-h-64 overflow-y-auto"
                  renderItem={(ing) => {
                    const idx = ingredients.findIndex((i) => i._key === ing._key);
                    return (
                      <div className="flex flex-1 items-center gap-2 p-2 bg-muted rounded">
                        <input
                          value={ing.quantity}
                          onChange={(e) => updateIngredient(idx, "quantity", e.target.value)}
                          placeholder={t("recipeNew.qty")}
                          className="w-24 rounded-md border border-input bg-background px-2 py-1 text-sm"
                        />
                        <input
                          value={ing.name}
                          onChange={(e) => updateIngredient(idx, "name", e.target.value)}
                          placeholder={t("recipeNew.ingredientPlaceholder")}
                          className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm"
                        />
                        <Button
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
                    className="w-24 rounded-md border border-input bg-background px-2 py-1 text-sm"
                  />
                  <input
                    value={newIngredientName}
                    onChange={(e) => setNewIngredientName(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addIngredient())}
                    placeholder={t("recipeNew.addIngredientPlaceholder")}
                    className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addIngredient}>
                    {t("recipeNew.addButton")}
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold">{t("recipeNew.stepsLabel")}</label>
                  <span className="text-xs text-muted-foreground">
                    {t("recipeNew.stepsCount", { count: steps.length })}
                  </span>
                </div>
                <SortableList
                  items={steps}
                  onReorder={reorderSteps}
                  className="space-y-2 max-h-64 overflow-y-auto"
                  renderItem={(step) => {
                    const idx = steps.findIndex((s) => s._key === step._key);
                    const polishing = polishingStepKey === step._key;
                    return (
                      <div className="flex flex-1 gap-2 p-2 bg-muted rounded items-start">
                        <span className="text-sm font-semibold shrink-0 mt-2">
                          {idx + 1}.
                        </span>
                        <textarea
                          value={step.instructionText}
                          onChange={(e) => updateStep(idx, e.target.value)}
                          className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm min-h-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          title={t("recipeNew.polishStepTitle")}
                          disabled={polishing || !step.instructionText.trim()}
                          onClick={() => handlePolishStep(step._key)}
                        >
                          {polishing ? (
                            "..."
                          ) : (
                            <Sparkles className="size-4" />
                          )}
                        </Button>
                        <Button
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
                    className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm min-h-10"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addStep}>
                    {t("recipeNew.addButton")}
                  </Button>
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
                  ← {t("recipeNew.back")}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleImprove}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? t("recipeNew.improving") : t("recipeNew.improveRecipe")}
                </Button>
                {improveHistory.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleUndoImprove}
                    disabled={loading}
                    className="flex-1"
                    title={t("recipeNew.undoImproveTitle")}
                  >
                    ↩ {t("recipeNew.undoImprove")}
                  </Button>
                )}
                <Button onClick={() => setStep("details")} className="flex-1">
                  {t("recipeNew.continue")} →
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "details" && (
          <Card>
            <CardHeader>
              <CardTitle>{t("recipeNew.finalDetailsTitle")}</CardTitle>
              <CardDescription>{t("recipeNew.finalDetailsSubtitle")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-semibold">{t("recipeNew.recipePhotoLabel")}</label>
                {imageUrl ? (
                  <div className="relative w-full max-w-xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt="Recipe"
                      className="w-full rounded-lg border object-cover aspect-video"
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
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-lg">{title}</h3>
                {description && (
                  <p className="text-muted-foreground">{description}</p>
                )}
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge>{t(`recipesList.${difficulty}`)}</Badge>
                  {tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {cookingTime && (
                <div className="p-3 bg-muted rounded text-sm">
                  ⏱️ {t("recipeNew.minutesCookingTime", { count: cookingTime })}
                </div>
              )}

              <div>
                <h4 className="font-semibold mb-2">{t("recipeNew.ingredientsLabel")}</h4>
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
                <h4 className="font-semibold mb-2">{t("recipeNew.stepsLabel")}</h4>
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
                  ← {t("recipeNew.editBack")}
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  size="lg"
                  className="flex-1"
                >
                  {submitting ? t("recipeNew.publishing") : t("recipeNew.publishRecipe")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
