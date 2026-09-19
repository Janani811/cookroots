import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { RecipeListItem } from "@/components/RecipeListItem";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type VisibilityTab = "all" | "public" | "private";

export default function DashboardScreen() {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [visibilityTab, setVisibilityTab] = useState<VisibilityTab>("all");

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    setLoading(true);
    api
      .getRecipes({ createdBy: user.id })
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
  }, [user?.id]);

  if (!user) {
    return (
      <ScreenContainer>
        <Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">Dashboard</Text>
        <Card className="mt-6">
          <Text className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">Sign in required</Text>
          <Text className="mt-3 text-neutral-600 dark:text-neutral-400">
            Sign in to see your recipes and engagement stats.
          </Text>
          <Button className="mt-4" onPress={() => router.push("/(auth)/login")}>
            Sign In
          </Button>
        </Card>
      </ScreenContainer>
    );
  }

  const stats = {
    totalRecipes: recipes.length,
    totalLikes: recipes.reduce((sum, r) => sum + (r.likesCount || 0), 0),
    totalComments: recipes.reduce((sum, r) => sum + (r.commentsCount || 0), 0),
  };

  return (
    <ScreenContainer>
      <Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">Your Dashboard</Text>
      <Text className="mt-1 text-neutral-600 dark:text-neutral-400">Manage your recipes and track engagement</Text>

      <Button className="mt-4" onPress={() => router.push("/(tabs)/create")}>
        + Create New Recipe
      </Button>

      <View className="mt-6 gap-3">
        <Card>
          <Text className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Total Recipes</Text>
          <Text className="mt-1 text-3xl font-bold text-neutral-900 dark:text-neutral-50">{stats.totalRecipes}</Text>
        </Card>
        <Card>
          <Text className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Total Likes</Text>
          <Text className="mt-1 text-3xl font-bold text-neutral-900 dark:text-neutral-50">{stats.totalLikes}</Text>
        </Card>
        <Card>
          <Text className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Total Comments</Text>
          <Text className="mt-1 text-3xl font-bold text-neutral-900 dark:text-neutral-50">{stats.totalComments}</Text>
        </Card>
      </View>

      <Text className="mt-8 text-lg font-semibold text-neutral-900 dark:text-neutral-50">Your Recipes</Text>

      {recipes.length > 0 && (
        <View className="mt-3 flex-row gap-2">
          <Chip label="All" active={visibilityTab === "all"} onPress={() => setVisibilityTab("all")} />
          <Chip
            label="Public"
            active={visibilityTab === "public"}
            onPress={() => setVisibilityTab("public")}
          />
          <Chip
            label="Private"
            active={visibilityTab === "private"}
            onPress={() => setVisibilityTab("private")}
          />
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#4C9A2A" style={{ marginTop: 20 }} />
      ) : recipes.length === 0 ? (
        <Text className="mt-4 text-neutral-500 dark:text-neutral-400">
          You haven't created any recipes yet. Start by creating one!
        </Text>
      ) : (
        (() => {
          const filtered =
            visibilityTab === "all"
              ? recipes
              : recipes.filter((r) => r.visibility === visibilityTab);

          if (filtered.length === 0) {
            return (
              <Text className="mt-4 text-neutral-500 dark:text-neutral-400">
                No {visibilityTab} recipes yet.
              </Text>
            );
          }

          return (
            <View className="mt-3">
              {filtered.map((recipe) => (
                <RecipeListItem
                  key={recipe.id}
                  recipe={recipe}
                  onPress={() => router.push(`/recipes/${recipe.id}`)}
                />
              ))}
            </View>
          );
        })()
      )}
    </ScreenContainer>
  );
}
