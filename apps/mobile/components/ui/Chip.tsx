import { Pressable, Text } from "react-native";

export function Chip({
  label,
  active,
  onPress,
  className,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  className?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-lg px-3 py-2 ${active ? "bg-primary" : "border border-neutral-300 dark:border-neutral-700"} ${className ?? ""}`}
    >
      <Text className={`text-center text-sm font-medium ${active ? "text-white" : "text-neutral-900 dark:text-neutral-100"}`}>
        {label}
      </Text>
    </Pressable>
  );
}
