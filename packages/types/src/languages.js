"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TTS_LOCALES = exports.RECIPE_LANGUAGE_CODES = exports.RECIPE_LANGUAGES = void 0;
exports.getRecipeLanguage = getRecipeLanguage;
exports.getRecipeLanguageName = getRecipeLanguageName;
exports.RECIPE_LANGUAGES = {
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
};
exports.RECIPE_LANGUAGE_CODES = Object.keys(exports.RECIPE_LANGUAGES);
function getRecipeLanguage(code) {
    if (!code || code === "auto")
        return null;
    return exports.RECIPE_LANGUAGES[code] ?? null;
}
function getRecipeLanguageName(code) {
    const lang = getRecipeLanguage(code);
    return lang ? `${lang.name} (${lang.nativeName})` : "the same language as the input";
}
/** BCP-47 locales for browser speech synthesis */
exports.TTS_LOCALES = {
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
//# sourceMappingURL=languages.js.map