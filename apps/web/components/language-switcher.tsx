"use client";

import { useEffect, useRef, useState } from "react";
import { Globe, Check } from "lucide-react";
import { UI_LOCALE_CODES, UI_LOCALES } from "@/lib/i18n/locales";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useTranslation();
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
        aria-label={t("languageSwitcher.changeLanguage")}
        className="flex size-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Globe className="size-4" />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-border bg-popover p-3 text-popover-foreground shadow-lg">
          <p className="pb-2 text-xs font-medium text-muted-foreground">
            {t("languageSwitcher.language")}
          </p>

          <div className="grid grid-cols-2 gap-2">
            {UI_LOCALE_CODES.map((code) => {
              const def = UI_LOCALES[code];
              const active = locale === code;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => {
                    setLocale(code);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border p-2 text-left text-xs transition-colors",
                    active ? "border-primary bg-primary/10" : "border-border hover:bg-muted"
                  )}
                >
                  <span className="flex-1 font-medium">{def.nativeName}</span>
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
