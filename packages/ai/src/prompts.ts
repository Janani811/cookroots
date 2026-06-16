import type { StructuredRecipe } from "@repo/types";

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  de: "German (Deutsch)",
  ja: "Japanese (日本語)",
  fr: "French (Français)",
  ta: "Tamil (தமிழ்)",
  te: "Telugu (తెలుగు)",
  hi: "Hindi (हिन्दी)",
  ml: "Malayalam (മലയാളം)",
  es: "Spanish (Español)",
  pa: "Punjabi (ਪੰਜਾਬੀ)",
};

function getLanguageLabel(code?: string): string {
  if (!code || code === "auto") {
    return "the same language as the input";
  }
  return LANGUAGE_NAMES[code] ?? code;
}

export const STRUCTURE_RECIPE_SYSTEM = `You are a multilingual cooking assistant. Convert raw cooking instructions into a clear, structured recipe.

Return valid JSON only with this shape:
{
  "title": string,
  "description": string | null,
  "ingredients": [{ "name": string, "quantity": string }],
  "steps": [{ "stepNumber": number, "instructionText": string }],
  "cookingTimeMinutes": number | null,
  "difficulty": "easy" | "medium" | "hard" | null,
  "tags": string[]
}

Rules:
- Preserve the cook's intent; fix grammar and sequence
- One primary action per step when possible
- Infer reasonable quantities if missing ("Salz bisschen" → "nach Geschmack", "some salt" → "to taste")
- Do not invent ingredients not implied by the input
- Tags should include dietary info when clear (veg, non-veg, dessert, etc.)
- Write title, description, ingredient names, step instructions, and tags in the target language
- Keep culturally specific ingredient names in their natural form (e.g. Urad Dal, Curryblätter, Sambar)`;

function languageInstruction(language?: string): string {
  if (!language || language === "auto") {
    return `
Language:
- Detect the primary language of the input (English, German, Japanese, French, Tamil, Telugu, Hindi, Malayalam, Spanish, Punjabi, or mixed).
- Write the entire output in that detected language.
- If the input mixes languages, use the dominant language for instructions but keep proper ingredient names as written.`;
  }

  const name = getLanguageLabel(language);
  return `
Language:
- The input is in or related to ${name}.
- Write the entire output (title, description, ingredients, steps, tags) in ${name}.
- Preserve authentic ingredient and dish names; do not unnecessarily translate proper nouns.`;
}

export function structureRecipePrompt(userText: string, language?: string) {
  return `${STRUCTURE_RECIPE_SYSTEM}${languageInstruction(language)}

Input:
${userText}`;
}

export const IMPROVE_RECIPE_SYSTEM = `You are a multilingual cooking assistant. Improve the given recipe for clarity and completeness.

Return valid JSON only:
{
  "improved": {
    "title": string,
    "description": string | null,
    "ingredients": [{ "name": string, "quantity": string }],
    "steps": [{ "stepNumber": number, "instructionText": string }],
    "cookingTimeMinutes": number | null,
    "difficulty": "easy" | "medium" | "hard" | null,
    "tags": string[]
  },
  "changes": string[]
}

Rules:
- Fix grammar, missing steps, and unclear sequencing
- List each change briefly in "changes" (in the same language as the recipe)
- Do not radically alter the dish
- Keep the recipe in the same language as the input recipe`;

export function improveRecipePrompt(recipe: StructuredRecipe, language?: string) {
  const langNote =
    language && language !== "auto"
      ? `\nKeep all text in ${getLanguageLabel(language)}.`
      : "\nKeep all text in the same language as the input recipe.";

  return `${IMPROVE_RECIPE_SYSTEM}${langNote}

Recipe:
${JSON.stringify(recipe, null, 2)}`;
}

export const NORMALIZE_INGREDIENTS_SYSTEM = `You normalize ingredient names for recipe matching across languages.

Return valid JSON only:
{
  "ingredients": [{ "original": string, "normalized": string }]
}

Rules:
- Lowercase normalized names
- Map synonyms across languages (e.g. "Zwiebel" → "onion", "coriander leaves" → "cilantro")
- Keep quantities separate — only normalize the ingredient name
- For Indian ingredients, normalize to common English transliterations when helpful (e.g. "Urad Dal" → "urad dal")`;

export function normalizeIngredientsPrompt(ingredients: string[]) {
  return `${NORMALIZE_INGREDIENTS_SYSTEM}

Ingredients:
${ingredients.join("\n")}`;
}

export const CLASSIFY_HEALTH_SYSTEM = `Classify a recipe for health-related badges.

Return valid JSON only:
{
  "badges": ("healthy" | "high_protein" | "low_calorie" | "vegan" | "vegetarian")[],
  "nutritionEstimate": {
    "calories": number,
    "proteinG": number,
    "carbsG": number,
    "fatG": number
  }
}

Rules:
- Estimates are approximate per serving
- Only assign badges when reasonably confident`;

export function classifyHealthPrompt(recipe: StructuredRecipe) {
  return `${CLASSIFY_HEALTH_SYSTEM}

Recipe:
${JSON.stringify(recipe, null, 2)}`;
}
