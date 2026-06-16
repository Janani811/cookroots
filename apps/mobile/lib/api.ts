import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://10.171.80.127:4000/api";

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

  // Comments
  getComments(recipeId: string) {
    return request<any[]>(`/recipes/${recipeId}/comments`);
  },

  createComment(recipeId: string, data: { text: string; rating?: number }) {
    return request<any>(`/recipes/${recipeId}/comments`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Social Features
  likeRecipe(recipeId: string) {
    return request<any>(`/recipes/${recipeId}/like`, {
      method: "POST",
    });
  },

  unlikeRecipe(recipeId: string) {
    return request<any>(`/recipes/${recipeId}/unlike`, {
      method: "POST",
    });
  },

  rateRecipe(recipeId: string, rating: number) {
    return request<any>(`/recipes/${recipeId}/rate`, {
      method: "POST",
      body: JSON.stringify({ rating }),
    });
  },

  markRecipeTried(recipeId: string, data?: { notes?: string; imageUrl?: string }) {
    return request<any>(`/recipes/${recipeId}/tried`, {
      method: "POST",
      body: JSON.stringify(data || {}),
    });
  },
};

// Token management exports
export { getToken, setToken, clearToken };
