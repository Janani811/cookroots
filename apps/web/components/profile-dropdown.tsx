"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import type { User } from "@/lib/api";
import { useTranslation } from "@/lib/i18n/i18n-provider";

export function ProfileDropdown({
  user,
  onLogout,
}: {
  user?: User | null;
  onLogout?: () => void;
}) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    onLogout?.();
    setIsOpen(false);
  };

  if (!user) {
    return (
      <Link href="/login" className="text-sm font-medium text-primary hover:underline">
        {t("profileDropdown.signIn")}
      </Link>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full border border-border p-1 pr-2 hover:bg-muted transition"
      >
        {user.profileImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.profileImage}
            alt={user.name}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
        )}
        <span className="text-sm font-medium text-foreground hidden md:block">{user.name}</span>
        <svg
          className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl border border-border bg-popover text-popover-foreground shadow-lg py-1 z-50">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
          <div className="py-1">
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2 text-sm hover:bg-muted hover:text-primary"
            >
              {t("profileDropdown.yourProfile")}
            </Link>
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2 text-sm hover:bg-muted hover:text-primary"
            >
              {t("profileDropdown.dashboard")}
            </Link>
          </div>
          <div className="py-1 border-t border-border">
            <button
              onClick={handleLogout}
              className="block w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10"
            >
              {t("profileDropdown.signOut")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
