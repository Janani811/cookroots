import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { ImagePickerField } from "@/components/ImagePickerField";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type Ingredient = { name: string; quantity: string };
type Step = { stepNumber: number; instructionText: string };

const DIFFICULTIES = ["easy", "medium", "hard"] as const;

export default function EditRecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [cookingTime, setCookingTime] = useState("");
  const [tags, setTags] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [newIngredientName, setNewIngredientName] = useState("");
  const [newIngredientQuantity, setNewIngredientQuantity] = useState("");
  const [newStepText, setNewStepText] = useState("");
  const [polishingIdx, setPolishingIdx] = useState<number | null>(null);

  useEffect(() => {
    if (authLoading || !id) return;
    if (!user) {
      router.replace("/(auth)/login");
      return;
    }
    api
      .getRecipe(id)
      .then((recipe) => {
        if (recipe.createdBy !== user.id) {
          setError("This isn't your recipe to edit.");
          return;
        }
        setTitle(recipe.title);
        setImageUrl(recipe.imageUrl || null);
        setDescription(recipe.description || "");
        setDifficulty(recipe.difficulty || "medium");
        setVisibility(recipe.visibility || "public");
        setCookingTime(recipe.cookingTimeMinutes ? String(recipe.cookingTimeMinutes) : "");
        setTags((recipe.tags || []).join(", "));
        setIngredients((recipe.ingredients || []).map((i: any) => ({ name: i.name, quantity: i.quantity })));
        setSteps(
          (recipe.steps || []).map((s: any, idx: number) => ({
            stepNumber: s.stepNumber || idx + 1,
            instructionText: s.instructionText,
          }))
        );
      })
      .catch(() => setError("Failed to load recipe"))
      .finally(() => setLoading(false));
  }, [id, user, authLoading]);

  function removeIngredient(idx: number) {
    setIngredients(ingredients.filter((_, i) => i !== idx));
  }

  function addIngredient() {
    if (!newIngredientName.trim()) return;
    setIngredients([...ingredients, { name: newIngredientName.trim(), quantity: newIngredientQuantity.trim() }]);
    setNewIngredientName("");
    setNewIngredientQuantity("");
  }

  function removeStep(idx: number) {
    setSteps(steps.filter((_, i) => i !== idx).map((s, i) => ({ ...s, stepNumber: i + 1 })));
  }

  function addStep() {
    if (!newStepText.trim()) return;
    setSteps([...steps, { stepNumber: steps.length + 1, instructionText: newStepText.trim() }]);
    setNewStepText("");
  }

  async function handlePolishStep(idx: number) {
    const target = steps[idx];
    if (!target?.instructionText.trim()) return;
    setPolishingIdx(idx);
    try {
      const { text } = await api.polishStep(target.instructionText);
      setSteps((prev) => prev.map((s, i) => (i === idx ? { ...s, instructionText: text } : s)));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to polish step");
    } finally {
      setPolishingIdx(null);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      await api.updateRecipe(id, {
        title,
        description,
        difficulty,
        cookingTimeMinutes: cookingTime ? Number(cookingTime) : null,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        ingredients,
        steps: steps.map((s, idx) => ({ stepNumber: idx + 1, instructionText: s.instructionText })),
        status: "published",
        imageUrl: imageUrl ?? undefined,
        visibility,
      });
      router.replace(`/recipes/${id}`);
    } catch {
      setError("Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  if (loading || authLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-neutral-900">
        <ActivityIndicator size="large" color="#4C9A2A" />
      </View>
    );
  }

  if (error && !title) {
    return (
      <ScreenContainer>
        <Text className="rounded-md bg-red-50 p-3 text-sm text-danger">{error}</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      {error ? <Text className="mb-4 rounded-md bg-red-50 p-3 text-sm text-danger">{error}</Text> : null}

      <ImagePickerField label="Photo" imageUrl={imageUrl} onChange={setImageUrl} />

      <View className="mt-4 gap-4">
        <Input label="Title" value={title} onChangeText={setTitle} />
        <Input label="Description" value={description} onChangeText={setDescription} multiline />
      </View>

      <Text className="mt-4 text-sm font-medium text-neutral-700 dark:text-neutral-300">Difficulty</Text>
      <View className="mt-2 flex-row gap-2">
        {DIFFICULTIES.map((d) => (
          <Chip key={d} label={d} active={difficulty === d} onPress={() => setDifficulty(d)} className="flex-1" />
        ))}
      </View>

      <View className="mt-4">
        <Input
          label="Cooking time (minutes)"
          value={cookingTime}
          onChangeText={setCookingTime}
          keyboardType="numeric"
        />
      </View>

      <View className="mt-4">
        <Input label="Tags (comma separated)" value={tags} onChangeText={setTags} />
      </View>

      <Text className="mt-4 text-sm font-medium text-neutral-700 dark:text-neutral-300">Visibility</Text>
      <View className="mt-2 flex-row gap-3">
        <Pressable
          onPress={() => setVisibility("public")}
          className={`flex-1 rounded-lg border p-3 ${visibility === "public" ? "border-primary bg-primary-50 dark:bg-primary-900" : "border-neutral-300 dark:border-neutral-700"}`}
        >
          <Text className="font-semibold text-neutral-900 dark:text-neutral-50">🌍 Public</Text>
          <Text className="text-xs text-neutral-500 dark:text-neutral-400">Anyone can view this recipe</Text>
        </Pressable>
        <Pressable
          onPress={() => setVisibility("private")}
          className={`flex-1 rounded-lg border p-3 ${visibility === "private" ? "border-primary bg-primary-50 dark:bg-primary-900" : "border-neutral-300 dark:border-neutral-700"}`}
        >
          <Text className="font-semibold text-neutral-900 dark:text-neutral-50">🔒 Private</Text>
          <Text className="text-xs text-neutral-500 dark:text-neutral-400">Only you can view this recipe</Text>
        </Pressable>
      </View>

      <Text className="mt-6 text-lg font-semibold text-neutral-900 dark:text-neutral-50">Ingredients</Text>
      {ingredients.map((ing, idx) => (
        <View key={idx} className="mt-2 flex-row items-center gap-2">
          <Input
            value={ing.quantity}
            onChangeText={(v) => setIngredients((prev) => prev.map((p, i) => (i === idx ? { ...p, quantity: v } : p)))}
            placeholder="Qty"
            className="w-20"
          />
          <Input
            value={ing.name}
            onChangeText={(v) => setIngredients((prev) => prev.map((p, i) => (i === idx ? { ...p, name: v } : p)))}
            placeholder="Ingredient"
            className="flex-1"
          />
          <Pressable onPress={() => removeIngredient(idx)} hitSlop={8}>
            <MaterialCommunityIcons name="close" size={18} color="#a3a3a3" />
          </Pressable>
        </View>
      ))}
      <View className="mt-2 flex-row items-center gap-2">
        <Input value={newIngredientQuantity} onChangeText={setNewIngredientQuantity} placeholder="Qty" className="w-20" />
        <Input value={newIngredientName} onChangeText={setNewIngredientName} placeholder="Add ingredient" className="flex-1" />
        <Button variant="outline" size="sm" fullWidth={false} onPress={addIngredient}>
          Add
        </Button>
      </View>

      <Text className="mt-6 text-lg font-semibold text-neutral-900 dark:text-neutral-50">Steps</Text>
      {steps.map((step, idx) => (
        <Card key={idx} className="mt-2 flex-row items-start gap-2 bg-neutral-50 dark:bg-neutral-900">
          <Text className="mt-2 font-semibold text-neutral-900 dark:text-neutral-50">{idx + 1}.</Text>
          <Input
            value={step.instructionText}
            onChangeText={(v) =>
              setSteps((prev) => prev.map((p, i) => (i === idx ? { ...p, instructionText: v } : p)))
            }
            multiline
            className="flex-1"
          />
          <View className="gap-3 pt-2">
            <Pressable onPress={() => handlePolishStep(idx)} disabled={polishingIdx === idx} hitSlop={8}>
              <MaterialCommunityIcons name="creation" size={18} color={polishingIdx === idx ? "#d4d4d4" : "#4C9A2A"} />
            </Pressable>
            <Pressable onPress={() => removeStep(idx)} hitSlop={8}>
              <MaterialCommunityIcons name="close" size={18} color="#a3a3a3" />
            </Pressable>
          </View>
        </Card>
      ))}
      <View className="mt-2 flex-row items-start gap-2">
        <Input value={newStepText} onChangeText={setNewStepText} placeholder="Add step" multiline className="flex-1" />
        <Button variant="outline" size="sm" fullWidth={false} onPress={addStep}>
          Add
        </Button>
      </View>

      <View className="mt-6 flex-row gap-3 border-t border-neutral-200 dark:border-neutral-800 pt-4">
        <Button className="flex-1" variant="outline" onPress={() => router.back()}>
          Cancel
        </Button>
        <Button className="flex-1" onPress={handleSave} loading={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </View>
    </ScreenContainer>
  );
}
