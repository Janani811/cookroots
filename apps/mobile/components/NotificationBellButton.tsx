import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";

const POLL_INTERVAL_MS = 30_000;

export function NotificationBellButton() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    function refresh() {
      api
        .getUnreadNotificationCount()
        .then((r) => setCount(r.count))
        .catch(() => {});
    }
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [user]);

  if (!user) return null;

  return (
    <Pressable onPress={() => router.push("/notifications")} className="mr-4" hitSlop={8}>
      <View>
        <MaterialCommunityIcons name="bell-outline" size={22} color={theme === "dark" ? "#E9F2E2" : "#171717"} />
        {count > 0 ? (
          <View className="absolute -right-1.5 -top-1.5 min-w-4 items-center justify-center rounded-full bg-danger px-1">
            <Text className="text-[10px] font-semibold text-white">{count > 9 ? "9+" : count}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
