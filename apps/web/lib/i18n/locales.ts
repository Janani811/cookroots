export const UI_LOCALES = {
  en: { code: "en", name: "English", nativeName: "English" },
  es: { code: "es", name: "Spanish", nativeName: "Español" },
  fr: { code: "fr", name: "French", nativeName: "Français" },
  de: { code: "de", name: "German", nativeName: "Deutsch" },
  hi: { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  ta: { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
  ml: { code: "ml", name: "Malayalam", nativeName: "മലയാളം" },
  te: { code: "te", name: "Telugu", nativeName: "తెలుగు" },
  kn: { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ" },
} as const;

export type UILocale = keyof typeof UI_LOCALES;

export const UI_LOCALE_CODES = Object.keys(UI_LOCALES) as UILocale[];

export const DEFAULT_LOCALE: UILocale = "en";
