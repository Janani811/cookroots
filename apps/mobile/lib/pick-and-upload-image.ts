import * as ImagePicker from "expo-image-picker";
import { api, MAX_IMAGE_BYTES } from "./api";

export async function pickAndUploadImage(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    alert("Photo library permission is required to attach a photo.");
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    quality: 0.8,
  });

  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  if (asset.fileSize && asset.fileSize > MAX_IMAGE_BYTES) {
    alert(`Image is too large (max ${MAX_IMAGE_BYTES / (1024 * 1024)}MB). Please choose a smaller photo.`);
    return null;
  }

  const filename = asset.fileName || asset.uri.split("/").pop() || "upload.jpg";
  const match = /\.(\w+)$/.exec(filename);
  const type = asset.mimeType || (match ? `image/${match[1]}` : "image/jpeg");

  const { url } = await api.uploadFile({ uri: asset.uri, name: filename, type });
  return url;
}
