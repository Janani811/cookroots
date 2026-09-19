import { Link, router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { useAuth } from "@/lib/auth-context";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      router.replace("/(tabs)/profile");
    } catch {
      alert("Login failed. Please check your email and password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer>
      <View className="gap-4">
        <Input
          label="Email"
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <View>
          <PasswordInput label="Password" placeholder="••••••••" value={password} onChangeText={setPassword} />
          <Link href="/(auth)/forgot-password" className="mt-2 self-end text-xs text-primary">
            Forgot password?
          </Link>
        </View>

        <Button className="mt-2" onPress={handleLogin} loading={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </Button>

        <Text className="mt-4 text-center text-neutral-600 dark:text-neutral-400">
          Don't have an account?{" "}
          <Link href="/(auth)/signup" className="font-semibold text-primary">
            Sign up
          </Link>
        </Text>
      </View>
    </ScreenContainer>
  );
}
