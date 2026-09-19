import { router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { VoiceRecorderButton } from "@/components/VoiceRecorderButton";
import { api } from "@/lib/api";
import { useCreateRecipe } from "@/lib/create-recipe-context";

const LANGUAGES = [
  { code: "auto", label: "Auto" },
  { code: "en", label: "EN" },
  { code: "es", label: "ES" },
  { code: "fr", label: "FR" },
];

export default function CreateInputScreen() {
  const { state, update } = useCreateRecipe();
  const [loading, setLoading] = useState(false);

  async function handleStructure() {
    if (!state.recipeText.trim()) {
      alert("Please enter recipe text");
      return;
    }
    setLoading(true);
    try {
      const result = await api.structureRecipe(state.recipeText, state.language);
      update({
        title: result.title || "",
        description: result.description || "",
        difficulty: result.difficulty || "medium",
        tags: result.tags || [],
        ingredients: result.ingredients || [],
        steps: result.steps || [],
        cookingTimeMinutes: result.cookingTimeMinutes || null,
      });
      router.push("/create/preview");
    } catch {
      alert("Failed to structure recipe. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer>
      <Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">Create Recipe</Text>
      <Text className="mt-2 text-neutral-600 dark:text-neutral-400">Share your recipe with the community. Use voice or text.</Text>

      <View className="mt-6 gap-3">
        <Button
          variant={state.inputMethod === "voice" ? "primary" : "outline"}
          onPress={() => update({ inputMethod: "voice" })}
        >
          🎤 Use voice
        </Button>
        <Button
          variant={state.inputMethod === "text" ? "primary" : "outline"}
          onPress={() => update({ inputMethod: "text" })}
        >
          ✏️ Write recipe
        </Button>
      </View>

      <Text className="mt-6 text-sm font-medium text-neutral-700 dark:text-neutral-300">Language</Text>
      <View className="mt-2 flex-row gap-2">
        {LANGUAGES.map((lang) => (
          <Chip
            key={lang.code}
            label={lang.label}
            active={state.language === lang.code}
            onPress={() => update({ language: lang.code })}
            className="flex-1"
          />
        ))}
      </View>

      <View className="mt-6">
        <Input
          label="Recipe Text"
          placeholder={`Paste your recipe ${state.inputMethod === "voice" ? "or record audio..." : "instructions here..."}`}
          value={state.recipeText}
          onChangeText={(text) => update({ recipeText: text })}
          multiline
        />
      </View>

      {state.inputMethod === "voice" && (
        <VoiceRecorderButton
          language={state.language === "auto" ? undefined : state.language}
          onTranscribed={(text) =>
            update({ recipeText: state.recipeText ? `${state.recipeText}\n${text}` : text })
          }
        />
      )}

      <Button className="mt-6" onPress={handleStructure} loading={loading}>
        {loading ? "Structuring..." : "Structure with AI"}
      </Button>

      <Text className="mt-8 text-xs text-neutral-500 dark:text-neutral-400">
        Our AI will analyze your recipe and organize it into ingredients, steps, timing, and more.
      </Text>
    </ScreenContainer>
  );
}
