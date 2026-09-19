import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { RecipeListItem } from "@/components/RecipeListItem";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { api } from "@/lib/api";

const DIFFICULTIES = ["All", "easy", "medium", "hard"];

const SEARCH_DEBOUNCE_MS = 400;

export default function BrowseScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearchQuery(searchQuery), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .getRecipes({ search: debouncedSearchQuery || undefined, difficulty: difficultyFilter || undefined })
      .then((data) => {
        if (!cancelled) setRecipes(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setRecipes([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedSearchQuery, difficultyFilter]);

  return (
    <ScreenContainer>
      <Text className="mb-3 text-2xl font-bold text-neutral-900 dark:text-neutral-50">Recipes</Text>
      <Button
        className="mb-3"
        variant="outline"
        onPress={() => router.push("/recipes/match")}
      >
        🥘 What can I cook?
      </Button>
      <Input placeholder="Search recipes..." value={searchQuery} onChangeText={setSearchQuery} className="mb-3" />
      <View className="mb-4">
        <Text className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">Difficulty</Text>
        <View className="flex-row gap-2">
          {DIFFICULTIES.map((d) => (
            <Chip
              key={d}
              label={d}
              active={difficultyFilter === (d === "All" ? "" : d)}
              onPress={() => setDifficultyFilter(d === "All" ? "" : d)}
            />
          ))}
        </View>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#4C9A2A" />
      ) : recipes.length === 0 ? (
        <Text className="text-neutral-500 dark:text-neutral-400">No recipes found.</Text>
      ) : (
        recipes.map((item) => (
          <RecipeListItem key={item.id} recipe={item} onPress={() => router.push(`/recipes/${item.id}`)} />
        ))
      )}
    </ScreenContainer>
  );
}
