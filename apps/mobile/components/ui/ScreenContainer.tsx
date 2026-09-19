import { ReactNode } from "react";
import { ScrollView, ScrollViewProps, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function ScreenContainer({
  children,
  scroll = true,
  className,
  contentContainerStyle,
  ...props
}: {
  children: ReactNode;
  scroll?: boolean;
  className?: string;
} & ScrollViewProps) {
  const insets = useSafeAreaInsets();

  if (!scroll) {
    return (
      <View
        style={{ paddingBottom: insets.bottom + 24 }}
        className={`flex-1 bg-white dark:bg-neutral-950 px-6 py-6 ${className ?? ""}`}
      >
        {children}
      </View>
    );
  }
  return (
    <ScrollView
      className={`flex-1 bg-white dark:bg-neutral-950 px-6 py-6 ${className ?? ""}`}
      contentContainerStyle={[{ paddingBottom: insets.bottom + 24 }, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      {...props}
    >
      {children}
    </ScrollView>
  );
}
