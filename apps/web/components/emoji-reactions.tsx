"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { ReactionSummary } from "@/lib/api";

export const REACTION_EMOJIS = ["❤️", "😋", "🔥", "👏", "😍", "🤤"] as const;

export function EmojiReactions({
  reactions,
  onToggle,
  disabled,
}: {
  reactions: ReactionSummary[];
  onToggle: (emoji: string, reactedByViewer: boolean) => void;
  disabled?: boolean;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative flex flex-wrap items-center gap-1.5" ref={ref}>
      {reactions
        .filter((r) => r.count > 0)
        .map((r) => (
          <button
            key={r.emoji}
            type="button"
            disabled={disabled}
            onClick={() => onToggle(r.emoji, r.reactedByViewer)}
            className={cn(
              "flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50",
              r.reactedByViewer
                ? "border-primary bg-primary/10"
                : "border-border hover:bg-muted"
            )}
          >
            <span>{r.emoji}</span>
            <span>{r.count}</span>
          </button>
        ))}

      <button
        type="button"
        disabled={disabled}
        onClick={() => setPickerOpen((v) => !v)}
        className="flex size-6 items-center justify-center rounded-full border border-dashed border-border text-xs text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Add reaction"
      >
        +
      </button>

      {pickerOpen && (
        <div className="absolute bottom-full left-0 z-10 mb-1 flex gap-1 rounded-lg border border-border bg-popover p-1.5 shadow-lg">
          {REACTION_EMOJIS.map((emoji) => {
            const existing = reactions.find((r) => r.emoji === emoji);
            return (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  onToggle(emoji, existing?.reactedByViewer ?? false);
                  setPickerOpen(false);
                }}
                className={cn(
                  "flex size-7 items-center justify-center rounded-md text-base hover:bg-muted",
                  existing?.reactedByViewer && "bg-primary/10"
                )}
              >
                {emoji}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
