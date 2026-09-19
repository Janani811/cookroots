const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export type GroceryItem = {
  id: string;
  listId: string;
  name: string;
  quantity: string | null;
  isChecked: boolean;
};

export type GroceryList = {
  id: string;
  userId: string;
  recipeId: string | null;
  name: string;
  createdAt: string;
  /** Only present on `getGroceryList` (single-list fetch); absent on list summaries. */
  items?: GroceryItem[];
};

export type User = {
  id: string;
  name: string;
  email: string;
  profileImage: string | null;
  role: string;
  bio?: string | null;
  location?: string | null;
  website?: string | null;
  instagram?: string | null;
  dietaryPreferences?: string[] | null;
};

export type NotificationType = "like" | "comment" | "reply" | "rating" | "tried";

export type ReactionSummary = {
  emoji: string;
  count: number;
  reactedByViewer: boolean;
};

export type AppNotification = {
  id: string;
  type: NotificationType;
  recipeId: string | null;
  recipeTitle: string | null;
  data: string | null;
  isRead: boolean;
  createdAt: string;
  actor: {
    id: string;
    name: string;
    profileImage: string | null;
  };
};

export type TranslatedRecipeContent = {
  title: string;
  description: string | null;
  ingredients: { name: string; quantity: string }[];
  steps: { stepNumber: number; instructionText: string }[];
};

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("cooksy_token");
}

