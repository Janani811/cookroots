import { Tabs } from "expo-router";
import { CustomTabBar } from "@/components/CustomTabBar";
import { NotificationBellButton } from "@/components/NotificationBellButton";
import { useTheme } from "@/lib/theme-context";

export default function TabsLayout() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerTintColor: isDark ? "#6EBB49" : "#4C9A2A",
        headerTitleStyle: { color: isDark ? "#E9F2E2" : "#171717" },
        headerStyle: { backgroundColor: isDark ? "#12180F" : "#ffffff" },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Home", headerRight: () => <NotificationBellButton /> }}
      />
      <Tabs.Screen name="browse" options={{ title: "Browse" }} />
      <Tabs.Screen name="create" options={{ title: "Create" }} />
      <Tabs.Screen name="dashboard" options={{ title: "Dashboard" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
