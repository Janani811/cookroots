export declare const RECIPE_LANGUAGES: {
    readonly en: {
        readonly code: "en";
        readonly name: "English";
        readonly nativeName: "English";
    };
    readonly de: {
        readonly code: "de";
        readonly name: "German";
        readonly nativeName: "Deutsch";
    };
    readonly ja: {
        readonly code: "ja";
        readonly name: "Japanese";
        readonly nativeName: "日本語";
    };
    readonly fr: {
        readonly code: "fr";
        readonly name: "French";
        readonly nativeName: "Français";
    };
    readonly ta: {
        readonly code: "ta";
        readonly name: "Tamil";
        readonly nativeName: "தமிழ்";
    };
    readonly te: {
        readonly code: "te";
        readonly name: "Telugu";
        readonly nativeName: "తెలుగు";
    };
    readonly hi: {
        readonly code: "hi";
        readonly name: "Hindi";
        readonly nativeName: "हिन्दी";
    };
    readonly ml: {
        readonly code: "ml";
        readonly name: "Malayalam";
        readonly nativeName: "മലയാളം";
    };
    readonly es: {
        readonly code: "es";
        readonly name: "Spanish";
        readonly nativeName: "Español";
    };
    readonly pa: {
        readonly code: "pa";
        readonly name: "Punjabi";
        readonly nativeName: "ਪੰਜਾਬੀ";
    };
};
export type RecipeLanguageCode = keyof typeof RECIPE_LANGUAGES;
export declare const RECIPE_LANGUAGE_CODES: RecipeLanguageCode[];
export declare function getRecipeLanguage(code?: string): {
    readonly code: "en";
    readonly name: "English";
    readonly nativeName: "English";
} | {
    readonly code: "de";
    readonly name: "German";
    readonly nativeName: "Deutsch";
} | {
    readonly code: "ja";
    readonly name: "Japanese";
    readonly nativeName: "日本語";
} | {
    readonly code: "fr";
    readonly name: "French";
    readonly nativeName: "Français";
} | {
    readonly code: "ta";
    readonly name: "Tamil";
    readonly nativeName: "தமிழ்";
} | {
    readonly code: "te";
    readonly name: "Telugu";
    readonly nativeName: "తెలుగు";
} | {
    readonly code: "hi";
    readonly name: "Hindi";
    readonly nativeName: "हिन्दी";
} | {
    readonly code: "ml";
    readonly name: "Malayalam";
    readonly nativeName: "മലയാളം";
} | {
    readonly code: "es";
    readonly name: "Spanish";
    readonly nativeName: "Español";
} | {
    readonly code: "pa";
    readonly name: "Punjabi";
    readonly nativeName: "ਪੰਜਾਬੀ";
};
export declare function getRecipeLanguageName(code?: string): string;
/** BCP-47 locales for browser speech synthesis */
export declare const TTS_LOCALES: Record<RecipeLanguageCode, string>;
