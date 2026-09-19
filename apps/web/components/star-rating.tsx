"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/i18n-provider";

export function StarRating({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState<number | null>(null);
  const display = hovered ?? value;

  return (
    <div className="flex gap-1" onMouseLeave={() => setHovered(null)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onMouseEnter={() => setHovered(star)}
          onClick={() => onChange(star)}
          className={cn(
            "text-2xl leading-none transition-all duration-150 disabled:cursor-not-allowed disabled:hover:scale-100 hover:scale-125",
            star <= display ? "text-primary scale-110" : "text-muted-foreground/40"
          )}
          aria-label={t("common.rateStars", { count: star })}
        >
          ★
        </button>
      ))}
    </div>
  );
}
