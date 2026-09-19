import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import type { ReactionSummary } from "@/lib/api";

export const REACTION_EMOJIS = ["❤️", "😋", "🔥", "👏", "😍", "🤤"] as const;

export function EmojiReactions({
  reactions,
  onToggle,
}: {
  reactions: ReactionSummary[];
  onToggle: (emoji: string, reactedByViewer: boolean) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <View className="mt-2">
      <View className="flex-row flex-wrap items-center gap-2">
        {reactions
          .filter((r) => r.count > 0)
          .map((r) => (
            <Pressable
              key={r.emoji}
              onPress={() => onToggle(r.emoji, r.reactedByViewer)}
              className={`flex-row items-center gap-1 rounded-full border px-2.5 py-1 ${
                r.reactedByViewer ? "border-primary bg-primary-100 dark:bg-primary-900" : "border-neutral-300 dark:border-neutral-700"
              }`}
            >
              <Text className="text-xs">{r.emoji}</Text>
              <Text className="text-xs text-neutral-700 dark:text-neutral-300">{r.count}</Text>
            </Pressable>
          ))}

        <Pressable
          onPress={() => setPickerOpen((v) => !v)}
          className="h-7 w-7 items-center justify-center rounded-full border border-dashed border-neutral-300 dark:border-neutral-700"
        >
          <Text className="text-xs text-neutral-500 dark:text-neutral-400">+</Text>
        </Pressable>
      </View>

      {pickerOpen && (
        <View className="mt-2 flex-row flex-wrap gap-1 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-2">
          {REACTION_EMOJIS.map((emoji) => {
            const existing = reactions.find((r) => r.emoji === emoji);
            return (
              <Pressable
                key={emoji}
                onPress={() => {
                  onToggle(emoji, existing?.reactedByViewer ?? false);
                  setPickerOpen(false);
                }}
                className={`h-9 w-9 items-center justify-center rounded-md ${
                  existing?.reactedByViewer ? "bg-primary-100 dark:bg-primary-900" : ""
                }`}
              >
                <Text className="text-lg">{emoji}</Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
