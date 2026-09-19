import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import * as Speech from "expo-speech";
import { ActivityIndicator, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { api } from "@/lib/api";
import { TTS_LOCALES, type RecipeLanguageCode } from "@/lib/languages";

export default function CookModeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [recipe, setRecipe] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [autoRead, setAutoRead] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const autoReadRef = useRef(autoRead);
  autoReadRef.current = autoRead;

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    api
      .getRecipe(id)
      .then((data) => {
        if (!cancelled) setRecipe(data);
      })
      .catch(() => {
        if (!cancelled) setRecipe(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  const steps = recipe?.steps || [];
  const current = steps[step];

  function speakStep(text: string) {
    if (!text) return;
    Speech.stop();
    const langCode = recipe?.language as RecipeLanguageCode | undefined;
    setSpeaking(true);
    Speech.speak(text, {
      language: langCode ? TTS_LOCALES[langCode] : undefined,
      rate: 0.95,
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  }

  function goToStep(index: number) {
    setStep(index);
    Speech.stop();
    if (autoReadRef.current) {
      const text = steps[index]?.instructionText;
      if (text) speakStep(text);
    }
  }

  function handleListen() {
    if (speaking) {
      Speech.stop();
      setSpeaking(false);
      return;
    }
    if (current?.instructionText) speakStep(current.instructionText);
  }

  if (loading || !recipe) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-neutral-900">
        <ActivityIndicator size="large" color="#4C9A2A" />
      </View>
    );
  }

  return (
    <ScreenContainer scroll={false}>
      <Text className="text-sm text-neutral-500 dark:text-neutral-400">Cooking mode</Text>
      <Text className="mt-1 text-xl font-bold text-neutral-900 dark:text-neutral-50">{recipe.title}</Text>
      <Text className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
        Step {step + 1} of {steps.length}
      </Text>

      <View className="mt-3 flex-row items-center gap-2">
        <Chip label="🔇 Off" active={!autoRead} onPress={() => setAutoRead(false)} />
        <Chip label="🔊 Auto-read" active={autoRead} onPress={() => setAutoRead(true)} />
      </View>

      <Card className="mt-4 flex-1 items-start justify-center p-6">
        <Text className="text-6xl font-bold text-primary">{current?.stepNumber || step + 1}</Text>
        <Text className="mt-4 text-lg leading-7 text-neutral-800 dark:text-neutral-100">
          {current?.instructionText || "No steps"}
        </Text>
        <Button
          className="mt-5"
          variant="outline"
          size="sm"
          fullWidth={false}
          onPress={handleListen}
          disabled={!current?.instructionText}
        >
          {speaking ? "⏹ Stop" : "🔊 Listen"}
        </Button>
      </Card>

      <View className="mt-4 flex-row gap-3">
        <Button
          className="flex-1"
          variant="outline"
          onPress={() => goToStep(Math.max(0, step - 1))}
          disabled={step === 0}
        >
          Previous
        </Button>
        <Button
          className="flex-1"
          onPress={() => goToStep(Math.min(steps.length - 1, step + 1))}
          disabled={step >= steps.length - 1}
        >
          Next
        </Button>
      </View>
    </ScreenContainer>
  );
}
