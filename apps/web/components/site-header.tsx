"use client";

import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { ProfileDropdown } from "@/components/profile-dropdown";

export function SiteHeader() {
  const { user, logout, loading } = useAuth();

  return (
    <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-10">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-semibold tracking-tight">
          Cooksy
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/recipes"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            Browse
          </Link>
          <Link
            href="/recipes/match"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "hidden sm:inline-flex"
            )}
          >
            Match
          </Link>
          {!loading && user && (
            <Link
              href="/dashboard"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              Dashboard
            </Link>
          )}
          <Link
            href="/recipes/new"
            className={cn(buttonVariants({ size: "sm" }))}
          >
            Post Recipe
          </Link>
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
                Log in
              </Link>
            )
          )}
        </nav>
      </div>
    </header>
  );
}
