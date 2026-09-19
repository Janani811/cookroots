"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/i18n-provider";

export default function ProfilePage() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    location: "",
    website: "",
    instagram: "",
    dietaryPreferences: "",
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    setFormData({
      name: user.name || "",
      bio: user.bio || "",
      location: user.location || "",
      website: user.website || "",
      instagram: user.instagram || "",
      dietaryPreferences: user.dietaryPreferences?.join(", ") || "",
    });
  }, [user, authLoading, router]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;

    setUploadingAvatar(true);
    try {
      const { url } = await api.uploadFile(file);
      await api.updateProfile(user.id, { profileImage: url });
      await refreshUser();
      toast.success(t("profile.photoUpdatedToast"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("recipeNew.uploadPhotoFailed"));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await api.updateProfile(user.id, {
        ...formData,
        dietaryPreferences: formData.dietaryPreferences
          ? formData.dietaryPreferences.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
      });
      await refreshUser();
      setIsEditing(false);
      toast.success(t("profile.updatedToast"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("profile.updateFailed"));
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center text-muted-foreground">
          {t("profile.loadingProfile")}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      <main className="mx-auto max-w-4xl w-full px-6 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t("profile.yourProfile")}</h1>
            <p className="text-muted-foreground">{t("profile.subtitle")}</p>
          </div>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)}>{t("profile.editProfile")}</Button>
          )}
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold overflow-hidden shrink-0">
            {user.profileImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.profileImage} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              user.name?.charAt(0)?.toUpperCase() || "U"
            )}
          </div>
          <label className="cursor-pointer">
            <span className="inline-flex items-center rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted">
              {uploadingAvatar ? t("recipeNew.uploadingPhoto") : t("profile.changePhoto")}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploadingAvatar}
              onChange={handleAvatarChange}
            />
          </label>
        </div>

        <div className="bg-card border rounded-xl shadow-sm p-6 text-card-foreground">
          {isEditing ? (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1">{t("profile.name")}</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("profile.email")}</label>
                <input type="text" value={user.email} disabled className="w-full rounded-md border bg-muted px-3 py-2 text-sm cursor-not-allowed opacity-50" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("profile.bio")}</label>
                <textarea value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium mb-1">{t("profile.location")}</label>
                  <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t("profile.website")}</label>
                  <input type="url" placeholder="https://" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium mb-1">{t("profile.instagramHandle")}</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">@</span>
                    <input type="text" value={formData.instagram} onChange={(e) => setFormData({ ...formData, instagram: e.target.value })} className="w-full rounded-md border bg-background px-3 py-2 pl-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t("profile.dietaryPreferences")}</label>
                  <input type="text" placeholder={t("profile.dietaryPreferencesPlaceholder")} value={formData.dietaryPreferences} onChange={(e) => setFormData({ ...formData, dietaryPreferences: e.target.value })} className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t mt-6">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? t("profile.saving") : t("profile.saveChanges")}
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  {t("common.cancel")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 text-sm">
                <div>
                  <p className="text-muted-foreground font-medium mb-1">{t("profile.name")}</p>
                  <p className="font-medium">{user.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground font-medium mb-1">{t("profile.email")}</p>
                  <p className="font-medium">{user.email}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-muted-foreground font-medium mb-1">{t("profile.bio")}</p>
                  <p>{user.bio || <span className="italic text-muted-foreground">{t("profile.notProvided")}</span>}</p>
                </div>
                <div>
                  <p className="text-muted-foreground font-medium mb-1">{t("profile.location")}</p>
                  <p>{user.location || <span className="italic text-muted-foreground">{t("profile.notProvided")}</span>}</p>
                </div>
                <div>
                  <p className="text-muted-foreground font-medium mb-1">{t("profile.website")}</p>
                  <p>{user.website ? <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{user.website}</a> : <span className="italic text-muted-foreground">{t("profile.notProvided")}</span>}</p>
                </div>
                <div>
                  <p className="text-muted-foreground font-medium mb-1">{t("profile.instagram")}</p>
                  <p>{user.instagram ? `@${user.instagram}` : <span className="italic text-muted-foreground">{t("profile.notProvided")}</span>}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-muted-foreground font-medium mb-1">{t("profile.dietaryPreferences")}</p>
                  <p>{user.dietaryPreferences?.length ? (
                    <span className="flex flex-wrap gap-2 mt-1">
                      {user.dietaryPreferences.map((pref: string) => (
                        <span key={pref} className="px-2.5 py-1 bg-secondary text-secondary-foreground rounded-full text-xs font-medium">{pref}</span>
                      ))}
                    </span>
                  ) : <span className="italic text-muted-foreground">{t("profile.none")}</span>}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}