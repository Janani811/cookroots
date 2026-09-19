import { Image, Pressable, Text, View } from "react-native";
import { Badge } from "@/components/ui/Badge";

export function RecipeListItem({ recipe, onPress }: { recipe: any; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="mb-3 overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm active:opacity-70"
    >
      {recipe.imageUrl ? (
        <Image source={{ uri: recipe.imageUrl }} className="h-36 w-full" resizeMode="cover" />
      ) : null}
      <View className="p-4">
      <View className="flex-row items-center justify-between gap-2">
        <Text className="flex-1 text-lg font-semibold text-neutral-900 dark:text-neutral-50">{recipe.title}</Text>
        {recipe.visibility === "private" ? <Badge>🔒 Private</Badge> : null}
      </View>
      {recipe.description ? (
        <Text className="mt-1 text-sm text-neutral-600 dark:text-neutral-400" numberOfLines={2}>
          {recipe.description}
        </Text>
      ) : null}
      <Text className="mt-2 text-xs text-neutral-500 dark:text-neutral-500">
        {recipe.difficulty || "medium"} • {recipe.ingredients?.length || 0} ingredients
      </Text>
      <View className="mt-3 flex-row gap-4">
        <Text className="text-xs text-neutral-500 dark:text-neutral-500">❤️ {recipe.likesCount || 0}</Text>
        <Text className="text-xs text-neutral-500 dark:text-neutral-500">💬 {recipe.commentsCount || 0}</Text>
        <Text className="text-xs text-neutral-500 dark:text-neutral-500">
          ⭐ {recipe.averageRating?.toFixed(1) || "N/A"}
        </Text>
      </View>
      </View>
    </Pressable>
  );
}
