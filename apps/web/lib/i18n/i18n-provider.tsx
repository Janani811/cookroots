"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { DEFAULT_LOCALE, UI_LOCALES, type UILocale } from "@/lib/i18n/locales";

import en from "@/messages/en.json";
import es from "@/messages/es.json";
import fr from "@/messages/fr.json";
import de from "@/messages/de.json";
import hi from "@/messages/hi.json";
import ta from "@/messages/ta.json";
import ml from "@/messages/ml.json";
import te from "@/messages/te.json";
import kn from "@/messages/kn.json";

type Messages = Record<string, Record<string, unknown>>;

const MESSAGES: Record<UILocale, Messages> = { en, es, fr, de, hi, ta, ml, te, kn };

type I18nContextValue = {
  locale: UILocale;
  setLocale: (locale: UILocale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function lookup(messages: Messages, key: string): unknown {
  return key.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object" && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, messages);
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (match, name) =>
    name in vars ? String(vars[name]) : match
  );
}

function translate(
  locale: UILocale,
  key: string,
  vars?: Record<string, string | number>
): string {
  const value = lookup(MESSAGES[locale], key) ?? lookup(MESSAGES[DEFAULT_LOCALE], key);
  if (typeof value !== "string") {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[i18n] Missing translation for key "${key}"`);
    }
    return key;
  }
  return interpolate(value, vars);
}

/**
 * Inline script injected before hydration so the correct `lang` attribute
 * applies on first paint, mirroring THEME_INIT_SCRIPT's flash-prevention pattern.
 */
export const LOCALE_INIT_SCRIPT = `
(function () {
  try {
    var locale = localStorage.getItem("cooksy_locale") || "${DEFAULT_LOCALE}";
    if (${JSON.stringify(Object.keys(UI_LOCALES))}.indexOf(locale) === -1) locale = "${DEFAULT_LOCALE}";
    document.documentElement.lang = locale;
  } catch (e) {}
})();
`;

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<UILocale>(DEFAULT_LOCALE);

  useEffect(() => {
    const stored = localStorage.getItem("cooksy_locale") as UILocale | null;
    if (stored && UI_LOCALES[stored]) {
      setLocaleState(stored);
      document.documentElement.lang = stored;
    }
  }, []);

  const setLocale = useCallback((next: UILocale) => {
    setLocaleState(next);
    localStorage.setItem("cooksy_locale", next);
    document.documentElement.lang = next;
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars),
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useTranslation must be used within I18nProvider");
  return ctx;
}
