import { ReactNode } from "react";
import { Modal as RNModal, Pressable, Text, View } from "react-native";

export function Modal({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <RNModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/40" onPress={onClose}>
        <Pressable onPress={(e) => e.stopPropagation()}>
          <View className="max-h-[85%] rounded-t-2xl bg-white dark:bg-neutral-900 px-6 pb-8 pt-5">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">{title}</Text>
              <Pressable onPress={onClose} hitSlop={8}>
                <Text className="text-2xl leading-none text-neutral-400 dark:text-neutral-500">×</Text>
              </Pressable>
            </View>
            {children}
          </View>
        </Pressable>
      </Pressable>
    </RNModal>
  );
}
