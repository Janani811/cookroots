import { Link, router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { useAuth } from "@/lib/auth-context";

export default function SignupScreen() {
  const { signup } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    if (!name || !email || !password) {
      alert("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      await signup(name, email, password);
      router.replace("/(tabs)/profile");
    } catch {
      alert("Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer>
      <View className="gap-4">
        <Input label="Full Name" placeholder="John Doe" value={name} onChangeText={setName} />
        <Input
          label="Email"
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <PasswordInput label="Password" placeholder="••••••••" value={password} onChangeText={setPassword} />

        <Button className="mt-2" onPress={handleSignup} loading={loading}>
          {loading ? "Creating account..." : "Create Account"}
        </Button>

        <Text className="mt-4 text-center text-neutral-600 dark:text-neutral-400">
          Already have an account?{" "}
          <Link href="/(auth)/login" className="font-semibold text-primary">
            Sign in
          </Link>
        </Text>
      </View>
    </ScreenContainer>
  );
}
