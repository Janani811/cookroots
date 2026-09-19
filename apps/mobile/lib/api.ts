import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://10.171.80.127:4000/api";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

let cachedToken: string | null = null;

async function getToken(): Promise<string | null> {
  if (cachedToken) return cachedToken;
  try {
    cachedToken = await AsyncStorage.getItem("cooksy_token");
    return cachedToken;
  } catch {
    return null;
  }
}

async function setToken(token: string): Promise<void> {
  cachedToken = token;
  try {
    await AsyncStorage.setItem("cooksy_token", token);
  } catch (err) {
    console.error("Failed to save token:", err);
  }
}

async function clearToken(): Promise<void> {
  cachedToken = null;
  try {
    await AsyncStorage.removeItem("cooksy_token");
  } catch (err) {
    console.error("Failed to clear token:", err);
  }
}

async function authHeaders(): Promise<HeadersInit> {
  const token = await getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = await authHeaders();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const message = await res.text().catch(() => "Request failed");
    throw new Error(message || `Request failed (${res.status})`);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : (undefined as T);
}

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
  items?: GroceryItem[];
};

export const api = {
  // Auth
  signup(name: string, email: string, password: string) {
    return request<{ user: any; token: string }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
  },

  login(email: string, password: string) {
    return request<{ user: any; token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  getMe() {
    return request<any>("/auth/me");
  },

  forgotPassword(email: string) {
    return request<{ message: string; devResetUrl?: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  resetPassword(token: string, password: string) {
    return request<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    });
  },

  updateProfile(userId: string, data: any) {
    return request<any>(`/auth/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  // Recipe CRUD
  getRecipes(params?: { search?: string; difficulty?: string; createdBy?: string }) {
    const query = new URLSearchParams();
    if (params?.search) query.append("search", params.search);
    if (params?.difficulty) query.append("difficulty", params.difficulty);
    if (params?.createdBy) query.append("createdBy", params.createdBy);
    return request<any[]>(`/recipes?${query}`);
  },

  getRecipe(id: string) {
    return request<any>(`/recipes/${id}`);
  },

  createRecipe(data: {
    title: string;
    description?: string;
    ingredients?: Array<{ name: string; quantity: string }>;
    steps?: Array<{ stepNumber: number; instructionText: string }>;
    cookingTimeMinutes?: number | null;
    difficulty?: string;
    tags?: string[];
  }) {
    return request<any>("/recipes", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateRecipe(id: string, data: Record<string, unknown>) {
    return request<any>(`/recipes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  deleteRecipe(id: string) {
    return request<{ deleted: boolean }>(`/recipes/${id}`, {
      method: "DELETE",
    });
  },

  matchIngredients(ingredients: string[]) {
    return request<any[]>("/recipes/match-ingredients", {
      method: "POST",
      body: JSON.stringify({ ingredients }),
    });
  },

  // AI Features
  structureRecipe(text: string, language: string = "auto") {
    return request<any>("/ai/structure", {
      method: "POST",
      body: JSON.stringify({ text, language }),
    });
  },

  improveRecipe(recipeJson: string, language?: string) {
    return request<{ improved: any }>("/ai/improve", {
      method: "POST",
      body: JSON.stringify({ recipeJson, language }),
    });
  },

  polishStep(text: string, language?: string) {
    return request<{ text: string }>("/ai/polish-step", {
      method: "POST",
      body: JSON.stringify({ text, language }),
    });
  },

  // Comments
  getComments(recipeId: string) {
    return request<any[]>(`/recipes/${recipeId}/comments`);
  },

  addComment(recipeId: string, text: string, parentCommentId?: string) {
    return request<any>(`/recipes/${recipeId}/comments`, {
      method: "POST",
      body: JSON.stringify({ content: text, parentCommentId }),
    });
  },

  likeComment(recipeId: string, commentId: string) {
    return request<any>(`/recipes/${recipeId}/comments/${commentId}/like`, {
      method: "POST",
    });
  },

  unlikeComment(recipeId: string, commentId: string) {
    return request<void>(`/recipes/${recipeId}/comments/${commentId}/like`, {
      method: "DELETE",
    });
  },

  // Reactions
  getReactions(recipeId: string) {
    return request<ReactionSummary[]>(`/recipes/${recipeId}/reactions`);
  },

  addReaction(
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

  removeReaction(
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

  // Social Features
  likeRecipe(recipeId: string) {
    return request<any>(`/recipes/${recipeId}/like`, {
      method: "POST",
    });
  },

  unlikeRecipe(recipeId: string) {
    return request<void>(`/recipes/${recipeId}/like`, {
      method: "DELETE",
    });
  },

  rateRecipe(recipeId: string, rating: number) {
    return request<any>(`/recipes/${recipeId}/ratings`, {
      method: "POST",
      body: JSON.stringify({ rating }),
    });
  },

  tryRecipe(recipeId: string, data: { comment?: string; rating?: number; imageUrl?: string }) {
    return request<any>(`/recipes/${recipeId}/tried`, {
      method: "POST",
      body: JSON.stringify(data),
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

  getGroceryListsForUser(userId: string) {
    return request<GroceryList[]>(`/grocery/users/${userId}`);
  },

  getGroceryList(listId: string) {
    return request<GroceryList>(`/grocery/${listId}`);
  },

  renameGroceryList(listId: string, name: string) {
    return request<GroceryList>(`/grocery/${listId}`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    });
  },

  deleteGroceryList(listId: string) {
    return request<{ deleted: boolean }>(`/grocery/${listId}`, {
      method: "DELETE",
    });
  },

  addGroceryItem(listId: string, name: string, quantity?: string) {
    return request<GroceryItem>(`/grocery/${listId}/items`, {
      method: "POST",
      body: JSON.stringify({ name, quantity }),
    });
  },

  removeGroceryItem(itemId: string) {
    return request<{ deleted: boolean }>(`/grocery/items/${itemId}`, {
      method: "DELETE",
    });
  },

  toggleGroceryItem(itemId: string, isChecked: boolean) {
    return request<GroceryItem>("/grocery/items/toggle", {
      method: "PATCH",
      body: JSON.stringify({ itemId, isChecked }),
    });
  },

  // Uploads (React Native FormData: pass a { uri, name, type } object from expo-image-picker)
  async uploadFile(file: { uri: string; name: string; type: string }): Promise<{ url: string }> {
    const token = await getToken();
    const formData = new FormData();
    formData.append("file", file as any);

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
  async transcribeAudio(file: { uri: string; name: string; type: string }, language?: string): Promise<{ text: string }> {
    const token = await getToken();
    const formData = new FormData();
    formData.append("audio", file as any);
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
  getNotifications() {
    return request<AppNotification[]>("/notifications");
  },

  getUnreadNotificationCount() {
    return request<{ count: number }>("/notifications/unread-count");
  },

  markNotificationRead(id: string) {
    return request<{ success: boolean }>(`/notifications/${id}/read`, {
      method: "PATCH",
    });
  },

  markAllNotificationsRead() {
    return request<{ success: boolean }>("/notifications/read-all", {
      method: "PATCH",
    });
  },

  // Translation
  translateRecipe(recipeId: string, language: string) {
    return request<TranslatedRecipeContent>(`/recipes/${recipeId}/translate`, {
      method: "POST",
      body: JSON.stringify({ language }),
    });
  },
};

// Token management exports
export { getToken, setToken, clearToken };
