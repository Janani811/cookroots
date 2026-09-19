import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { api, type AppNotification } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

function notificationText(n: AppNotification): string {
  const name = n.actor.name || "Someone";
  const recipe = n.recipeTitle ? `"${n.recipeTitle}"` : "your recipe";
  switch (n.type) {
    case "like":
      return `${name} liked ${recipe}`;
    case "comment":
      return `${name} commented on ${recipe}${n.data ? `: "${n.data}"` : ""}`;
    case "reply":
      return `${name} replied to your comment on ${recipe}${n.data ? `: "${n.data}"` : ""}`;
    case "rating":
      return `${name} rated ${recipe}${n.data ? ` ${n.data}★` : ""}`;
    case "tried":
      return `${name} tried ${recipe}`;
    default:
      return `${name} did something on ${recipe}`;
  }
}

export default function NotificationsScreen() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      let cancelled = false;
      api
        .getNotifications()
        .then((data) => {
          if (!cancelled) setNotifications(data);
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, [user])
  );

  async function handlePress(n: AppNotification) {
    if (!n.isRead) {
      setNotifications((prev) => prev.map((item) => (item.id === n.id ? { ...item, isRead: true } : item)));
      api.markNotificationRead(n.id).catch(() => {});
    }
    if (n.recipeId) router.push(`/recipes/${n.recipeId}`);
  }

  async function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    api.markAllNotificationsRead().catch(() => {});
  }

  if (!user) {
    return (
      <ScreenContainer>
        <Text className="text-neutral-600 dark:text-neutral-400">Sign in to see your notifications.</Text>
      </ScreenContainer>
    );
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-neutral-900">
        <ActivityIndicator size="large" color="#4C9A2A" />
      </View>
    );
  }

  return (
    <ScreenContainer>
      {notifications.some((n) => !n.isRead) ? (
        <Button variant="ghost" size="sm" fullWidth={false} className="mb-4 self-end" onPress={handleMarkAllRead}>
          Mark all read
        </Button>
      ) : null}

      {notifications.length === 0 ? (
        <Text className="text-center text-neutral-500 dark:text-neutral-400">No notifications yet</Text>
      ) : (
        notifications.map((n) => (
          <Pressable
            key={n.id}
            onPress={() => handlePress(n)}
            className={`mb-2 rounded-lg border border-neutral-200 dark:border-neutral-800 px-4 py-3 ${!n.isRead ? "bg-primary-50 dark:bg-primary-900" : "bg-white dark:bg-neutral-900"}`}
          >
            <Text className={`text-sm text-neutral-900 dark:text-neutral-50 ${!n.isRead ? "font-semibold" : ""}`}>
              {notificationText(n)}
            </Text>
            <Text className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{new Date(n.createdAt).toLocaleString()}</Text>
          </Pressable>
        ))
      )}
    </ScreenContainer>
  );
}
