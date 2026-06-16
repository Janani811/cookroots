const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export type User = {
  id: string;
  name: string;
  email: string;
  profileImage: string | null;
  role: string;
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

  async addComment(recipeId: string, text: string) {
    return request<any>(`/recipes/${recipeId}/comments`, {
      method: "POST",
      body: JSON.stringify({ content: text }),
    });
  },

  // Grocery
  async createGroceryList(recipeIds: string[]) {
    const lists = await Promise.all(
      recipeIds.map((id) =>
        request<any>(`/grocery/from-recipe/${id}`, { method: "POST" })
      )
    );
    return lists;
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