function authHeaders(): HeadersInit {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const message = await res.text().catch(() => "Request failed");
    throw new Error(message || `Request failed (${res.status})`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  // Auth
  async signup(name: string, email: string, password: string) {
    return request<{ user: User; token: string }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
  },

  async login(email: string, password: string) {
    return request<{ user: User; token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  async getMe() {
    return request<User>("/auth/me");
  },

  async forgotPassword(email: string) {
    return request<{ message: string; devResetUrl?: string }>(
      "/auth/forgot-password",
      {
        method: "POST",
        body: JSON.stringify({ email }),
      }
    );
  },

  async resetPassword(token: string, password: string) {
    return request<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    });
  },

  // Recipes
  async getRecipes(params?: {
    search?: string;
    difficulty?: string;
    createdBy?: string;
  }) {
    const query = new URLSearchParams();
    if (params?.search) query.append("search", params.search);
    if (params?.difficulty) query.append("difficulty", params.difficulty);
    if (params?.createdBy) query.append("createdBy", params.createdBy);
    return request<any[]>(`/recipes?${query}`, { cache: "no-store" });
  },

  async getRecipe(id: string) {
    return request<any>(`/recipes/${id}`, { cache: "no-store" });
  },

  async createRecipe(data: Record<string, unknown>) {
    return request<any>("/recipes", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateRecipe(id: string, data: Record<string, unknown>) {
    return request<any>(`/recipes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async deleteRecipe(id: string) {
    return request<{ deleted: boolean }>(`/recipes/${id}`, {
      method: "DELETE",
    });
  },

  async matchIngredients(ingredients: string[]) {
    return request<any[]>("/recipes/match-ingredients", {
      method: "POST",
      body: JSON.stringify({ ingredients }),
    });
  },

  // AI
  async structureRecipe(text: string, language?: string) {
    return request<any>("/ai/structure", {
      method: "POST",
      body: JSON.stringify({ text, language }),
    });
  },

  async improveRecipe(recipeJson: string, language?: string) {
    return request<any>("/ai/improve", {
      method: "POST",
      body: JSON.stringify({ recipeJson, language }),
    });
  },

  async normalizeIngredients(ingredients: string[]) {
    return request<any>("/ai/normalize-ingredients", {
      method: "POST",
      body: JSON.stringify({ ingredients }),
    });
  },

  async polishStep(text: string, language?: string) {
    return request<{ text: string }>("/ai/polish-step", {
      method: "POST",
      body: JSON.stringify({ text, language }),
    });
  },

  // Social
  async likeRecipe(recipeId: string) {
    return request<any>(`/recipes/${recipeId}/like`, { method: "POST" });
  },

  async unlikeRecipe(recipeId: string) {
    return request<void>(`/recipes/${recipeId}/like`, { method: "DELETE" });
  },

  async getComments(recipeId: string) {
    return request<any[]>(`/recipes/${recipeId}/comments`, {
      cache: "no-store",
    });
  },

  async addComment(recipeId: string, text: string, parentCommentId?: string) {
    return request<any>(`/recipes/${recipeId}/comments`, {
      method: "POST",
      body: JSON.stringify({ content: text, parentCommentId }),
    });
  },

  async likeComment(recipeId: string, commentId: string) {
    return request<any>(`/recipes/${recipeId}/comments/${commentId}/like`, {
      method: "POST",
    });
  },

  async unlikeComment(recipeId: string, commentId: string) {
    return request<void>(`/recipes/${recipeId}/comments/${commentId}/like`, {
      method: "DELETE",
    });
  },

  async getReactions(recipeId: string) {
    return request<ReactionSummary[]>(`/recipes/${recipeId}/reactions`, {
      cache: "no-store",
    });
  },

  async addReaction(
    recipeId: string,
    targetType: "comment" | "recipe_description",
    targetId: string,
    emoji: string
  ) {
    return request<any>(`/recipes/${recipeId}/reactions`, {
      method: "POST",
      body: JSON.stringify({ targetType, targetId, emoji }),
    });
  },

  async removeReaction(
    recipeId: string,
    targetType: "comment" | "recipe_description",
    targetId: string,
    emoji: string
  ) {
    return request<void>(`/recipes/${recipeId}/reactions`, {
      method: "DELETE",
      body: JSON.stringify({ targetType, targetId, emoji }),
    });
  },

  // Grocery
  async createGroceryList(recipeIds: string[], name?: string) {
    const lists = await Promise.all(
      recipeIds.map((id) =>
        request<GroceryList>(`/grocery/from-recipe/${id}`, {
          method: "POST",
          body: JSON.stringify({ name }),
        })
      )
    );
    return lists;
  },

  async getGroceryListsForUser(userId: string) {
    return request<GroceryList[]>(`/grocery/users/${userId}`, {
      cache: "no-store",
    });
  },

  async getGroceryList(listId: string) {
    return request<GroceryList>(`/grocery/${listId}`, { cache: "no-store" });
  },

  async renameGroceryList(listId: string, name: string) {
    return request<GroceryList>(`/grocery/${listId}`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    });
  },

  async deleteGroceryList(listId: string) {
    return request<{ deleted: boolean }>(`/grocery/${listId}`, {
      method: "DELETE",
    });
  },

  async addGroceryItem(listId: string, name: string, quantity?: string) {
    return request<GroceryItem>(`/grocery/${listId}/items`, {
      method: "POST",
      body: JSON.stringify({ name, quantity }),
    });
  },

  async removeGroceryItem(itemId: string) {
    return request<{ deleted: boolean }>(`/grocery/items/${itemId}`, {
      method: "DELETE",
    });
  },

  async toggleGroceryItem(itemId: string, isChecked: boolean) {
    return request<GroceryItem>("/grocery/items/toggle", {
      method: "PATCH",
      body: JSON.stringify({ itemId, isChecked }),
    });
  },

  // Uploads
  async uploadFile(file: File | Blob): Promise<{ url: string }> {
    if (file.size > MAX_IMAGE_BYTES) {
      throw new Error(
        `Image is too large (max ${MAX_IMAGE_BYTES / (1024 * 1024)}MB). Please choose a smaller photo.`
      );
    }

    const token = getToken();
    const formData = new FormData();
    formData.append("file", file, file instanceof File ? file.name : "upload");

    const res = await fetch(`${API_URL}/upload`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData,
    });

    if (!res.ok) {
      const message = await res.text().catch(() => "Request failed");
      throw new Error(message || `Request failed (${res.status})`);
    }

    return res.json();
  },

  // Voice
  async transcribeAudio(blob: Blob, language?: string): Promise<{ text: string }> {
    const token = getToken();
    const formData = new FormData();
    formData.append("audio", blob, "recording.webm");
    if (language) formData.append("language", language);

    const res = await fetch(`${API_URL}/ai/transcribe`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData,
    });

    if (!res.ok) {
      const message = await res.text().catch(() => "Request failed");
      throw new Error(message || `Request failed (${res.status})`);
    }

    return res.json();
  },

  // Notifications
  async getNotifications() {
    return request<AppNotification[]>("/notifications", { cache: "no-store" });
  },

  async getUnreadNotificationCount() {
    return request<{ count: number }>("/notifications/unread-count", {
      cache: "no-store",
    });
  },

  async markNotificationRead(id: string) {
    return request<{ success: boolean }>(`/notifications/${id}/read`, {
      method: "PATCH",
    });
  },

  async markAllNotificationsRead() {
    return request<{ success: boolean }>("/notifications/read-all", {
      method: "PATCH",
    });
  },

  // Translation
  async translateRecipe(recipeId: string, language: string) {
    return request<TranslatedRecipeContent>(`/recipes/${recipeId}/translate`, {
      method: "POST",
      body: JSON.stringify({ language }),
    });
  },

  // Ratings & tried-it
  async rateRecipe(recipeId: string, rating: number) {
    return request<any>(`/recipes/${recipeId}/ratings`, {
      method: "POST",
      body: JSON.stringify({ rating }),
    });
  },

  async tryRecipe(
    recipeId: string,
    data: { comment?: string; rating?: number; imageUrl?: string }
  ) {
    return request<any>(`/recipes/${recipeId}/tried`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateProfile(
    userId: string,
    data: Partial<Pick<User, "name" | "profileImage" | "bio" | "location" | "website" | "instagram" | "dietaryPreferences">>
  ) {
    return request<User>(`/auth/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

};

import type { RecipeLanguageCode } from "@/lib/languages";
import { TTS_LOCALES } from "@/lib/languages";

export function speakText(
  text: string,
  language?: string | null
): SpeechSynthesisUtterance | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;

  const code = language as RecipeLanguageCode | undefined;
  if (code && TTS_LOCALES[code]) {
    utterance.lang = TTS_LOCALES[code];
  }

  const voices = window.speechSynthesis.getVoices();
  if (utterance.lang) {
    const langPrefix = utterance.lang.split("-")[0] ?? utterance.lang;
    const preferred = voices.find((v) => v.lang.startsWith(langPrefix));
    if (preferred) utterance.voice = preferred;
  }

  window.speechSynthesis.speak(utterance);
  return utterance;
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
