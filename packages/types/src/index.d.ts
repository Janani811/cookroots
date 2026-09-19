export type UserRole = "viewer" | "creator" | "admin";
export type RecipeDifficulty = "easy" | "medium" | "hard";
export type RecipeStatus = "draft" | "published";
export type MediaType = "audio" | "image" | "video";
export type HealthBadge = "healthy" | "high_protein" | "low_calorie" | "vegan" | "vegetarian";
export interface User {
    id: string;
    name: string;
    email: string;
    profileImage: string | null;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
}
export interface Ingredient {
    name: string;
    quantity: string;
}
export interface RecipeStep {
    stepNumber: number;
    instructionText: string;
    audioUrl?: string | null;
}
export interface StructuredRecipe {
    title: string;
    description?: string;
    ingredients: Ingredient[];
    steps: RecipeStep[];
    cookingTimeMinutes: number | null;
    difficulty: RecipeDifficulty | null;
    tags: string[];
}
export interface RecipeImprovementResult {
    original: StructuredRecipe;
    improved: StructuredRecipe;
    changes: string[];
}
export interface IngredientMatchResult {
    recipeId: string;
    title: string;
    matchType: "exact" | "partial";
    matchedIngredients: string[];
    missingIngredients: string[];
}
export interface NutritionInfo {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
}
export interface HealthClassification {
    badges: HealthBadge[];
    nutritionEstimate: NutritionInfo;
}
export interface TranslatedRecipeContent {
    title: string;
    description: string | null;
    ingredients: Ingredient[];
    steps: RecipeStep[];
}
