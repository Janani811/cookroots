import { router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { api } from "@/lib/api";

type MatchResult = {
  recipeId: string;
  title: string;
  matchType: "exact" | "partial";
  matchedIngredients: string[];
  missingIngredients: string[];
};

export default function MatchIngredientsScreen() {
  const [input, setInput] = useState("");
  const [results, setResults] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  async function handleSearch() {
    const ingredientList = input
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (ingredientList.length === 0) {
      setError("Enter at least one ingredient");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const data = await api.matchIngredients(ingredientList);
      setResults(Array.isArray(data) ? data : []);
    } catch {
      setError("Failed to search recipes");
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }

  return (
    <ScreenContainer>
      <Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">What can I cook?</Text>
      <Text className="mt-2 text-neutral-600 dark:text-neutral-400">
        List the ingredients you have and we'll find recipes you can make.
      </Text>

      <View className="mt-4">
        <Input
          placeholder="e.g. eggs, onions, chili powder"
          multiline
          value={input}
          onChangeText={setInput}
          className="min-h-24"
        />
      </View>
      {error ? <Text className="mt-2 text-sm text-danger">{error}</Text> : null}
      <Button className="mt-3" onPress={handleSearch} loading={loading}>
        Find recipes
      </Button>

      {results.map((match) => (
        <Card key={match.recipeId} className="mt-4">
          <View className="flex-row items-start justify-between gap-2">
            <Text className="flex-1 text-lg font-semibold text-neutral-900 dark:text-neutral-50">
              {match.title}
            </Text>
            <Badge tone={match.matchType === "exact" ? "success" : "neutral"}>{match.matchType}</Badge>
          </View>
          <Text className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            {match.matchType === "exact" ? "You have everything you need" : "Partial match"}
          </Text>
          {match.matchedIngredients?.length > 0 ? (
            <Text className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">
              ✓ Have: {match.matchedIngredients.join(", ")}
            </Text>
          ) : null}
          {match.missingIngredients?.length > 0 ? (
            <Text className="mt-1 text-sm text-neutral-500 dark:text-neutral-500">
              Missing: {match.missingIngredients.join(", ")}
            </Text>
          ) : null}
          <Button
            className="mt-3"
            variant="outline"
            size="sm"
            onPress={() => router.push(`/recipes/${match.recipeId}`)}
          >
            View recipe
          </Button>
        </Card>
      ))}

      {!loading && searched && results.length === 0 ? (
        <Text className="mt-4 text-neutral-500 dark:text-neutral-400">No matching recipes yet.</Text>
      ) : null}
    </ScreenContainer>
  );
}
