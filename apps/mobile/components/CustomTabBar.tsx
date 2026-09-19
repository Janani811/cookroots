import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import type { ComponentProps } from "react";
import { Pressable, View } from "react-native";
import { useTheme } from "@/lib/theme-context";

type TabBarProps = NonNullable<ComponentProps<typeof Tabs>["tabBar"]> extends (
  props: infer P,
) => any
  ? P
  : never;

const icons = {
  index: "home-outline",
  browse: "magnify",
  create: "plus-circle-outline",
  dashboard: "chart-line",
  profile: "account-outline",
} as const;

export function CustomTabBar({ state, descriptors, navigation, insets }: TabBarProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <View
      style={{ paddingBottom: Math.max(insets.bottom, 10), backgroundColor: isDark ? "#12180F" : "#ffffff" }}
      className="px-4 pt-2"
    >
      <View
        className="flex-row justify-around rounded-full py-2 px-1.5"
        style={{
          backgroundColor: isDark ? "#0A0F08" : "#16241C",
          shadowColor: "#000",
          shadowOpacity: 0.25,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 8 },
          elevation: 8,
        }}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const iconName = icons[route.name as keyof typeof icons] ?? "circle";

          function onPress() {
            const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          }

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={options.title ?? route.name}
              className={`items-center justify-center rounded-full px-4 py-2.5 ${focused ? "bg-primary" : ""}`}
            >
              <MaterialCommunityIcons
                name={iconName as any}
                size={22}
                color={focused ? "#FFFFFF" : "#A9B7AE"}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
