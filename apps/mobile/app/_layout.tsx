import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "@/lib/auth-context";
import { CreateRecipeProvider } from "@/lib/create-recipe-context";
import { ThemeProvider, useTheme } from "@/lib/theme-context";
import "../global.css";

function ThemedStack() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const tint = isDark ? "#6EBB49" : "#4C9A2A";
  const bg = isDark ? "#12180F" : "#ffffff";
  const text = isDark ? "#E9F2E2" : "#171717";

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerTintColor: tint,
          headerTitleStyle: { color: text },
          headerStyle: { backgroundColor: bg },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: bg },
        }}
      >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)/login" options={{ title: "Sign In" }} />
          <Stack.Screen name="(auth)/signup" options={{ title: "Create Account" }} />
          <Stack.Screen name="(auth)/forgot-password" options={{ title: "Forgot Password" }} />
          <Stack.Screen name="(auth)/reset-password" options={{ title: "Reset Password" }} />
          <Stack.Screen name="recipes/[id]/index" options={{ title: "Recipe" }} />
          <Stack.Screen name="recipes/[id]/cook" options={{ title: "Cooking Mode" }} />
          <Stack.Screen name="recipes/[id]/edit" options={{ title: "Edit Recipe" }} />
          <Stack.Screen name="recipes/match" options={{ title: "What Can I Cook?" }} />
          <Stack.Screen name="grocery/index" options={{ title: "Grocery Lists" }} />
          <Stack.Screen name="grocery/[listId]" options={{ title: "Grocery List" }} />
          <Stack.Screen name="notifications" options={{ title: "Notifications" }} />
          <Stack.Screen name="create/preview" options={{ title: "Preview" }} />
          <Stack.Screen name="create/details" options={{ title: "Final Review" }} />
        </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CreateRecipeProvider>
          <ThemeProvider>
            <ThemedStack />
          </ThemeProvider>
        </CreateRecipeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
