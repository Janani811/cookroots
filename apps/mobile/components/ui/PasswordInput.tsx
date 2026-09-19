import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, Text, TextInput, TextInputProps, View } from "react-native";

interface PasswordInputProps extends Omit<TextInputProps, "secureTextEntry"> {
  label?: string;
}

export function PasswordInput({ label, className, ...props }: PasswordInputProps & { className?: string }) {
  const [visible, setVisible] = useState(false);

  return (
    <View>
      {label ? <Text className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">{label}</Text> : null}
      <View className="relative justify-center">
        <TextInput
          placeholderTextColor="#9CA3AF"
          secureTextEntry={!visible}
          autoCapitalize="none"
          className={`rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2.5 pr-11 text-neutral-900 dark:text-neutral-100 ${className ?? ""}`}
          {...props}
        />
        <Pressable
          onPress={() => setVisible((v) => !v)}
          hitSlop={8}
          className="absolute right-3"
          accessibilityLabel={visible ? "Hide password" : "Show password"}
        >
          <MaterialCommunityIcons name={visible ? "eye-off-outline" : "eye-outline"} size={20} color="#9CA3AF" />
        </Pressable>
      </View>
    </View>
  );
}
