import { Text, View } from "react-native";

type Tone = "primary" | "neutral" | "success";

const toneClasses: Record<Tone, { bg: string; text: string }> = {
  primary: { bg: "bg-primary-100 dark:bg-primary-900", text: "text-primary-700 dark:text-primary-200" },
  neutral: { bg: "bg-neutral-200 dark:bg-neutral-800", text: "text-neutral-700 dark:text-neutral-300" },
  success: { bg: "bg-green-100 dark:bg-green-900", text: "text-green-800 dark:text-green-200" },
};

export function Badge({ children, tone = "neutral" }: { children: string; tone?: Tone }) {
  const { bg, text } = toneClasses[tone];
  return (
    <View className={`rounded-full px-3 py-1 ${bg}`}>
      <Text className={`text-xs font-medium ${text}`}>{children}</Text>
    </View>
  );
}
