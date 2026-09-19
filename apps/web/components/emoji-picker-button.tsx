"use client";

import { useEffect, useRef, useState } from "react";
import { REACTION_EMOJIS } from "@/components/emoji-reactions";

export function EmojiPickerButton({
  onSelect,
  className,
}: {
  onSelect: (emoji: string) => void;
  className?: string;
}) {
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
    <div className={`relative ${className ?? ""}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Add emoji"
        className="flex size-8 items-center justify-center rounded-md text-base text-muted-foreground hover:bg-muted"
      >
        🙂
      </button>

      {open && (
        <div className="absolute bottom-full right-0 z-10 mb-1 flex gap-1 rounded-lg border border-border bg-popover p-1.5 shadow-lg">
          {REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                onSelect(emoji);
                setOpen(false);
              }}
              className="flex size-7 items-center justify-center rounded-md text-base hover:bg-muted"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
