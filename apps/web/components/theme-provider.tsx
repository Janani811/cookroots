"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { THEMES, DEFAULT_THEME, type ThemeName } from "@/lib/themes";

type Mode = "light" | "dark";

type ThemeContextValue = {
  theme: ThemeName;
  mode: Mode;
  setTheme: (theme: ThemeName) => void;
  setMode: (mode: Mode) => void;
  toggleMode: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: ThemeName, mode: Mode) {
  const root = document.documentElement;
  const vars = THEMES[theme][mode];
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(`--${key}`, value);
  }
  root.classList.toggle("dark", mode === "dark");
  root.setAttribute("data-theme", theme);
  root.style.colorScheme = mode;
}

/**
 * Inline script injected before hydration so the correct theme/mode applies
 * on first paint — avoids a flash of the default palette while React boots.
 */
export const THEME_INIT_SCRIPT = `
(function () {
  try {
    var theme = localStorage.getItem("cookroots_theme") || "${DEFAULT_THEME}";
    var mode = localStorage.getItem("cookroots_mode");
    if (!mode) {
      mode = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    var themes = ${JSON.stringify(
      Object.fromEntries(
        Object.entries(THEMES).map(([name, def]) => [
          name,
          { light: def.light, dark: def.dark },
        ])
      )
    )};
    var vars = (themes[theme] || themes["${DEFAULT_THEME}"])[mode];
    var root = document.documentElement;
    for (var key in vars) root.style.setProperty("--" + key, vars[key]);
    root.classList.toggle("dark", mode === "dark");
    root.setAttribute("data-theme", theme);
    root.style.colorScheme = mode;
  } catch (e) {}
})();
`;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(DEFAULT_THEME);
  const [mode, setModeState] = useState<Mode>("light");

  useEffect(() => {
    const storedTheme = localStorage.getItem("cookroots_theme") as ThemeName | null;
    const storedMode = localStorage.getItem("cookroots_mode") as Mode | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    const initialTheme = storedTheme && THEMES[storedTheme] ? storedTheme : DEFAULT_THEME;
    const initialMode: Mode = storedMode ?? (prefersDark ? "dark" : "light");

    setThemeState(initialTheme);
    setModeState(initialMode);
    // The inline head script already applied this on first paint; this just
    // syncs React state so the switcher UI reflects the active theme.
  }, []);

  const setTheme = useCallback(
    (next: ThemeName) => {
      setThemeState(next);
      localStorage.setItem("cookroots_theme", next);
      applyTheme(next, mode);
    },
    [mode]
  );

  const setMode = useCallback(
    (next: Mode) => {
      setModeState(next);
      localStorage.setItem("cookroots_mode", next);
      applyTheme(theme, next);
    },
    [theme]
  );

  const toggleMode = useCallback(() => {
    setMode(mode === "dark" ? "light" : "dark");
  }, [mode, setMode]);

  return (
    <ThemeContext.Provider value={{ theme, mode, setTheme, setMode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeSwitcher() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useThemeSwitcher must be used within ThemeProvider");
  return ctx;
}
