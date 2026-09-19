import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";
import { useTheme } from "@/lib/theme-context";

export function StarRating({
  value,
  onChange,
  disabled,
  size = 24,
}: {
  value: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
  size?: number;
}) {
  const { theme } = useTheme();
  const filledColor = theme === "dark" ? "#FFB25C" : "#FF9F1C";
  const emptyColor = theme === "dark" ? "#3A4531" : "#d4d4d4";

  return (
    <View className="flex-row gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable key={star} onPress={() => !disabled && onChange(star)} hitSlop={4}>
          <MaterialCommunityIcons
            name={star <= value ? "star" : "star-outline"}
            size={size}
            color={star <= value ? filledColor : emptyColor}
          />
        </Pressable>
      ))}
    </View>
  );
}
