import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { RecipeListItem } from "@/components/RecipeListItem";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function HomeScreen() {
  const { user } = useAuth();
  const [recentRecipes, setRecentRecipes] = useState<any[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [yourRecipes, setYourRecipes] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api
      .getRecipes()
      .then((data) => {
        if (!cancelled) setRecentRecipes(Array.isArray(data) ? data.slice(0, 5) : []);
      })
      .catch(() => {
        if (!cancelled) setRecentRecipes([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingRecent(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setYourRecipes([]);
      setUnreadCount(0);
      return;
    }
    let cancelled = false;
    api
      .getRecipes({ createdBy: user.id })
      .then((data) => {
        if (!cancelled) setYourRecipes(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setYourRecipes([]);
      });
    api
      .getUnreadNotificationCount()
      .then((r) => {
        if (!cancelled) setUnreadCount(r.count);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const stats = {
    totalRecipes: yourRecipes.length,
    totalLikes: yourRecipes.reduce((sum, r) => sum + (r.likesCount || 0), 0),
  };

  return (
    <ScreenContainer>
      <Text className="text-sm font-medium text-primary">CookRoots</Text>
      <Text className="mt-2 text-3xl font-bold text-neutral-900 dark:text-neutral-50">
        Cook hands-free with AI-structured recipes
      </Text>
      <Text className="mt-3 text-base leading-6 text-neutral-600 dark:text-neutral-400">
        Browse community recipes and follow step-by-step cooking mode on your phone.
      </Text>
      <View className="mt-8 gap-3">
        <Button onPress={() => router.push("/(tabs)/browse")}>Browse recipes</Button>
        <Button variant="outline" onPress={() => router.push("/(tabs)/create")}>
          Create recipe
        </Button>
      </View>

      {user ? (
        <>
          <View className="mt-8 flex-row gap-3">
            <Card className="flex-1">
              <Text className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Your Recipes</Text>
              <Text className="mt-1 text-2xl font-bold text-neutral-900 dark:text-neutral-50">
                {stats.totalRecipes}
              </Text>
            </Card>
            <Card className="flex-1">
              <Text className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Total Likes</Text>
              <Text className="mt-1 text-2xl font-bold text-neutral-900 dark:text-neutral-50">
                {stats.totalLikes}
              </Text>
            </Card>
          </View>

          {unreadCount > 0 && (
            <Pressable onPress={() => router.push("/notifications")}>
              <Card className="mt-3 flex-row items-center justify-between">
                <Text className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                  🔔 {unreadCount} new notification{unreadCount === 1 ? "" : "s"}
                </Text>
                <Text className="text-sm font-semibold text-primary">View</Text>
              </Card>
            </Pressable>
          )}

          {yourRecipes.length > 0 && (
            <>
              <Text className="mt-8 text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                Your recent recipes
              </Text>
              <View className="mt-3">
                {yourRecipes.slice(0, 3).map((recipe) => (
                  <RecipeListItem
                    key={recipe.id}
                    recipe={recipe}
                    onPress={() => router.push(`/recipes/${recipe.id}`)}
                  />
                ))}
              </View>
            </>
          )}
        </>
      ) : null}

      <View className="mt-8 flex-row items-center justify-between">
        <Text className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">Recent recipes</Text>
        <Text
          className="text-sm font-semibold text-primary"
          onPress={() => router.push("/(tabs)/browse")}
        >
          See all
        </Text>
      </View>

      {loadingRecent ? (
        <ActivityIndicator size="large" color="#4C9A2A" style={{ marginTop: 16 }} />
      ) : recentRecipes.length === 0 ? (
        <Text className="mt-4 text-neutral-500 dark:text-neutral-400">No recipes yet. Be the first to post one!</Text>
      ) : (
        <View className="mt-3">
          {recentRecipes.map((recipe) => (
            <RecipeListItem
              key={recipe.id}
              recipe={recipe}
              onPress={() => router.push(`/recipes/${recipe.id}`)}
            />
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}
