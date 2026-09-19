import { Text, TextInput, TextInputProps, View } from "react-native";

interface InputProps extends TextInputProps {
  label?: string;
}

export function Input({ label, multiline, className, ...props }: InputProps & { className?: string }) {
  return (
    <View>
      {label ? <Text className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">{label}</Text> : null}
      <TextInput
        placeholderTextColor="#9CA3AF"
        multiline={multiline}
        className={`rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2.5 text-neutral-900 dark:text-neutral-100 ${multiline ? "min-h-24" : ""} ${className ?? ""}`}
        style={multiline ? { textAlignVertical: "top" } : undefined}
        {...props}
      />
    </View>
  );
}
