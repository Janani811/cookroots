import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
  TextInput,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { api, getToken, setToken, clearToken } from "./lib/api";
import "./global.css";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type MainTab = "home" | "browse" | "create" | "dashboard" | "profile" | "login" | "signup";
type BrowseMode = "list" | "detail" | "cook";

interface AppState {
  currentTab: MainTab;
  browseMode: BrowseMode;
  selectedRecipeId: string | null;
  cookStep: number;
  recipes: any[];
  currentRecipe: any | null;
  loading: boolean;
  userRecipes: any[];
  stats: { totalRecipes: number; totalLikes: number; totalComments: number };
  searchQuery: string;
  difficultyFilter: string;
  // Create Recipe state
  createMode: "input" | "preview" | "details";
  createInputMethod: "text" | "voice";
  createRecipeText: string;
  createLanguage: string;
  createStructured: any | null;
  createTitle: string;
  createDescription: string;
  createDifficulty: "easy" | "medium" | "hard";
  createTags: string[];
  createIngredients: Array<{ name: string; quantity: string }>;
  createSteps: Array<{ stepNumber: number; instructionText: string }>;
  createCookingTime: number | null;
  // Auth state
  isLoggedIn: boolean;
  user: any | null;
  loginEmail: string;
  loginPassword: string;
  signupEmail: string;
  signupPassword: string;
  signupName: string;
  // Profile Update
  profileEditMode: boolean;
  profileName: string;
  profileBio: string;
  profileLocation: string;
  profileWebsite: string;
  profileInstagram: string;
  profileDietaryPreferences: string;
}

const initialState: AppState = {
  currentTab: "home",
  browseMode: "list",
  selectedRecipeId: null,
  cookStep: 0,
  recipes: [],
  currentRecipe: null,
  loading: false,
  userRecipes: [],
  stats: { totalRecipes: 0, totalLikes: 0, totalComments: 0 },
  searchQuery: "",
  difficultyFilter: "",
  // Create Recipe state
  createMode: "input",
  createInputMethod: "text",
  createRecipeText: "",
  createLanguage: "auto",
  createStructured: null,
  createTitle: "",
  createDescription: "",
  createDifficulty: "medium",
  createTags: [],
  createIngredients: [],
  createSteps: [],
  createCookingTime: null,
  // Auth state
  isLoggedIn: false,
  user: null,
  loginEmail: "",
  loginPassword: "",
  signupEmail: "",
  signupPassword: "",
  signupName: "",
  // Profile Update
  profileEditMode: false,
  profileName: "",
  profileBio: "",
  profileLocation: "",
  profileWebsite: "",
  profileInstagram: "",
  profileDietaryPreferences: "",
};


