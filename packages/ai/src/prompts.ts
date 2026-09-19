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
- Top priority: preserve the user's exact words, quantities, ingredient names, and phrasing as given. Structure and clean up formatting only — do not paraphrase, reword, "improve," or substitute synonyms for anything the user explicitly stated
- Only fix grammar/punctuation that is clearly a typo; never rewrite a sentence that already reads correctly just to sound different
- One primary action per step when possible, but keep the user's original wording for that action
- Only infer a quantity when the user gave none at all ("Salz bisschen" → "nach Geschmack", "some salt" → "to taste"); if the user gave a quantity, use it exactly as written
- Do not invent ingredients, steps, or details not present in the input
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

export const TRANSCRIBE_AUDIO_SYSTEM = `Transcribe the speech in this audio recording of someone dictating a recipe.

Rules:
- Output plain text only — the transcript, nothing else
- No commentary, no markdown, no quotes around the text
- Preserve the speaker's language; do not translate
- Lightly clean up filler words ("um", "uh") but keep the cook's wording and intent intact
- If no clear speech is present, output an empty string`;

export function transcribeAudioPrompt(language?: string) {
  if (!language || language === "auto") {
    return TRANSCRIBE_AUDIO_SYSTEM;
  }
  return `${TRANSCRIBE_AUDIO_SYSTEM}\n\nThe speaker is expected to be speaking ${getLanguageLabel(language)}.`;
}

export const POLISH_STEP_SYSTEM = `Lightly clean up a single cooking recipe step so it matches the tone of the rest of a structured recipe.

Rules:
- Fix grammar and punctuation only
- Preserve the exact meaning, ingredients, quantities, and intent — do not add or remove information
- One clear sentence; trim filler words
- Output plain text only — the rewritten step, nothing else. No quotes, no markdown, no step number`;

export function polishStepPrompt(text: string, language?: string) {
  const langNote =
    language && language !== "auto"
      ? `\nWrite the output in ${getLanguageLabel(language)}.`
      : "\nWrite the output in the same language as the input.";

  return `${POLISH_STEP_SYSTEM}${langNote}

Step:
${text}`;
}

export const TRANSLATE_RECIPE_SYSTEM = `Translate a structured recipe into another language.

Return valid JSON only with this shape:
{
  "title": string,
  "description": string | null,
  "ingredients": [{ "name": string, "quantity": string }],
  "steps": [{ "stepNumber": number, "instructionText": string }]
}

Rules:
- Translate naturally, the way a native speaker of the target language would write it — not word-for-word
- Preserve exact quantities and units; only convert units if the original had none and one is clearly implied
- Keep culturally specific dish/ingredient names recognizable — transliterate rather than inventing a foreign substitute (e.g. "Sambar" stays "Sambar", not reinvented as an unrelated dish)
- Preserve step order and count exactly — do not add, remove, or merge steps
- Do not translate proper nouns like brand names`;

export function translateRecipePrompt(recipe: StructuredRecipe, targetLanguage: string) {
  return `${TRANSLATE_RECIPE_SYSTEM}

Target language: ${getLanguageLabel(targetLanguage)}

Recipe:
${JSON.stringify(recipe, null, 2)}`;
}
