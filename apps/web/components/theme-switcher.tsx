"use client";

import { useEffect, useRef, useState } from "react";
import { Palette, Sun, Moon, Check } from "lucide-react";
import { THEMES, THEME_NAMES } from "@/lib/themes";
import { useThemeSwitcher } from "@/components/theme-provider";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import { cn } from "@/lib/utils";

export function ThemeSwitcher() {
  const { theme, mode, setTheme, toggleMode } = useThemeSwitcher();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("themeSwitcher.changeTheme")}
        className="flex size-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Palette className="size-4" />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-border bg-popover p-3 text-popover-foreground shadow-lg">
          <div className="flex items-center justify-between pb-2">
            <p className="text-xs font-medium text-muted-foreground">{t("themeSwitcher.theme")}</p>
            <button
              type="button"
              onClick={toggleMode}
              aria-label={
                mode === "dark"
                  ? t("themeSwitcher.switchToLightMode")
                  : t("themeSwitcher.switchToDarkMode")
              }
              className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs hover:bg-muted"
            >
              {mode === "dark" ? <Moon className="size-3.5" /> : <Sun className="size-3.5" />}
              {mode === "dark" ? t("themeSwitcher.dark") : t("themeSwitcher.light")}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {THEME_NAMES.map((name) => {
              const def = THEMES[name];
              const active = theme === name;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => setTheme(name)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border p-2 text-left text-xs transition-colors",
                    active ? "border-primary bg-primary/10" : "border-border hover:bg-muted"
                  )}
                >
                  <span
                    className="size-4 shrink-0 rounded-full border border-black/10"
                    style={{ backgroundColor: def.swatch }}
                  />
                  <span className="flex-1 font-medium">{def.label}</span>
                  {active && <Check className="size-3.5 shrink-0 text-primary" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