export default function App() {
  const [state, setState] = useState<AppState>(initialState);

  // Initialize auth session on app load
  useEffect(() => {
    async function initializeAuth() {
      try {
        const token = await getToken();
        if (token) {
          // Verify token is still valid
          const user = await api.getMe();
          setState((s) => ({
            ...s,
            isLoggedIn: true,
            user,
          }));
        }
      } catch (err) {
        console.error("Auth initialization failed:", err);
        await clearToken();
        setState((s) => ({
          ...s,
          isLoggedIn: false,
          user: null,
        }));
      }
    }
    initializeAuth();
  }, []);

  // Load recipes when browse tab is opened
  useEffect(() => {
    if (state.currentTab === "browse" && state.browseMode === "list") {
      loadRecipes();
    }
  }, [state.currentTab, state.browseMode, state.searchQuery, state.difficultyFilter]);

  // Load recipe details
  useEffect(() => {
    if (state.selectedRecipeId && (state.browseMode === "detail" || state.browseMode === "cook")) {
      loadRecipeDetail();
    }
  }, [state.selectedRecipeId, state.browseMode]);

  // Load dashboard data
  useEffect(() => {
    if (state.currentTab === "dashboard") {
      loadDashboard();
    }
  }, [state.currentTab]);

  async function loadRecipes() {
    setState((s) => ({ ...s, loading: true }));
    try {
      const data = await api.getRecipes({
        search: state.searchQuery || undefined,
        difficulty: state.difficultyFilter || undefined,
      });
      setState((s) => ({ ...s, recipes: Array.isArray(data) ? data : [], loading: false }));
    } catch {
      setState((s) => ({ ...s, recipes: [], loading: false }));
    }
  }

  async function loadRecipeDetail() {
    if (!state.selectedRecipeId) return;
    setState((s) => ({ ...s, loading: true }));
    try {
      const data = await api.getRecipe(state.selectedRecipeId);
      setState((s) => ({ ...s, currentRecipe: data, loading: false, cookStep: 0 }));
    } catch {
      setState((s) => ({ ...s, currentRecipe: null, loading: false }));
    }
  }

  async function loadDashboard() {
    setState((s) => ({ ...s, loading: true }));
    try {
      // Use actual user ID from logged-in user
      const userId = state.user?.id;
      if (!userId) {
        setState((s) => ({ ...s, loading: false }));
        return;
      }
      const data = await api.getRecipes({ createdBy: userId });
      const list = Array.isArray(data) ? data : [];
      setState((s) => ({
        ...s,
        userRecipes: list,
        stats: {
          totalRecipes: list.length,
          totalLikes: list.reduce((sum, r) => sum + (r.likesCount || 0), 0),
          totalComments: list.reduce((sum, r) => sum + (r.commentsCount || 0), 0),
        },
        loading: false,
      }));
    } catch (err) {
      console.error("Failed to load dashboard:", err);
      setState((s) => ({ ...s, loading: false }));
    }
  }

  function updateState(updates: Partial<AppState>) {
    setState((s) => ({ ...s, ...updates }));
  }

  function selectRecipe(id: string, mode: BrowseMode = "detail") {
    updateState({ selectedRecipeId: id, browseMode: mode, cookStep: 0 });
  }

  async function handleStructureRecipe() {
    if (!state.createRecipeText.trim()) {
      alert("Please enter recipe text");
      return;
    }
    
    setState((s) => ({ ...s, loading: true }));
    try {
      const result = await api.structureRecipe(state.createRecipeText, state.createLanguage);
      setState((s) => ({
        ...s,
        loading: false,
        createMode: "preview",
        createStructured: result,
        createTitle: result.title || "",
        createDescription: result.description || "",
        createDifficulty: result.difficulty || "medium",
        createTags: result.tags || [],
        createIngredients: result.ingredients || [],
        createSteps: result.steps || [],
        createCookingTime: result.cookingTimeMinutes || null,
      }));
    } catch (err) {
      alert("Failed to structure recipe. Please try again.");
      setState((s) => ({ ...s, loading: false }));
    }
  }

  async function handleImproveRecipe() {
    if (!state.createStructured) return;
    
    setState((s) => ({ ...s, loading: true }));
    try {
      const result = await api.improveRecipe(
        JSON.stringify(state.createStructured),
        state.createLanguage === "auto" ? undefined : state.createLanguage
      );
      setState((s) => ({
        ...s,
        loading: false,
        createStructured: result.improved,
        createTitle: result.improved.title,
        createDescription: result.improved.description || "",
        createIngredients: result.improved.ingredients,
        createSteps: result.improved.steps,
        createDifficulty: result.improved.difficulty || "medium",
        createTags: result.improved.tags,
        createCookingTime: result.improved.cookingTimeMinutes,
      }));
      alert("Recipe improved successfully!");
    } catch (err) {
      alert("Failed to improve recipe. Please try again.");
      setState((s) => ({ ...s, loading: false }));
    }
  }

  async function handleSubmitRecipe() {
    if (!state.createTitle.trim()) {
      alert("Recipe title is required");
      return;
    }

    if (state.createIngredients.length === 0) {
      alert("At least one ingredient is required");
      return;
    }

    if (state.createSteps.length === 0) {
      alert("At least one step is required");
      return;
    }
    
    setState((s) => ({ ...s, loading: true }));
    try {
      const recipeData = {
        title: state.createTitle,
        description: state.createDescription,
        difficulty: state.createDifficulty,
        tags: state.createTags,
        ingredients: state.createIngredients,
        steps: state.createSteps,
        cookingTimeMinutes: state.createCookingTime,
        status: "published",
        language: state.createLanguage === "auto" ? undefined : state.createLanguage,
        rawInput: state.createRecipeText,
      };

      await api.createRecipe(recipeData);
      
      // Reset create state and go to dashboard
      setState((s) => ({
        ...s,
        loading: false,
        currentTab: "dashboard",
        createMode: "input",
        createRecipeText: "",
        createTitle: "",
        createDescription: "",
        createDifficulty: "medium",
        createTags: [],
        createIngredients: [],
        createSteps: [],
        createCookingTime: null,
      }));
      alert("Recipe published successfully!");
      // Reload dashboard
      loadDashboard();
    } catch (err) {
      alert("Failed to create recipe. Please try again.");
      setState((s) => ({ ...s, loading: false }));
    }
  }

  async function handleLogin() {
    if (!state.loginEmail || !state.loginPassword) {
      alert("Please enter email and password");
      return;
    }

    setState((s) => ({ ...s, loading: true }));
    try {
      const result = await api.login(state.loginEmail, state.loginPassword);
      await setToken(result.token);
      setState((s) => ({
        ...s,
        loading: false,
        isLoggedIn: true,
        user: result.user,
        currentTab: "home",
        loginEmail: "",
        loginPassword: "",
      }));
      alert("Logged in successfully!");
    } catch (err) {
      console.log(err);
      alert("Login failed. Please check your email and password.");
      setState((s) => ({ ...s, loading: false }));
    }
  }

  async function handleSignup() {
    if (!state.signupEmail || !state.signupPassword || !state.signupName) {
      alert("Please fill in all fields");
      return;
    }

    setState((s) => ({ ...s, loading: true }));
    try {
      const result = await api.signup(state.signupName, state.signupEmail, state.signupPassword);
      await setToken(result.token);
      setState((s) => ({
        ...s,
        loading: false,
        isLoggedIn: true,
        user: result.user,
        currentTab: "home",
        signupEmail: "",
        signupPassword: "",
        signupName: "",
      }));
      alert("Account created successfully!");
    } catch (err) {
      alert("Signup failed. Please try again.");
      setState((s) => ({ ...s, loading: false }));
    }
  }

  async function handleLogout() {
    await clearToken();
    setState((s) => ({
      ...s,
      isLoggedIn: false,
      user: null,
      currentTab: "home",
    }));
  }

  async function handleUpdateProfile() {
    if (!state.user?.id || !state.profileName.trim()) {
      alert("Name cannot be empty.");
      return;
    }

    setState((s) => ({ ...s, loading: true }));
    try {
      const updatedUser = await api.updateProfile(state.user.id, {
        name: state.profileName,
        bio: state.profileBio,
        location: state.profileLocation,
        website: state.profileWebsite,
        instagram: state.profileInstagram,
        dietaryPreferences: state.profileDietaryPreferences ? state.profileDietaryPreferences.split(',').map(s => s.trim()).filter(Boolean) : [],
      });
      setState((s) => ({
        ...s,
        loading: false,
        user: updatedUser,
        profileEditMode: false,
      }));
      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Profile update failed:", err);
      alert("Failed to update profile. Please try again.");
      setState((s) => ({ ...s, loading: false }));
    }
  }

  // Screen Components
  const HomeScreen = () => (
    <ScrollView className="flex-1 px-6 py-8 bg-white" contentContainerStyle={{ paddingBottom: 100 }}>
      <Text className="text-sm font-medium text-blue-600">Cooksy</Text>
      <Text className="mt-2 text-3xl font-bold text-gray-900">
        Cook hands-free with AI-structured recipes
      </Text>
      <Text className="mt-3 text-base leading-6 text-gray-600">
        Browse community recipes and follow step-by-step cooking mode on your phone.
      </Text>
      <View className="mt-8 gap-3">
        <Pressable
          className="rounded-xl bg-blue-600 px-4 py-3"
          onPress={() => updateState({ currentTab: "browse", browseMode: "list" })}
        >
          <Text className="text-center font-semibold text-white">Browse recipes</Text>
        </Pressable>
        <Pressable
          className="rounded-xl border border-blue-600 px-4 py-3"
          onPress={() => updateState({ currentTab: "create" })}
        >
          <Text className="text-center font-semibold text-blue-600">Create recipe</Text>
        </Pressable>
      </View>
    </ScrollView>
  );

  const BrowseScreen = () => {
    if (state.browseMode === "list") {
      return (
        <View className="flex-1 bg-white">
          <ScrollView className="flex-1 px-6 py-4" contentContainerStyle={{ paddingBottom: 100 }}>
            <Text className="mb-2 text-2xl font-bold text-gray-900">Recipes</Text>
            <TextInput
              placeholder="Search recipes..."
              value={state.searchQuery}
              onChangeText={(text) => updateState({ searchQuery: text })}
              className="mb-3 rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
            />
            <View className="mb-4">
              <Text className="mb-2 text-sm font-medium text-gray-700">Difficulty</Text>
              <View className="flex-row gap-2">
                {["All", "easy", "medium", "hard"].map((d) => (
                  <Pressable
                    key={d}
                    className={`rounded-lg px-3 py-2 ${
                      state.difficultyFilter === (d === "All" ? "" : d)
                        ? "bg-blue-600"
                        : "bg-gray-200"
                    }`}
                    onPress={() =>
                      updateState({ difficultyFilter: d === "All" ? "" : d })
                    }
                  >
                    <Text
                      className={d === "All" || state.difficultyFilter === (d === "All" ? "" : d) ? "text-white" : "text-gray-700"}
                    >
                      {d}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            {state.loading ? (
              <ActivityIndicator size="large" color="#2563eb" />
            ) : state.recipes.length === 0 ? (
              <Text className="text-gray-500">No recipes found.</Text>
            ) : (
              state.recipes.map((item) => (
                <Pressable
                  key={item.id}
                  className="mb-3 rounded-xl border border-gray-200 p-4"
                  onPress={() => selectRecipe(item.id, "detail")}
                >
                  <Text className="text-lg font-semibold text-gray-900">
                    {item.title}
                  </Text>
                  <Text className="mt-1 text-sm text-gray-600" numberOfLines={2}>
                    {item.description || "No description"}
                  </Text>
                  <Text className="mt-2 text-xs text-gray-500">
                    {item.difficulty || "medium"} • {item.ingredients?.length || 0} ingredients
                  </Text>
                  <View className="mt-3 flex-row gap-4">
                    <Text className="text-xs text-gray-500">❤️ {item.likesCount || 0}</Text>
                    <Text className="text-xs text-gray-500">💬 {item.commentsCount || 0}</Text>
                    <Text className="text-xs text-gray-500">⭐ {item.averageRating?.toFixed(1) || "N/A"}</Text>
                  </View>
                </Pressable>
              ))
            )}
          </ScrollView>
        </View>
      );
    }

    if (state.browseMode === "detail") {
      if (state.loading || !state.currentRecipe) {
        return (
          <View className="flex-1 items-center justify-center bg-white">
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        );
      }
      return (
        <ScrollView className="flex-1 px-6 py-4 bg-white" contentContainerStyle={{ paddingBottom: 100 }}>
          <Pressable onPress={() => updateState({ browseMode: "list" })}>
            <Text className="text-blue-600 font-medium">← Back</Text>
          </Pressable>
          <Text className="mt-4 text-2xl font-bold text-gray-900">
            {state.currentRecipe.title}
          </Text>
          {state.currentRecipe.description ? (
            <Text className="mt-2 text-gray-600">{state.currentRecipe.description}</Text>
          ) : null}

          {/* Social Stats */}
          <View className="mt-4 flex-row gap-4 rounded-lg bg-gray-50 p-3">
            <View className="flex-1 items-center">
              <Text className="text-xl">❤️</Text>
              <Text className="mt-1 text-sm font-semibold text-gray-900">
                {state.currentRecipe.likesCount || 0}
              </Text>
              <Text className="text-xs text-gray-600">Likes</Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-xl">⭐</Text>
              <Text className="mt-1 text-sm font-semibold text-gray-900">
                {state.currentRecipe.averageRating?.toFixed(1) || "N/A"}
              </Text>
              <Text className="text-xs text-gray-600">Rating</Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-xl">💬</Text>
              <Text className="mt-1 text-sm font-semibold text-gray-900">
                {state.currentRecipe.commentsCount || 0}
              </Text>
              <Text className="text-xs text-gray-600">Comments</Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-xl">✅</Text>
              <Text className="mt-1 text-sm font-semibold text-gray-900">
                {state.currentRecipe.triedCount || 0}
              </Text>
              <Text className="text-xs text-gray-600">Tried</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="mt-4 flex-row gap-2">
            <Pressable className="flex-1 rounded-lg border border-gray-300 py-2">
              <Text className="text-center text-sm font-medium text-gray-900">❤️ Like</Text>
            </Pressable>
            <Pressable className="flex-1 rounded-lg border border-gray-300 py-2">
              <Text className="text-center text-sm font-medium text-gray-900">⭐ Rate</Text>
            </Pressable>
            <Pressable className="flex-1 rounded-lg border border-gray-300 py-2">
              <Text className="text-center text-sm font-medium text-gray-900">✅ Tried</Text>
            </Pressable>
          </View>

          <Text className="mt-6 text-lg font-semibold text-gray-900">Ingredients</Text>
          {(state.currentRecipe.ingredients || []).map((ing: any, idx: number) => (
            <Text key={idx} className="mt-1 text-gray-700">
              • {ing.quantity} {ing.name}
            </Text>
          ))}

          <Text className="mt-6 text-lg font-semibold text-gray-900">Steps</Text>
          {(state.currentRecipe.steps || []).map((step: any, idx: number) => (
            <View key={idx} className="mt-3 rounded-lg bg-gray-50 p-3">
              <Text className="font-semibold text-gray-900">
                Step {step.stepNumber || idx + 1}
              </Text>
              <Text className="mt-1 text-gray-700">{step.instructionText}</Text>
            </View>
          ))}

          {/* Comments Section */}
          <Text className="mt-6 text-lg font-semibold text-gray-900">Comments</Text>
          {(state.currentRecipe.comments || []).length > 0 ? (
            (state.currentRecipe.comments || []).slice(0, 3).map((comment: any, idx: number) => (
              <View key={idx} className="mt-3 rounded-lg border border-gray-200 p-3">
                <Text className="font-semibold text-gray-900">{comment.authorName || "Anonymous"}</Text>
                <Text className="mt-1 text-sm text-gray-600">{comment.text}</Text>
                <Text className="mt-1 text-xs text-gray-500">{comment.rating} ⭐</Text>
              </View>
            ))
          ) : (
            <Text className="mt-3 text-gray-500">No comments yet. Be the first!</Text>
          )}
          <TextInput
            placeholder="Add a comment..."
            multiline
            className="mt-4 rounded-lg border border-gray-300 p-3 text-gray-900"
          />

          <Pressable
            className="mt-6 rounded-xl bg-blue-600 px-4 py-3"
            onPress={() => updateState({ browseMode: "cook" })}
          >
            <Text className="text-center font-semibold text-white">
              Start cooking mode
            </Text>
          </Pressable>
        </ScrollView>
      );
    }

    if (state.browseMode === "cook") {
      const steps = state.currentRecipe?.steps || [];
      const current = steps[state.cookStep];

      if (state.loading || !state.currentRecipe) {
        return (
          <View className="flex-1 items-center justify-center bg-white">
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        );
      }

      return (
        <View className="flex-1 px-6 py-8 bg-white">
          <Pressable onPress={() => updateState({ browseMode: "detail" })}>
            <Text className="text-blue-600 font-medium">← Back</Text>
          </Pressable>
          <Text className="mt-2 text-sm text-gray-500">Cooking mode</Text>
          <Text className="mt-1 text-xl font-bold text-gray-900">
            {state.currentRecipe.title}
          </Text>
          <Text className="mt-4 text-sm text-gray-500">
            Step {state.cookStep + 1} of {steps.length}
          </Text>
          <View className="mt-4 flex-1 rounded-xl border border-gray-200 p-6">
            <Text className="text-6xl font-bold text-blue-600">
              {current?.stepNumber || state.cookStep + 1}
            </Text>
            <Text className="mt-4 text-lg leading-7 text-gray-800">
              {current?.instructionText || "No steps"}
            </Text>
          </View>
          <View className="mt-4 flex-row gap-3">
            <Pressable
              className="flex-1 rounded-xl border border-gray-200 py-3"
              onPress={() =>
                updateState({ cookStep: Math.max(0, state.cookStep - 1) })
              }
              disabled={state.cookStep === 0}
            >
              <Text className="text-center font-semibold text-gray-900">Previous</Text>
            </Pressable>
            <Pressable
              className="flex-1 rounded-xl bg-blue-600 py-3"
              onPress={() =>
                updateState({ cookStep: Math.min(steps.length - 1, state.cookStep + 1) })
              }
              disabled={state.cookStep >= steps.length - 1}
            >
              <Text className="text-center font-semibold text-white">Next</Text>
            </Pressable>
          </View>
        </View>
      );
    }
  };

  const CreateScreen = () => {
    if (state.createMode === "input") {
      return (
        <ScrollView className="flex-1 px-6 py-6 bg-white" contentContainerStyle={{ paddingBottom: 100 }}>
          <Text className="text-2xl font-bold text-gray-900">Create Recipe</Text>
          <Text className="mt-2 text-gray-600">
            Share your recipe with the community. Use voice or text.
          </Text>

          {/* Input Method Selection */}
          <View className="mt-6 gap-3">
            <Pressable
              className={`rounded-xl px-4 py-4 ${
                state.createInputMethod === "voice"
                  ? "bg-blue-600"
                  : "border border-gray-300"
              }`}
              onPress={() => updateState({ createInputMethod: "voice" })}
            >
              <Text
                className={`text-center font-semibold ${
                  state.createInputMethod === "voice"
                    ? "text-white"
                    : "text-gray-900"
                }`}
              >
                🎤 Use voice
              </Text>
            </Pressable>
            <Pressable
              className={`rounded-xl px-4 py-4 ${
                state.createInputMethod === "text"
                  ? "bg-blue-600"
                  : "border border-gray-300"
              }`}
              onPress={() => updateState({ createInputMethod: "text" })}
            >
              <Text
                className={`text-center font-semibold ${
                  state.createInputMethod === "text"
                    ? "text-white"
                    : "text-gray-900"
                }`}
              >
                ✏️ Write recipe
              </Text>
            </Pressable>
          </View>

          {/* Language Selection */}
          <Text className="mt-6 text-sm font-medium text-gray-700">Language</Text>
          <View className="mt-2 flex-row gap-2">
            {["auto", "en", "es", "fr"].map((lang) => (
              <Pressable
                key={lang}
                className={`flex-1 rounded-lg px-3 py-2 ${
                  state.createLanguage === lang
                    ? "bg-blue-600"
                    : "border border-gray-300"
                }`}
                onPress={() => updateState({ createLanguage: lang })}
              >
                <Text
                  className={`text-center text-sm font-medium ${
                    state.createLanguage === lang
                      ? "text-white"
                      : "text-gray-900"
                  }`}
                >
                  {lang === "auto"
                    ? "Auto"
                    : lang === "en"
                      ? "EN"
                      : lang === "es"
                        ? "ES"
                        : "FR"}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Recipe Input */}
          <Text className="mt-6 text-sm font-medium text-gray-700">Recipe Text</Text>
          <TextInput
            placeholder={`Paste your recipe ${
              state.createInputMethod === "voice"
                ? "or record audio..."
                : "instructions here..."
            }`}
            value={state.createRecipeText}
            onChangeText={(text) => updateState({ createRecipeText: text })}
            multiline
            className="mt-2 min-h-32 rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
          />

          {state.createInputMethod === "voice" && (
            <Pressable className="mt-4 rounded-lg bg-red-600 py-3">
              <Text className="text-center font-semibold text-white">
                🎙️ Record Audio
              </Text>
            </Pressable>
          )}

          {/* Structure Button */}
          <Pressable
            className="mt-6 rounded-xl bg-blue-600 px-4 py-3"
            onPress={handleStructureRecipe}
            disabled={state.loading}
          >
            <Text className="text-center font-semibold text-white">
              {state.loading ? "Structuring..." : "Structure with AI"}
            </Text>
          </Pressable>

          <Text className="mt-8 text-xs text-gray-500">
            Our AI will analyze your recipe and organize it into ingredients, steps, timing,
            and more.
          </Text>
        </ScrollView>
      );
    }

    if (state.createMode === "preview") {
      return (
        <ScrollView className="flex-1 px-6 py-6 bg-white" contentContainerStyle={{ paddingBottom: 100 }}>
          <Pressable onPress={() => updateState({ createMode: "input" })}>
            <Text className="text-blue-600 font-medium">← Back</Text>
          </Pressable>

          <Text className="mt-4 text-2xl font-bold text-gray-900">Preview</Text>
          <Text className="mt-1 text-gray-600">
            Check and edit your recipe details before saving.
          </Text>

          {/* Editable Title */}
          <Text className="mt-6 text-sm font-medium text-gray-700">Title</Text>
          <TextInput
            value={state.createTitle}
            onChangeText={(text) => updateState({ createTitle: text })}
            className="mt-2 rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
          />

          {/* Description */}
          <Text className="mt-4 text-sm font-medium text-gray-700">Description</Text>
          <TextInput
            value={state.createDescription}
            onChangeText={(text) => updateState({ createDescription: text })}
            multiline
            className="mt-2 min-h-20 rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
          />

          {/* Difficulty */}
          <Text className="mt-4 text-sm font-medium text-gray-700">Difficulty</Text>
          <View className="mt-2 flex-row gap-2">
            {(["easy", "medium", "hard"] as const).map((d) => (
              <Pressable
                key={d}
                className={`flex-1 rounded-lg py-2 ${
                  state.createDifficulty === d
                    ? "bg-blue-600"
                    : "border border-gray-300"
                }`}
                onPress={() => updateState({ createDifficulty: d })}
              >
                <Text
                  className={`text-center font-medium ${
                    state.createDifficulty === d
                      ? "text-white"
                      : "text-gray-900"
                  }`}
                >
                  {d}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Ingredients Preview */}
          <Text className="mt-6 text-lg font-semibold text-gray-900">
            Ingredients ({state.createIngredients.length})
          </Text>
          {state.createIngredients.map((ing, idx) => (
            <View key={idx} className="mt-2 rounded-lg bg-gray-50 p-3">
              <Text className="text-gray-900">
                {ing.quantity} {ing.name}
              </Text>
            </View>
          ))}

          {/* Steps Preview */}
          <Text className="mt-6 text-lg font-semibold text-gray-900">
            Steps ({state.createSteps.length})
          </Text>
          {state.createSteps.map((step, idx) => (
            <View key={idx} className="mt-2 rounded-lg bg-gray-50 p-3">
              <Text className="font-semibold text-gray-900">
                Step {step.stepNumber || idx + 1}
              </Text>
              <Text className="mt-1 text-gray-700">{step.instructionText}</Text>
            </View>
          ))}

          {/* Action Buttons */}
          <View className="mt-6 gap-3">
            <View className="flex-row gap-3">
              <Pressable
                className="flex-1 rounded-xl border border-gray-300 py-3"
                onPress={() => updateState({ createMode: "input" })}
              >
                <Text className="text-center font-semibold text-gray-900">
                  ← Back
                </Text>
              </Pressable>
              <Pressable
                className="flex-1 rounded-xl border border-blue-600 py-3"
                onPress={handleImproveRecipe}
                disabled={state.loading}
              >
                <Text className="text-center font-semibold text-blue-600">
                  {state.loading ? "Improving..." : "✨ Improve"}
                </Text>
              </Pressable>
            </View>
            <Pressable
              className="rounded-xl bg-blue-600 px-4 py-3"
              onPress={() => updateState({ createMode: "details" })}
            >
              <Text className="text-center font-semibold text-white">
                Continue to Details →
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      );
    }

    if (state.createMode === "details") {
      return (
        <ScrollView className="flex-1 px-6 py-6 bg-white" contentContainerStyle={{ paddingBottom: 100 }}>
          <Pressable onPress={() => updateState({ createMode: "preview" })}>
            <Text className="text-blue-600 font-medium">← Back</Text>
          </Pressable>

          <Text className="mt-4 text-2xl font-bold text-gray-900">Final Review</Text>
          <Text className="mt-1 text-gray-600">Check your recipe one more time before publishing</Text>

          {/* Recipe Summary */}
          <View className="mt-6 rounded-lg bg-gray-50 p-4">
            <Text className="text-lg font-semibold text-gray-900">{state.createTitle}</Text>
            {state.createDescription && (
              <Text className="mt-2 text-sm text-gray-600">{state.createDescription}</Text>
            )}
            <View className="mt-3 flex-row flex-wrap gap-2">
              <View className="rounded-full bg-blue-100 px-3 py-1">
                <Text className="text-xs font-medium text-blue-700">{state.createDifficulty}</Text>
              </View>
              {state.createTags.map((tag) => (
                <View key={tag} className="rounded-full bg-gray-200 px-3 py-1">
                  <Text className="text-xs font-medium text-gray-700">#{tag}</Text>
                </View>
              ))}
            </View>
          </View>

          {state.createCookingTime && (
            <View className="mt-4 rounded-lg bg-blue-50 p-3">
              <Text className="text-sm text-blue-900">
                ⏱️ {state.createCookingTime} minutes cooking time
              </Text>
            </View>
          )}

          {/* Ingredients Summary */}
          <Text className="mt-6 text-lg font-semibold text-gray-900">
            Ingredients ({state.createIngredients.length})
          </Text>
          <View className="mt-2 space-y-1">
            {state.createIngredients.map((ing, idx) => (
              <View key={idx} className="flex-row items-center gap-2">
                <Text className="text-gray-900">☐</Text>
                <Text className="text-sm text-gray-700">
                  {ing.quantity} {ing.name}
                </Text>
              </View>
            ))}
          </View>

          {/* Steps Summary */}
          <Text className="mt-6 text-lg font-semibold text-gray-900">
            Steps ({state.createSteps.length})
          </Text>
          <View className="mt-2 space-y-2">
            {state.createSteps.map((step, idx) => (
              <View key={idx} className="flex-row gap-2">
                <Text className="font-semibold text-gray-900">{idx + 1}.</Text>
                <Text className="flex-1 text-sm text-gray-700">
                  {step.instructionText}
                </Text>
              </View>
            ))}
          </View>

          {/* Action Buttons */}
          <View className="mt-6 flex-row gap-3 border-t border-gray-200 pt-4">
            <Pressable
              className="flex-1 rounded-xl border border-gray-300 py-3"
              onPress={() => updateState({ createMode: "preview" })}
            >
              <Text className="text-center font-semibold text-gray-900">
                ← Edit
              </Text>
            </Pressable>
            <Pressable
              className="flex-1 rounded-xl bg-blue-600 py-3"
              onPress={handleSubmitRecipe}
              disabled={state.loading}
            >
              <Text className="text-center font-semibold text-white">
                {state.loading ? "Publishing..." : "🚀 Publish"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      );
    }
  };

  const DashboardScreen = () => (
    <ScrollView className="flex-1 px-6 py-6 bg-white" contentContainerStyle={{ paddingBottom: 100 }}>
      <Text className="text-2xl font-bold text-gray-900">Your Dashboard</Text>
      <Text className="mt-1 text-gray-600">Manage your recipes and track engagement</Text>

      {/* Action Button */}
      <Pressable
        className="mt-4 rounded-xl bg-blue-600 px-4 py-3"
        onPress={() => updateState({ currentTab: "create", createMode: "input" })}
      >
        <Text className="text-center font-semibold text-white">+ Create New Recipe</Text>
      </Pressable>

      {/* Stats */}
      <View className="mt-6 gap-3">
        <View className="rounded-xl border border-gray-200 p-4">
          <Text className="text-sm font-medium text-gray-600">Total Recipes</Text>
          <Text className="mt-1 text-3xl font-bold text-gray-900">
            {state.stats.totalRecipes}
          </Text>
        </View>
        <View className="rounded-xl border border-gray-200 p-4">
          <Text className="text-sm font-medium text-gray-600">Total Likes</Text>
          <Text className="mt-1 text-3xl font-bold text-gray-900">
            {state.stats.totalLikes}
          </Text>
        </View>
        <View className="rounded-xl border border-gray-200 p-4">
          <Text className="text-sm font-medium text-gray-600">Total Comments</Text>
          <Text className="mt-1 text-3xl font-bold text-gray-900">
            {state.stats.totalComments}
          </Text>
        </View>
      </View>

      <Text className="mt-8 text-lg font-semibold text-gray-900">Your Recipes</Text>
      {state.loading ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 20 }} />
      ) : state.userRecipes.length === 0 ? (
        <Text className="mt-4 text-gray-500">
          You haven't created any recipes yet. Start by creating one!
        </Text>
      ) : (
        state.userRecipes.map((recipe) => (
          <Pressable
            key={recipe.id}
            className="mt-3 rounded-xl border border-gray-200 p-4"
            onPress={() => selectRecipe(recipe.id, "detail")}
          >
            <Text className="font-semibold text-gray-900">{recipe.title}</Text>
            <Text className="mt-1 text-xs text-gray-500">
              {recipe.likesCount || 0} likes • {recipe.commentsCount || 0} comments
            </Text>
          </Pressable>
        ))
      )}
    </ScrollView>
  );

  const ProfileScreen = () => {
    if (!state.isLoggedIn) {
      return (
        <ScrollView className="flex-1 px-6 py-6 bg-white" contentContainerStyle={{ paddingBottom: 100 }}>
          <Text className="text-2xl font-bold text-gray-900">Profile</Text>
          <View className="mt-6 rounded-xl border border-gray-200 p-6">
            <Text className="text-lg font-semibold text-gray-900">👤 Sign In</Text>
            <Text className="mt-3 text-gray-600">
              Create an account or sign in to access your dashboard and create recipes.
            </Text>
            <Pressable
              className="mt-4 rounded-xl bg-blue-600 px-4 py-3"
              onPress={() => updateState({ currentTab: "login" })}
            >
              <Text className="text-center font-semibold text-white">Sign In</Text>
            </Pressable>
            <Pressable
              className="mt-3 rounded-xl border border-blue-600 px-4 py-3"
              onPress={() => updateState({ currentTab: "signup" })}
            >
              <Text className="text-center font-semibold text-blue-600">Create Account</Text>
            </Pressable>
          </View>
        </ScrollView>
      );
    }

    if (state.profileEditMode) {
      return (
        <ScrollView className="flex-1 px-6 py-6 bg-white" contentContainerStyle={{ paddingBottom: 100 }}>
          <Text className="text-2xl font-bold text-gray-900">Edit Profile</Text>
          <View className="mt-6 gap-4">
            <View>
              <Text className="text-sm font-medium text-gray-700">Full Name</Text>
              <TextInput
                placeholder="Your Name"
                value={state.profileName}
                onChangeText={(text) => updateState({ profileName: text })}
                className="mt-2 rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
              />
            </View>
            <View>
              <Text className="text-sm font-medium text-gray-700">Email</Text>
              <TextInput
                value={state.user?.email}
                editable={false}
                className="mt-2 rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-gray-500"
              />
            </View>
            <View>
              <Text className="text-sm font-medium text-gray-700">Bio</Text>
              <TextInput
                placeholder="Tell us about yourself"
                value={state.profileBio}
                onChangeText={(text) => updateState({ profileBio: text })}
                multiline
                className="mt-2 min-h-20 rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
              />
            </View>
            <View>
              <Text className="text-sm font-medium text-gray-700">Location</Text>
              <TextInput
                placeholder="City, Country"
                value={state.profileLocation}
                onChangeText={(text) => updateState({ profileLocation: text })}
                className="mt-2 rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
              />
            </View>
            <View>
              <Text className="text-sm font-medium text-gray-700">Website</Text>
              <TextInput
                placeholder="https://yoursite.com"
                value={state.profileWebsite}
                onChangeText={(text) => updateState({ profileWebsite: text })}
                keyboardType="url"
                className="mt-2 rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
              />
            </View>
            <View>
              <Text className="text-sm font-medium text-gray-700">Instagram Handle</Text>
              <TextInput
                placeholder="username"
                value={state.profileInstagram}
                onChangeText={(text) => updateState({ profileInstagram: text })}
                className="mt-2 rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
              />
            </View>
            <View>
              <Text className="text-sm font-medium text-gray-700">Dietary Preferences</Text>
              <TextInput
                placeholder="Vegan, Gluten-Free (comma separated)"
                value={state.profileDietaryPreferences}
                onChangeText={(text) => updateState({ profileDietaryPreferences: text })}
                className="mt-2 rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
              />
            </View>

            <Pressable
              className="mt-6 rounded-xl bg-blue-600 px-4 py-3"
              onPress={handleUpdateProfile}
              disabled={state.loading}
            >
              <Text className="text-center font-semibold text-white">
                {state.loading ? "Saving..." : "Save Changes"}
              </Text>
            </Pressable>
            <Pressable
              className="rounded-xl border border-gray-300 px-4 py-3"
              onPress={() => updateState({ profileEditMode: false })}
              disabled={state.loading}
            >
              <Text className="text-center font-semibold text-gray-900">Cancel</Text>
            </Pressable>
          </View>
        </ScrollView>
      );
    }

    return (
      <ScrollView className="flex-1 px-6 py-6 bg-white" contentContainerStyle={{ paddingBottom: 100 }}>
        <Text className="text-2xl font-bold text-gray-900">Profile</Text>
        <View className="mt-6 rounded-xl border border-gray-200 p-6">
          <Text className="text-lg font-semibold text-gray-900">
            👤 {state.user?.name || "User"}
          </Text>
          <Text className="mt-2 text-gray-600">{state.user?.email}</Text>
          
          {state.user?.bio ? (
            <Text className="mt-4 text-gray-800 italic">"{state.user.bio}"</Text>
          ) : null}
          
          {state.user?.location ? (
            <Text className="mt-2 text-sm text-gray-600">📍 {state.user.location}</Text>
          ) : null}
          
          {state.user?.website ? (
            <Text className="mt-1 text-sm text-blue-600">🌐 {state.user.website}</Text>
          ) : null}
          
          {state.user?.instagram ? (
            <Text className="mt-1 text-sm text-pink-600">📸 @{state.user.instagram}</Text>
          ) : null}
          
          {state.user?.dietaryPreferences?.length > 0 ? (
            <View className="mt-4 flex-row flex-wrap gap-2">
              {state.user.dietaryPreferences.map((pref: string) => (
                <View key={pref} className="rounded-full bg-green-100 px-3 py-1">
                  <Text className="text-xs font-medium text-green-800">{pref}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <Pressable
            className="mt-6 rounded-xl border border-gray-300 px-4 py-3"
            onPress={() => updateState({ 
              profileEditMode: true, 
              profileName: state.user?.name || '',
              profileBio: state.user?.bio || '',
              profileLocation: state.user?.location || '',
              profileWebsite: state.user?.website || '',
              profileInstagram: state.user?.instagram || '',
              profileDietaryPreferences: state.user?.dietaryPreferences?.join(", ") || '',
            })}
          >
            <Text className="text-center font-semibold text-gray-900">Edit Profile</Text>
          </Pressable>
          <Pressable
            className="mt-3 rounded-xl border border-red-600 px-4 py-3"
            onPress={handleLogout}
          >
            <Text className="text-center font-semibold text-red-600">Sign Out</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  };

  const LoginScreen = () => (
    <ScrollView className="flex-1 px-6 py-6 bg-white" contentContainerStyle={{ paddingBottom: 100 }}>
      <Pressable onPress={() => updateState({ currentTab: "profile" })}>
        <Text className="text-blue-600 font-medium">← Back</Text>
      </Pressable>
      <Text className="mt-4 text-2xl font-bold text-gray-900">Sign In</Text>

      <View className="mt-6 gap-4">
        <View>
          <Text className="text-sm font-medium text-gray-700">Email</Text>
          <TextInput
            placeholder="you@example.com"
            keyboardType="email-address"
            value={state.loginEmail}
            onChangeText={(text) => updateState({ loginEmail: text })}
            className="mt-2 rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
          />
        </View>

        <View>
          <Text className="text-sm font-medium text-gray-700">Password</Text>
          <TextInput
            placeholder="••••••••"
            secureTextEntry
            value={state.loginPassword}
            onChangeText={(text) => updateState({ loginPassword: text })}
            className="mt-2 rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
          />
        </View>

        <Pressable
          className="mt-6 rounded-xl bg-blue-600 px-4 py-3"
          onPress={handleLogin}
          disabled={state.loading}
        >
          <Text className="text-center font-semibold text-white">
            {state.loading ? "Signing in..." : "Sign In"}
          </Text>
        </Pressable>

        <Text className="mt-4 text-center text-gray-600">
          Don't have an account?{" "}
          <Pressable onPress={() => updateState({ currentTab: "signup" })}>
            <Text className="font-semibold text-blue-600">Sign up</Text>
          </Pressable>
        </Text>
      </View>
    </ScrollView>
  );

  const SignupScreen = () => (
    <ScrollView className="flex-1 px-6 py-6 bg-white" contentContainerStyle={{ paddingBottom: 100 }}>
      <Pressable onPress={() => updateState({ currentTab: "profile" })}>
        <Text className="text-blue-600 font-medium">← Back</Text>
      </Pressable>
      <Text className="mt-4 text-2xl font-bold text-gray-900">Create Account</Text>

      <View className="mt-6 gap-4">
        <View>
          <Text className="text-sm font-medium text-gray-700">Full Name</Text>
          <TextInput
            placeholder="John Doe"
            value={state.signupName}
            onChangeText={(text) => updateState({ signupName: text })}
            className="mt-2 rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
          />
        </View>

        <View>
          <Text className="text-sm font-medium text-gray-700">Email</Text>
          <TextInput
            placeholder="you@example.com"
            keyboardType="email-address"
            value={state.signupEmail}
            onChangeText={(text) => updateState({ signupEmail: text })}
            className="mt-2 rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
          />
        </View>

        <View>
          <Text className="text-sm font-medium text-gray-700">Password</Text>
          <TextInput
            placeholder="••••••••"
            secureTextEntry
            value={state.signupPassword}
            onChangeText={(text) => updateState({ signupPassword: text })}
            className="mt-2 rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
          />
        </View>

        <Pressable
          className="mt-6 rounded-xl bg-blue-600 px-4 py-3"
          onPress={handleSignup}
          disabled={state.loading}
        >
          <Text className="text-center font-semibold text-white">
            {state.loading ? "Creating account..." : "Create Account"}
          </Text>
        </Pressable>

        <Text className="mt-4 text-center text-gray-600">
          Already have an account?{" "}
          <Pressable onPress={() => updateState({ currentTab: "login" })}>
            <Text className="font-semibold text-blue-600">Sign in</Text>
          </Pressable>
        </Text>
      </View>
    </ScrollView>
  );

  // Bottom Tab Navigation

const tabs = [
  "home",
  "browse",
  "create",
  "dashboard",
  "profile",
] as const;

const icons = {
  home: "home-outline",
  browse: "magnify",
  create: "plus-circle-outline",
  dashboard: "chart-line",
  profile: "account-outline",
} as const;

const TabBar = () => (
  <View className="flex-row border-t border-gray-200 bg-white">
    {tabs.map((tab) => {
      const isActive = state.currentTab === tab;

      return (
        <Pressable
          key={tab}
          className="flex-1 items-center py-3"
          onPress={() =>
            updateState({
              currentTab: tab,
              browseMode: "list",
              cookStep: 0,
            })
          }
        >
          <MaterialCommunityIcons
            name={icons[tab]}
            size={24}
            color={isActive ? "#171717" : "#A3A3A3"}
          />

          <Text
            className={`mt-1 text-xs font-medium ${
              isActive ? "text-neutral-900" : "text-neutral-400"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Text>
        </Pressable>
      );
    })}
  </View>
);


  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar barStyle="dark-content" />
        {state.currentTab === "home" && <HomeScreen />}
        {state.currentTab === "browse" && <BrowseScreen />}
        {state.currentTab === "create" && <CreateScreen />}
        {state.currentTab === "dashboard" && <DashboardScreen />}
        {state.currentTab === "profile" && <ProfileScreen />}
        {state.currentTab === "login" && <LoginScreen />}
        {state.currentTab === "signup" && <SignupScreen />}
        {(state.currentTab !== "login" && state.currentTab !== "signup") && <TabBar />}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
