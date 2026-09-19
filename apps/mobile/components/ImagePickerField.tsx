import { useState } from "react";
import { ActivityIndicator, Image, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { pickAndUploadImage } from "@/lib/pick-and-upload-image";

export function ImagePickerField({
  label,
  imageUrl,
  onChange,
}: {
  label?: string;
  imageUrl: string | null;
  onChange: (url: string | null) => void;
}) {
  const [uploading, setUploading] = useState(false);

  async function handlePick() {
    setUploading(true);
    try {
      const url = await pickAndUploadImage();
      if (url) onChange(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to upload photo");
    } finally {
      setUploading(false);
    }
  }

  return (
    <View>
      {label ? <Text className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">{label}</Text> : null}
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} className="mb-2 h-40 w-full rounded-lg" resizeMode="cover" />
      ) : null}
      <View className="flex-row gap-2">
        <Button variant="outline" size="sm" fullWidth={false} onPress={handlePick} loading={uploading}>
          {imageUrl ? "Change Photo" : "Add Photo"}
        </Button>
        {imageUrl ? (
          <Button variant="ghost" size="sm" fullWidth={false} onPress={() => onChange(null)}>
            Remove
          </Button>
        ) : null}
      </View>
      {uploading ? <ActivityIndicator className="mt-2" color="#4C9A2A" /> : null}
    </View>
  );
}
