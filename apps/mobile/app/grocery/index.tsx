import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import { Card } from "@/components/ui/Card";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { api, type GroceryList } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function GroceryListsScreen() {
  const { user, loading: authLoading } = useAuth();
  const [lists, setLists] = useState<GroceryList[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/(auth)/login");
      return;
    }
    api
      .getGroceryListsForUser(user.id)
      .then(setLists)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  function confirmDelete(list: GroceryList) {
    Alert.alert("Delete list?", `This will permanently delete "${list.name}" and all its items.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setDeletingId(list.id);
          try {
            await api.deleteGroceryList(list.id);
            setLists((prev) => prev.filter((l) => l.id !== list.id));
          } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to delete list");
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  }

  if (authLoading || loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-neutral-900">
        <ActivityIndicator size="large" color="#4C9A2A" />
      </View>
    );
  }

  return (
    <ScreenContainer>
      <Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">Your Grocery Lists</Text>

      {lists.length === 0 ? (
        <View className="mt-12 items-center">
          <Text className="mb-4 text-neutral-500 dark:text-neutral-400">No grocery lists yet</Text>
          <Link href="/(tabs)/browse" className="text-primary">
            Browse recipes
          </Link>
        </View>
      ) : (
        <View className="mt-6 gap-3">
          {lists.map((list) => (
            <Pressable key={list.id} onPress={() => router.push(`/grocery/${list.id}`)}>
              <Card className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-base font-semibold text-neutral-900 dark:text-neutral-50">{list.name}</Text>
                  <Text className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    Created {new Date(list.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <Pressable onPress={() => confirmDelete(list)} disabled={deletingId === list.id} hitSlop={8}>
                  <MaterialCommunityIcons name="trash-can-outline" size={20} color="#a3a3a3" />
                </Pressable>
              </Card>
            </Pressable>
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}
