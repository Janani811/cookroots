import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { REACTION_EMOJIS } from "@/components/EmojiReactions";

export function EmojiPickerButton({ onSelect }: { onSelect: (emoji: string) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <View>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        accessibilityLabel="Add emoji"
        className="size-9 items-center justify-center rounded-md"
      >
        <Text className="text-lg">🙂</Text>
      </Pressable>

      {open && (
        <View className="mt-1 flex-row flex-wrap gap-1 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-2">
          {REACTION_EMOJIS.map((emoji) => (
            <Pressable
              key={emoji}
              onPress={() => {
                onSelect(emoji);
                setOpen(false);
              }}
              className="size-9 items-center justify-center rounded-md"
            >
              <Text className="text-lg">{emoji}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
