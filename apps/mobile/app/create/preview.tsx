import { router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { api } from "@/lib/api";
import { useCreateRecipe } from "@/lib/create-recipe-context";

const DIFFICULTIES = ["easy", "medium", "hard"] as const;

export default function CreatePreviewScreen() {
  const { state, update } = useCreateRecipe();
  const [loading, setLoading] = useState(false);

  async function handleImprove() {
    setLoading(true);
    try {
      const result = await api.improveRecipe(
        JSON.stringify({
          title: state.title,
          description: state.description,
          difficulty: state.difficulty,
          tags: state.tags,
          ingredients: state.ingredients,
          steps: state.steps,
          cookingTimeMinutes: state.cookingTimeMinutes,
        }),
        state.language === "auto" ? undefined : state.language
      );
      update({
        title: result.improved.title,
        description: result.improved.description || "",
        ingredients: result.improved.ingredients,
        steps: result.improved.steps,
        difficulty: result.improved.difficulty || "medium",
        tags: result.improved.tags,
        cookingTimeMinutes: result.improved.cookingTimeMinutes,
      });
      alert("Recipe improved successfully!");
    } catch {
      alert("Failed to improve recipe. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer>
      <Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">Preview</Text>
      <Text className="mt-1 text-neutral-600 dark:text-neutral-400">Check and edit your recipe details before saving.</Text>

      <View className="mt-6 gap-4">
        <Input label="Title" value={state.title} onChangeText={(text) => update({ title: text })} />
        <Input
          label="Description"
          value={state.description}
          onChangeText={(text) => update({ description: text })}
          multiline
        />
      </View>

      <Text className="mt-4 text-sm font-medium text-neutral-700 dark:text-neutral-300">Difficulty</Text>
      <View className="mt-2 flex-row gap-2">
        {DIFFICULTIES.map((d) => (
          <Chip
            key={d}
            label={d}
            active={state.difficulty === d}
            onPress={() => update({ difficulty: d })}
            className="flex-1"
          />
        ))}
      </View>

      <Text className="mt-6 text-lg font-semibold text-neutral-900 dark:text-neutral-50">
        Ingredients ({state.ingredients.length})
      </Text>
      {state.ingredients.map((ing, idx) => (
        <Card key={idx} className="mt-2 bg-neutral-50 dark:bg-neutral-900">
          <Text className="text-neutral-900 dark:text-neutral-50">
            {ing.quantity} {ing.name}
          </Text>
        </Card>
      ))}

      <Text className="mt-6 text-lg font-semibold text-neutral-900 dark:text-neutral-50">Steps ({state.steps.length})</Text>
      {state.steps.map((step, idx) => (
        <Card key={idx} className="mt-2 bg-neutral-50 dark:bg-neutral-900">
          <Text className="font-semibold text-neutral-900 dark:text-neutral-50">Step {step.stepNumber || idx + 1}</Text>
          <Text className="mt-1 text-neutral-700 dark:text-neutral-300">{step.instructionText}</Text>
        </Card>
      ))}

      <View className="mt-6 gap-3">
        <View className="flex-row gap-3">
          <Button className="flex-1" variant="outline" onPress={() => router.back()}>
            ← Back
          </Button>
          <Button className="flex-1" variant="outline" onPress={handleImprove} loading={loading}>
            {loading ? "Improving..." : "✨ Improve"}
          </Button>
        </View>
        <Button onPress={() => router.push("/create/details")}>Continue to Details →</Button>
      </View>
    </ScreenContainer>
  );
}
