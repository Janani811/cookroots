import { router } from "expo-router";
import { useState } from "react";
import { Image, Text, View } from "react-native";
import { ImagePickerField } from "@/components/ImagePickerField";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [dietaryPreferences, setDietaryPreferences] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);

  if (!user) {
    return (
      <ScreenContainer>
        <Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">Profile</Text>
        <Card className="mt-6">
          <Text className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">Sign In</Text>
          <Text className="mt-3 text-neutral-600 dark:text-neutral-400">
            Create an account or sign in to access your dashboard and create recipes.
          </Text>
          <Button className="mt-4" onPress={() => router.push("/(auth)/login")}>
            Sign In
          </Button>
          <Button className="mt-3" variant="outline" onPress={() => router.push("/(auth)/signup")}>
            Create Account
          </Button>
        </Card>
      </ScreenContainer>
    );
  }

  function startEdit() {
    setName(user.name || "");
    setBio(user.bio || "");
    setLocation(user.location || "");
    setWebsite(user.website || "");
    setInstagram(user.instagram || "");
    setDietaryPreferences((user.dietaryPreferences || []).join(", "));
    setProfileImage(user.profileImage || null);
    setEditMode(true);
  }

  async function handleSave() {
    if (!name.trim()) {
      alert("Name cannot be empty.");
      return;
    }
    setSaving(true);
    try {
      const updated = await api.updateProfile(user.id, {
        name,
        bio,
        location,
        website,
        instagram,
        profileImage,
        dietaryPreferences: dietaryPreferences
          ? dietaryPreferences.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
      });
      refreshUser(updated);
      setEditMode(false);
      alert("Profile updated successfully!");
    } catch {
      alert("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (editMode) {
    return (
      <ScreenContainer>
        <Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">Edit Profile</Text>
        <View className="mt-6 gap-4">
          <ImagePickerField label="Profile Photo" imageUrl={profileImage} onChange={setProfileImage} />
          <Input label="Full Name" placeholder="Your Name" value={name} onChangeText={setName} />
          <Input label="Email" value={user.email} editable={false} className="bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400" />
          <Input label="Bio" placeholder="Tell us about yourself" value={bio} onChangeText={setBio} multiline />
          <Input label="Location" placeholder="City, Country" value={location} onChangeText={setLocation} />
          <Input
            label="Website"
            placeholder="https://yoursite.com"
            value={website}
            onChangeText={setWebsite}
            keyboardType="url"
          />
          <Input label="Instagram Handle" placeholder="username" value={instagram} onChangeText={setInstagram} />
          <Input
            label="Dietary Preferences"
            placeholder="Vegan, Gluten-Free (comma separated)"
            value={dietaryPreferences}
            onChangeText={setDietaryPreferences}
          />

          <Button className="mt-2" onPress={handleSave} loading={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
          <Button variant="outline" onPress={() => setEditMode(false)} disabled={saving}>
            Cancel
          </Button>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">Profile</Text>
      <Card className="mt-6">
        {user.profileImage ? (
          <Image source={{ uri: user.profileImage }} className="mb-3 size-16 rounded-full" />
        ) : (
          <Text className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">👤 {user.name || "User"}</Text>
        )}
        {user.profileImage ? (
          <Text className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">{user.name || "User"}</Text>
        ) : null}
        <Text className="mt-2 text-neutral-600 dark:text-neutral-400">{user.email}</Text>

        {user.bio ? <Text className="mt-4 italic text-neutral-800 dark:text-neutral-100">"{user.bio}"</Text> : null}
        {user.location ? <Text className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">📍 {user.location}</Text> : null}
        {user.website ? <Text className="mt-1 text-sm text-primary">🌐 {user.website}</Text> : null}
        {user.instagram ? <Text className="mt-1 text-sm text-pink-600">📸 @{user.instagram}</Text> : null}

        {user.dietaryPreferences?.length > 0 ? (
          <View className="mt-4 flex-row flex-wrap gap-2">
            {user.dietaryPreferences.map((pref: string) => (
              <Badge key={pref} tone="success">
                {pref}
              </Badge>
            ))}
          </View>
        ) : null}

        <Button className="mt-6" variant="outline" onPress={startEdit}>
          Edit Profile
        </Button>
        <Button className="mt-3" variant="danger" onPress={logout}>
          Sign Out
        </Button>
      </Card>

      <Card className="mt-4">
        <Text className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Appearance</Text>
        <View className="mt-3 flex-row gap-2">
          <Chip label="☀️ Light" active={theme === "light"} onPress={() => setTheme("light")} className="flex-1" />
          <Chip label="🌙 Dark" active={theme === "dark"} onPress={() => setTheme("dark")} className="flex-1" />
        </View>
      </Card>

      <View className="mt-4 gap-3">
        <Button variant="outline" onPress={() => router.push("/grocery")}>
          🛒 Grocery Lists
        </Button>
        <Button variant="outline" onPress={() => router.push("/notifications")}>
          🔔 Notifications
        </Button>
      </View>
    </ScreenContainer>
  );
}
