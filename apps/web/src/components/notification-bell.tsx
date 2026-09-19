"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { api, type AppNotification } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import { cn } from "@/lib/utils";

const POLL_INTERVAL_MS = 30_000;

function notificationText(
  n: AppNotification,
  t: (key: string, vars?: Record<string, string | number>) => string
): string {
  const name = n.actor.name || t("notifications.someone");
  const recipe = n.recipeTitle ? `"${n.recipeTitle}"` : t("notifications.yourRecipe");

  switch (n.type) {
    case "like":
      return t("notifications.liked", { name, recipe });
    case "comment":
      return n.data
        ? t("notifications.commentedWithText", { name, recipe, text: n.data })
        : t("notifications.commented", { name, recipe });
    case "reply":
      return n.data
        ? t("notifications.repliedWithText", { name, recipe, text: n.data })
        : t("notifications.replied", { name, recipe });
    case "rating":
      return n.data
        ? t("notifications.ratedWithStars", { name, recipe, stars: `${n.data}★` })
        : t("notifications.rated", { name, recipe });
    case "tried":
      return t("notifications.tried", { name, recipe });
    default:
      return t("notifications.didSomething", { name, recipe });
  }
}

export function NotificationBell() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const refreshUnreadCount = useCallback(() => {
    if (!user) return;
    api
      .getUnreadNotificationCount()
      .then((r) => setUnreadCount(r.count))
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!user) return;
    refreshUnreadCount();
    const interval = setInterval(refreshUnreadCount, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [user, refreshUnreadCount]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleOpen() {
    const next = !open;
    setOpen(next);
    if (next && !loaded) {
      try {
        const data = await api.getNotifications();
        setNotifications(data);
        setLoaded(true);
      } catch {
        // leave list empty on failure
      }
    }
  }

  async function handleNotificationClick(n: AppNotification) {
    if (!n.isRead) {
      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, isRead: true } : item))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      api.markNotificationRead(n.id).catch(() => {});
    }
    setOpen(false);
  }

  async function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await api.markAllNotificationsRead();
    } catch {
      // best-effort
    }
  }

  if (!user) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={handleOpen}
        aria-label={t("notifications.notifications")}
        className="relative flex size-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-border bg-popover text-popover-foreground shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <p className="text-sm font-semibold">{t("notifications.notifications")}</p>
            {notifications.some((n) => !n.isRead) && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs text-primary hover:underline"
              >
                {t("notifications.markAllRead")}
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted-foreground">
                {t("notifications.noNotificationsYet")}
              </p>
            ) : (
              notifications.map((n) => (
                <Link
                  key={n.id}
                  href={n.recipeId ? `/recipes/${n.recipeId}` : "#"}
                  onClick={() => handleNotificationClick(n)}
                  className={cn(
                    "block border-b border-border px-3 py-2.5 text-sm last:border-0 hover:bg-muted",
                    !n.isRead && "bg-accent/50"
                  )}
                >
                  <p className={cn(!n.isRead && "font-medium")}>{notificationText(n, t)}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
