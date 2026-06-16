export const RECIPE_LANGUAGES = {
  en: { code: "en", name: "English", nativeName: "English" },
  de: { code: "de", name: "German", nativeName: "Deutsch" },
  ja: { code: "ja", name: "Japanese", nativeName: "日本語" },
  fr: { code: "fr", name: "French", nativeName: "Français" },
  ta: { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
  te: { code: "te", name: "Telugu", nativeName: "తెలుగు" },
  hi: { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  ml: { code: "ml", name: "Malayalam", nativeName: "മലയാളം" },
  es: { code: "es", name: "Spanish", nativeName: "Español" },
  pa: { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ" },
} as const;

export type RecipeLanguageCode = keyof typeof RECIPE_LANGUAGES;

export const TTS_LOCALES: Record<RecipeLanguageCode, string> = {
  en: "en-US",
  de: "de-DE",
  ja: "ja-JP",
  fr: "fr-FR",
  ta: "ta-IN",
  te: "te-IN",
  hi: "hi-IN",
  ml: "ml-IN",
  es: "es-ES",
  pa: "pa-IN",
};
