import { Link } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { api } from "@/lib/api";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit() {
    setError("");
    setLoading(true);
    try {
      const result = await api.forgotPassword(email);
      setMessage(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer>
      <Text className="text-neutral-600 dark:text-neutral-400">
        Enter your email and we&apos;ll send you a link to reset it.
      </Text>

      {message ? (
        <View className="mt-6 rounded-md bg-primary-50 dark:bg-primary-900 p-3">
          <Text className="text-sm text-primary-700 dark:text-primary-200">{message}</Text>
        </View>
      ) : (
        <View className="mt-6 gap-4">
          {error ? (
            <Text className="rounded-md bg-red-50 p-3 text-sm text-danger">{error}</Text>
          ) : null}
          <Input
            label="Email"
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <Button onPress={handleSubmit} loading={loading}>
            {loading ? "Sending..." : "Send reset link"}
          </Button>
        </View>
      )}

      <Text className="mt-6 text-center text-sm text-neutral-600 dark:text-neutral-400">
        <Link href="/(auth)/login" className="text-primary">
          Back to log in
        </Link>
      </Text>
    </ScreenContainer>
  );
}
