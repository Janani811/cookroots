import { Link, router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { api } from "@/lib/api";

export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit() {
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    setLoading(true);
    try {
      await api.resetPassword(token ?? "", password);
      setDone(true);
      setTimeout(() => router.replace("/(auth)/login"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "This reset link is invalid or has expired.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <ScreenContainer>
        <Text className="rounded-md bg-red-50 p-3 text-sm text-danger">
          This reset link is missing its token. Please request a new one.
        </Text>
        <Link href="/(auth)/forgot-password" className="mt-3 text-sm text-primary">
          Request a new reset link
        </Link>
      </ScreenContainer>
    );
  }

  if (done) {
    return (
      <ScreenContainer>
        <Text className="rounded-md bg-primary-50 dark:bg-primary-900 p-3 text-sm text-primary-700 dark:text-primary-200">
          Your password has been reset. Redirecting you to log in...
        </Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Text className="text-neutral-600 dark:text-neutral-400">Choose a new password for your account.</Text>
      <View className="mt-6 gap-4">
        {error ? (
          <View className="gap-2">
            <Text className="rounded-md bg-red-50 p-3 text-sm text-danger">{error}</Text>
            <Link href="/(auth)/forgot-password" className="text-sm text-primary">
              Request a new reset link
            </Link>
          </View>
        ) : null}
        <PasswordInput label="New password" value={password} onChangeText={setPassword} />
        <PasswordInput label="Confirm new password" value={confirmPassword} onChangeText={setConfirmPassword} />
        <Button onPress={handleSubmit} loading={loading}>
          {loading ? "Resetting..." : "Reset password"}
        </Button>
      </View>
    </ScreenContainer>
  );
}
