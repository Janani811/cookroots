"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { LanguageSwitcher } from "@/components/language-switcher";
import { NotificationBell } from "@/components/notification-bell";
import { useTranslation } from "@/lib/i18n/i18n-provider";

function navLinkClass(active: boolean, extra?: string) {
  return cn(
    buttonVariants({ variant: active ? "secondary" : "ghost", size: "sm" }),
    extra
  );
}

export function SiteHeader() {
  const { user, logout, loading } = useAuth();
  const { t } = useTranslation();
  const pathname = usePathname();

  const isMatch = pathname.startsWith("/recipes/match");
  const isBrowse =
    !isMatch &&
    pathname !== "/recipes/new" &&
    (pathname === "/recipes" || pathname.startsWith("/recipes/"));
  const isDashboard = pathname === "/dashboard";
  const isGrocery = pathname.startsWith("/grocery");

  return (
    <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-10">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-12">
        <Link
          href="/"
          className="text-xl font-semibold tracking-tight transition-colors hover:text-primary"
        >
          CookRoots
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link href="/recipes" className={navLinkClass(isBrowse)}>
            {t("header.browse")}
          </Link>
          <Link
            href="/recipes/match"
            className={navLinkClass(isMatch, "hidden sm:inline-flex")}
          >
            {t("header.match")}
          </Link>
          {!loading && user && (
            <Link href="/dashboard" className={navLinkClass(isDashboard)}>
              {t("header.dashboard")}
            </Link>
          )}
          {!loading && user && (
            <Link
              href="/grocery"
              className={navLinkClass(isGrocery, "hidden sm:inline-flex")}
            >
              {t("header.grocery")}
            </Link>
          )}
          <Link
            href="/recipes/new"
            className={cn(buttonVariants({ size: "sm" }))}
          >
            {t("header.postRecipe")}
          </Link>
          <ThemeSwitcher />
          <LanguageSwitcher />
          <NotificationBell />
          {!loading && user ? (
            <div className="flex items-center gap-4">
              <ProfileDropdown user={user} onLogout={logout} />
            </div>
          ) : (
            !loading && (
              <Link
                href="/login"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                {t("header.logIn")}
              </Link>
            )
          )}
        </nav>
      </div>
    </header>
  );
}
