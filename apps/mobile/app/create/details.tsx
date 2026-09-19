import { router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { api } from "@/lib/api";
import { useCreateRecipe } from "@/lib/create-recipe-context";

export default function CreateDetailsScreen() {
  const { state, reset } = useCreateRecipe();
  const [loading, setLoading] = useState(false);

  async function handlePublish() {
    if (!state.title.trim()) {
      alert("Recipe title is required");
      return;
    }
    if (state.ingredients.length === 0) {
      alert("At least one ingredient is required");
      return;
    }
    if (state.steps.length === 0) {
      alert("At least one step is required");
      return;
    }

    setLoading(true);
    try {
      await api.createRecipe({
        title: state.title,
        description: state.description,
        difficulty: state.difficulty,
        tags: state.tags,
        ingredients: state.ingredients,
        steps: state.steps,
        cookingTimeMinutes: state.cookingTimeMinutes,
      });
      reset();
      alert("Recipe published successfully!");
      router.replace("/(tabs)/dashboard");
    } catch {
      alert("Failed to create recipe. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer>
      <Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">Final Review</Text>
      <Text className="mt-1 text-neutral-600 dark:text-neutral-400">Check your recipe one more time before publishing</Text>

      <Card className="mt-6 bg-neutral-50 dark:bg-neutral-900">
        <Text className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">{state.title}</Text>
        {state.description ? <Text className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">{state.description}</Text> : null}
        <View className="mt-3 flex-row flex-wrap gap-2">
          <Badge tone="primary">{state.difficulty}</Badge>
          {state.tags.map((tag) => (
            <Badge key={tag}>{`#${tag}`}</Badge>
          ))}
        </View>
      </Card>

      {state.cookingTimeMinutes ? (
        <View className="mt-4 rounded-lg bg-primary-50 dark:bg-primary-900 p-3">
          <Text className="text-sm text-primary-700">⏱️ {state.cookingTimeMinutes} minutes cooking time</Text>
        </View>
      ) : null}

      <Text className="mt-6 text-lg font-semibold text-neutral-900 dark:text-neutral-50">
        Ingredients ({state.ingredients.length})
      </Text>
      <View className="mt-2 gap-1">
        {state.ingredients.map((ing, idx) => (
          <View key={idx} className="flex-row items-center gap-2">
            <Text className="text-neutral-900 dark:text-neutral-50">☐</Text>
            <Text className="text-sm text-neutral-700 dark:text-neutral-300">
              {ing.quantity} {ing.name}
            </Text>
          </View>
        ))}
      </View>

      <Text className="mt-6 text-lg font-semibold text-neutral-900 dark:text-neutral-50">Steps ({state.steps.length})</Text>
      <View className="mt-2 gap-2">
        {state.steps.map((step, idx) => (
          <View key={idx} className="flex-row gap-2">
            <Text className="font-semibold text-neutral-900 dark:text-neutral-50">{idx + 1}.</Text>
            <Text className="flex-1 text-sm text-neutral-700 dark:text-neutral-300">{step.instructionText}</Text>
          </View>
        ))}
      </View>

      <View className="mt-6 flex-row gap-3 border-t border-neutral-200 dark:border-neutral-800 pt-4">
        <Button className="flex-1" variant="outline" onPress={() => router.back()}>
          ← Edit
        </Button>
        <Button className="flex-1" onPress={handlePublish} loading={loading}>
          {loading ? "Publishing..." : "🚀 Publish"}
        </Button>
      </View>
    </ScreenContainer>
  );
}
